import { CartItem, ShippingOption } from "../types";
import { getSiteSettings } from "./settingsService";

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

  // 2. Prepare Items Payload for Melhor Envio
  const shippingItems = items.map(item => {
    const weight = item.selectedVariation?.weight || item.weight || 0.5;
    const width = item.selectedVariation?.dimensions?.width || item.dimensions?.width || 10;
    const height = item.selectedVariation?.dimensions?.height || item.dimensions?.height || 10;
    const depth = item.selectedVariation?.dimensions?.depth || item.dimensions?.depth || 10;

    return {
      id: item.selectedVariation?.id || item.id,
      weight: weight,
      width: width,
      height: height,
      length: depth, // ME uses length instead of depth
      quantity: item.quantity,
      insurance_value: item.price * item.quantity // ME uses insurance for value
    };
  });

  let options: ShippingOption[] = [];

  // 3. Try Cloud Function proxy
  if (token) {
    try {
      const settings = await getSiteSettings();
      const backendUrl = settings.apiBaseUrl;

      if (backendUrl && backendUrl.startsWith('http')) {
        console.log("[Frete] Calculando via Cloud Function proxy (Melhor Envio)...");

        const targetUrl = backendUrl.includes('a.run.app') || backendUrl.endsWith('/calculateShipping') 
          ? backendUrl 
          : `${backendUrl}/calculateShipping`;

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originZip: cepOrigin,
            destinationZip: cepDest,
            items: shippingItems,
            totalValue,
            token,
            sandbox: settings.melhorEnvioSandbox
          }),
        });

        if (!response.ok) {
          throw new Error(`Proxy responded with status ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && Array.isArray(result.data)) {
          options = result.data
            .filter((s: any) => !s.error && s.price)
            .map((s: any) => ({
              name: s.name,
              price: parseFloat(s.price),
              deadline: `${s.delivery_time} dias úteis`,
              carrier: s.company.name,
              serviceCode: s.id.toString()
            }));

          console.log(`[Frete] ${options.length} opções recebidas via proxy (ME).`);
        }
      } else {
        throw new Error("No backend URL configured");
      }

    } catch (proxyError) {
      console.warn("[Frete] Proxy falhou, caindo para simulação...", proxyError);
    }
  }

  // 4. Simulation (Fallback se sem token ou falha)
  if (options.length === 0) {
    const distanceFactor = parseInt(cepDest.slice(0, 2)) / 10; 
    const baseSedex = 25.00 + (items.length * 2) + distanceFactor;
    const basePac = 15.00 + (items.length * 1.5) + (distanceFactor / 2);

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
      }
  }

  return options;
};
