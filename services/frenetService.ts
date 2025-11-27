
import { CartItem, ShippingOption } from "../types";

export const calculateShipping = async (
  originZip: string,
  destinationZip: string,
  items: CartItem[],
  totalValue: number,
  token?: string,
  freeShippingThreshold: number = 0
): Promise<ShippingOption[]> => {
  
  // 1. Sanitize ZIPs
  const cepOrigin = originZip?.replace(/\D/g, '');
  const cepDest = destinationZip?.replace(/\D/g, '');

  if (!cepOrigin || !cepDest || cepDest.length !== 8) {
    return [];
  }

  // 2. Prepare Items Payload for Frenet
  const shippingItems = items.map(item => {
    // Priority: Variation Dimensions -> Product Dimensions -> Default Fallback
    const weight = item.selectedVariation?.weight || item.weight || 0.5;
    const width = item.selectedVariation?.dimensions?.width || item.dimensions?.width || 10;
    const height = item.selectedVariation?.dimensions?.height || item.dimensions?.height || 10;
    const depth = item.selectedVariation?.dimensions?.depth || item.dimensions?.depth || 10;

    return {
      Weight: weight,
      Length: depth,
      Height: height,
      Width: width,
      Quantity: item.quantity,
      SKU: item.selectedVariation?.id || item.id,
      Category: "Perfumes"
    };
  });

  let options: ShippingOption[] = [];

  // 3. Real API Call
  if (token) {
    const url = "https://api.frenet.com.br/shipping/quote";
    const bodyContent = JSON.stringify({
        SellerCEP: cepOrigin,
        RecipientCEP: cepDest,
        ShipmentInvoiceValue: totalValue,
        ShippingItemArray: shippingItems
    });

    try {
      let response;
      
      try {
          // Attempt 1: Direct Call
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "token": token
            },
            body: bodyContent
          });
      } catch (directError) {
          // Attempt 2: CORS Proxy (Fallout for browser-only environments)
          console.warn("Direct Frenet call failed (likely CORS). Retrying with proxy...");
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          
          response = await fetch(proxyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "token": token
            },
            body: bodyContent
          });
      }

      if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ShippingSevicesArray) {
        options = data.ShippingSevicesArray
          .filter((s: any) => !s.Error)
          .map((s: any) => ({
            name: s.ServiceDescription,
            price: parseFloat(s.ShippingPrice),
            deadline: `${s.DeliveryTime} dias úteis`,
            carrier: s.Carrier,
            serviceCode: s.ServiceCode
          }));
      }
    } catch (error) {
      console.warn("Frenet API failed or blocked. Falling back to simulation.", error);
      // Logic proceeds to fallback simulation below automatically
    }
  }

  // 4. Simulation (Fallback if no token or error)
  if (options.length === 0) {
    // Simulating slightly different prices based on ZIP distance logic (simple hash)
    const distanceFactor = parseInt(cepDest.slice(0, 2)) / 10; 
    const baseSedex = 25.00 + (items.length * 2) + distanceFactor;
    const basePac = 15.00 + (items.length * 1.5) + (distanceFactor / 2);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    options = [
        {
        name: 'PAC (Simulado)',
        carrier: 'Correios',
        price: parseFloat(basePac.toFixed(2)),
        deadline: '5 a 9 dias úteis'
        },
        {
        name: 'SEDEX (Simulado)',
        carrier: 'Correios',
        price: parseFloat(baseSedex.toFixed(2)),
        deadline: '2 a 4 dias úteis'
        }
    ];
  }

  // 5. Apply Free Shipping Logic
  if (freeShippingThreshold > 0 && totalValue >= freeShippingThreshold) {
      // Find cheapest option (usually PAC) and make it free
      let cheapestIndex = -1;
      let minPrice = Infinity;
      
      options.forEach((opt, idx) => {
          if (opt.price < minPrice) {
              minPrice = opt.price;
              cheapestIndex = idx;
          }
      });

      if (cheapestIndex !== -1) {
          options[cheapestIndex].price = 0;
          // Note: We don't change the name here, but the UI can detect price === 0
      }
  }

  return options;
};
