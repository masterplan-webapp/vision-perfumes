/**
 * Vision Perfumes — Cloud Functions (Payment & Shipping Backend)
 * 
 * Endpoints:
 *   - createOrder: Processa pagamentos via Pagar.me V5 (Cartão, PIX, Boleto)
 *   - pagarmeWebhook: Recebe notificações de status do Pagar.me
 *   - calculateShipping: Proxy para API Frenet (cálculo de frete sem CORS)
 */

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const cors = require("cors");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();

// ─── Configuração ──────────────────────────────────────────────────────────────

// Chave secreta do Pagar.me, armazenada como secret do Firebase
const pagarmeSecretKey = defineSecret("PAGARME_SECRET_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");

const PAGARME_API_URL = "https://api.pagar.me/core/v5";

// CORS middleware — permite chamadas do frontend
const corsHandler = cors({ origin: true });

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Faz chamadas autenticadas à API do Pagar.me V5
 */
async function pagarmeRequest(endpoint, body, secretKey) {
  const authToken = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "authorization": `Basic ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Pagar.me API Error:", JSON.stringify(data, null, 2));
    throw new Error(
      data.message || data.errors?.[0]?.message || `API error: ${response.status}`
    );
  }

  return data;
}

/**
 * Formata CPF/CNPJ removendo caracteres especiais
 */
function cleanDocument(doc) {
  return (doc || "").replace(/\D/g, "");
}

/**
 * Formata telefone para o padrão da Pagar.me
 */
function parsePhone(phoneStr) {
  const digits = (phoneStr || "").replace(/\D/g, "");
  return {
    country_code: "55",
    area_code: digits.substring(0, 2),
    number: digits.substring(2),
  };
}

/**
 * Cria uma postagem (pedido) na Frenet para gerar a etiqueta
 */
async function createFrenetPostagem(order, orderId) {
  try {
    // 1. Buscar configurações globais (Token e CEP de Origem)
    const settingsSnap = await db.collection("settings").doc("global").get();
    if (!settingsSnap.exists) {
      console.error("[Frenet] Configurações globais não encontradas.");
      return null;
    }
    const settings = settingsSnap.data();
    const token = settings.frenetToken;
    const originZip = settings.originZip || "01001-000";

    if (!token) {
      console.error("[Frenet] Token não configurado.");
      return null;
    }

    if (!order.shippingServiceCode) {
      console.warn(`[Frenet] Pedido ${orderId} sem shippingServiceCode. Pulando etiqueta.`);
      return null;
    }

    // 2. Montar payload de postagem
    const payload = {
      Seller: {
        ZipCode: originZip.replace(/\D/g, ""),
      },
      Recipient: {
        ZipCode: order.shippingAddress.zip.replace(/\D/g, ""),
        Address: order.shippingAddress.street,
        Number: order.shippingAddress.number,
        Complement: order.shippingAddress.complement || "",
        District: order.shippingAddress.neighborhood,
        City: order.shippingAddress.city,
        State: order.shippingAddress.state,
        Country: "BR",
        Email: order.customerEmail,
        CellPhone: order.customerPhone.replace(/\D/g, ""),
        Document: order.customerDocument.replace(/\D/g, ""),
      },
      ShippingServiceCode: order.shippingServiceCode,
      OrderNumber: orderId,
      Value: order.total,
      Products: order.items.map(item => ({
        Quantity: item.quantity,
        SKU: item.id,
        Description: item.name,
        UnitValue: item.price,
        Weight: item.weight || 0.3,
        Length: item.dimensions?.depth || 15,
        Width: item.dimensions?.width || 15,
        Height: item.dimensions?.height || 10,
      }))
    };

    console.log(`[Frenet] Gerando etiqueta para Pedido #${orderId.slice(0, 8)}...`);

    // 3. Chamar API Frenet
    const response = await fetch("http://api.frenet.com.br/shipping/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": token,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Frenet] Erro na API (${response.status}):`, errorText);
      console.log("[Frenet] Payload enviado:", JSON.stringify(payload));
      return null;
    }

    const data = await response.json();
    console.log(`[Frenet] Etiqueta gerada com sucesso: ${data.OrderId || "OK"}`);
    
    // 4. Salvar o ID da Frenet no pedido para consulta posterior
    if (data.OrderId) {
      await db.collection("orders").doc(orderId).update({
        frenetOrderId: data.OrderId,
        updatedAt: new Date().toISOString()
      });
    }
    
    return data;
  } catch (error) {
    console.error("[Frenet] Erro ao criar postagem:", error.message);
    return null;
  }
}

// ─── createOrder ───────────────────────────────────────────────────────────────

/**
 * Endpoint principal de criação de pedido com pagamento.
 * 
 * Recebe do frontend:
 *   - method: 'credit_card' | 'pix' | 'boleto'
 *   - amount: valor em centavos
 *   - customer: { name, email, document, phone }
 *   - items: [{ id, title, unit_price, quantity }]
 *   - billingAddress: { street, number, complement, neighborhood, city, state, zip }
 *   - cardToken: (apenas para credit_card) token gerado no frontend via Pagar.me
 *   - installments: (opcional) número de parcelas
 */
exports.createOrder = onRequest(
  { 
    secrets: [pagarmeSecretKey],
    cors: true,
    region: "us-central1"
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    try {
      const {
        method,
        amount,
        customer,
        items,
        billingAddress,
        cardToken,
        installments = 1,
      } = req.body;

      // ── Validações ────────────────────────────────────────────────

      if (!method || amount === undefined || amount === null || !customer || !items) {
        res.status(400).json({
          success: false,
          error: "Campos obrigatórios: method, amount, customer, items",
        });
        return;
      }

      // Zero-amount orders (e.g. 100% coupon) — skip payment gateway
      if (amount === 0) {
        console.log(`[Pagar.me] Pedido com valor zero (cupom 100%). Aprovando diretamente.`);
        res.status(200).json({
          success: true,
          transactionId: `free_${Date.now()}`,
          status: "paid",
        });
        return;
      }

      if (method === "credit_card" && !cardToken) {
        res.status(400).json({
          success: false,
          error: "Token do cartão é obrigatório para pagamento com cartão",
        });
        return;
      }

      if (amount < 100) {
        res.status(400).json({
          success: false,
          error: "Valor mínimo de R$ 1,00 (100 centavos)",
        });
        return;
      }

      // ── Montar payload do pedido ──────────────────────────────────

      const cleanedDoc = cleanDocument(customer.document);
      const phone = parsePhone(customer.phone);

      const orderPayload = {
        items: items.map((item) => ({
          amount: item.unit_price,
          description: item.title || "Produto",
          quantity: item.quantity,
          code: item.id,
        })),
        customer: {
          name: customer.name,
          email: customer.email,
          document: cleanedDoc,
          document_type: cleanedDoc.length > 11 ? "CNPJ" : "CPF",
          type: cleanedDoc.length > 11 ? "company" : "individual",
          phones: {
            mobile_phone: phone,
          },
        },
        payments: [],
      };

      // ── Configurar método de pagamento ────────────────────────────

      if (method === "credit_card") {
        const billingAddr = billingAddress || {};
        orderPayload.payments.push({
          payment_method: "credit_card",
          credit_card: {
            installments: installments,
            card_token: cardToken,
            card: {
              billing_address: {
                line_1: `${billingAddr.number || "SN"}, ${billingAddr.street || "Rua"}, ${billingAddr.neighborhood || "Bairro"}`,
                line_2: billingAddr.complement || "",
                zip_code: cleanDocument(billingAddr.zip),
                city: billingAddr.city || "São Paulo",
                state: billingAddr.state || "SP",
                country: "BR",
              },
            },
          },
        });
      } else if (method === "pix") {
        orderPayload.payments.push({
          payment_method: "pix",
          pix: {
            expires_in: 900, // 15 minutos
          },
        });
      } else if (method === "boleto") {
        // Vencimento em 3 dias úteis
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);

        const billingAddr = billingAddress || {};
        orderPayload.payments.push({
          payment_method: "boleto",
          boleto: {
            instructions: "Pagar até a data de vencimento. Não aceitar após o vencimento.",
            due_at: dueDate.toISOString(),
            document_number: cleanedDoc,
            type: "DM",
            billing_address: {
              line_1: `${billingAddr.number || "SN"}, ${billingAddr.street || "Rua"}, ${billingAddr.neighborhood || "Bairro"}`,
              line_2: billingAddr.complement || "",
              zip_code: cleanDocument(billingAddr.zip),
              city: billingAddr.city || "São Paulo",
              state: billingAddr.state || "SP",
              country: "BR",
            },
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: `Método de pagamento não suportado: ${method}`,
        });
        return;
      }

      // ── Chamar API Pagar.me ───────────────────────────────────────

      const secretKey = pagarmeSecretKey.value();
      console.log(`[Pagar.me] Criando pedido: ${method}, R$ ${(amount / 100).toFixed(2)}`);


      const pagarmeOrder = await pagarmeRequest(
        "/orders",
        orderPayload,
        secretKey
      );

      console.log(`[Pagar.me] Pedido criado: ${pagarmeOrder.id}, Status: ${pagarmeOrder.status}`);

      // ── Extrair dados de resposta por método ──────────────────────

      const charge = pagarmeOrder.charges?.[0];
      const lastTransaction = charge?.last_transaction;

      let responseData = {
        success: true,
        transactionId: pagarmeOrder.id,
        chargeId: charge?.id,
        status: pagarmeOrder.status,
      };

      if (method === "credit_card") {
        responseData.cardBrand = lastTransaction?.card?.brand;
        responseData.cardLastDigits = lastTransaction?.card?.last_four_digits;
      } else if (method === "pix") {
        responseData.pixCode = lastTransaction?.qr_code;
        responseData.pixQrCodeUrl = lastTransaction?.qr_code_url;
        responseData.expiresAt = lastTransaction?.expires_at;
      } else if (method === "boleto") {
        responseData.boletoUrl = lastTransaction?.pdf;
        responseData.boletoBarcode = lastTransaction?.line;
        responseData.boletoDueDate = lastTransaction?.due_at;
      }

      res.status(200).json(responseData);

    } catch (error) {
      console.error("[Pagar.me] Erro:", error.message);
      res.status(500).json({
        success: false,
        error: error.message || "Erro ao processar pagamento.",
      });
    }
  }
);


// ─── pagarmeWebhook ────────────────────────────────────────────────────────────

/**
 * Webhook para receber notificações do Pagar.me sobre mudanças de status.
 * Configurar no painel Pagar.me: URL = https://<region>-<project>.cloudfunctions.net/pagarmeWebhook
 * 
 * O Pagar.me envia POST com:
 *   - type: 'order.paid', 'order.payment_failed', 'charge.paid', etc.
 *   - data: { id, status, charges, ... }
 */
exports.pagarmeWebhook = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    try {
      const event = req.body;
      const eventType = event.type;
      const eventData = event.data;

      console.log(`[Webhook] Evento recebido: ${eventType}`);

      if (!eventType || !eventData) {
        res.status(400).send("Invalid webhook payload");
        return;
      }

      // Mapear status do Pagar.me → status do nosso sistema
      const statusMap = {
        "order.paid": "processing",       // Pagamento confirmado → processar envio
        "order.payment_failed": "cancelled",
        "order.canceled": "cancelled",
        "charge.paid": "processing",
        "charge.payment_failed": "cancelled",
        "charge.refunded": "cancelled",
      };

      const newStatus = statusMap[eventType];

      if (newStatus && eventData.id) {
        // Buscar pedido no Firestore pelo ID do Pagar.me
        const ordersRef = db.collection("orders");
        const snapshot = await ordersRef
          .where("pagarmeOrderId", "==", eventData.id)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const orderDoc = snapshot.docs[0];
          const currentStatus = orderDoc.data().status;

          // Só atualizar se o status mudou e faz sentido
          if (currentStatus !== newStatus && currentStatus !== "delivered") {
            await orderDoc.ref.update({
              status: newStatus,
              updatedAt: new Date().toISOString(),
              pagarmeStatus: eventData.status,
            });
            console.log(`[Webhook] Pedido ${orderDoc.id} atualizado: ${currentStatus} → ${newStatus}`);
          }
        } else {
          console.log(`[Webhook] Pedido não encontrado para pagarmeOrderId: ${eventData.id}`);
        }
      }

      // Sempre retornar 200 para o Pagar.me não reenviar
      res.status(200).json({ received: true });

    } catch (error) {
      console.error("[Webhook] Erro:", error);
      // Ainda retorna 200 para evitar retentativas infinitas
      res.status(200).json({ received: true, error: error.message });
    }
  }
);


// ─── calculateShipping ─────────────────────────────────────────────────────────

/**
 * Proxy server-side para a API da Frenet (cálculo de frete).
 * Elimina problemas de CORS que ocorrem ao chamar a Frenet diretamente do browser.
 * 
 * Recebe do frontend:
 *   - originZip: CEP de origem
 *   - destinationZip: CEP de destino
 *   - items: [{ Weight, Length, Height, Width, Quantity, SKU, Category }]
 *   - totalValue: valor total do pedido
 *   - token: token da Frenet
 */
exports.calculateShipping = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    try {
      const { originZip, destinationZip, items, totalValue, token } = req.body;

      // Validações
      if (!originZip || !destinationZip || !items || !token) {
        res.status(400).json({
          success: false,
          error: "Campos obrigatórios: originZip, destinationZip, items, token",
        });
        return;
      }

      const cepOrigin = originZip.replace(/\D/g, "");
      const cepDest = destinationZip.replace(/\D/g, "");

      if (cepDest.length !== 8) {
        res.status(400).json({ success: false, error: "CEP de destino inválido" });
        return;
      }

      // Montar payload Frenet
      const frenetPayload = {
        SellerCEP: cepOrigin,
        RecipientCEP: cepDest,
        ShipmentInvoiceValue: totalValue,
        ShippingItemArray: items,
      };

      console.log(`[Frenet] Cotação: ${cepOrigin} → ${cepDest}, R$ ${totalValue}`);

      // Chamar API Frenet (server-side, sem CORS)
      const response = await fetch("https://api.frenet.com.br/shipping/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": token,
        },
        body: JSON.stringify(frenetPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Frenet] API Error ${response.status}:`, errorText);
        throw new Error(`Frenet API error: ${response.status}`);
      }

      const data = await response.json();

      console.log(`[Frenet] Resposta: ${data.ShippingSevicesArray?.length || 0} opções`);

      // Retornar dados brutos da Frenet para o frontend processar
      res.status(200).json({
        success: true,
        data: data,
      });

    } catch (error) {
      console.error("[Frenet] Erro:", error.message);
      res.status(500).json({
        success: false,
        error: error.message || "Erro ao calcular frete.",
      });
    }
  }
);

// ─── Emails (Resend) ──────────────────────────────────────────────────────────

const formatCurrency = (val) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const getEmailStyles = () => `
  font-family: 'Playfair Display', serif, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
`;

const getBaseEmailTemplate = (content) => `
  <!DOCTYPE html>
  <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f4; padding-bottom: 40px; }
        .main-table { border-spacing: 0; margin: 0 auto; width: 100%; max-width: 600px; background-color: #ffffff; font-family: 'Inter', sans-serif; }
        .header { background-color: #121212; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background-color: #121212; padding: 30px; text-align: center; color: #ffffff; font-size: 12px; }
        .button { background-color: #d4af37; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .h1 { font-family: 'Playfair Display', serif; color: #d4af37; font-size: 28px; margin-bottom: 20px; }
        .h2 { font-family: 'Playfair Display', serif; color: #121212; font-size: 22px; margin-bottom: 15px; border-bottom: 2px solid #d4af37; display: inline-block; padding-bottom: 5px; }
        .order-box { background-color: #f9f9f9; border: 1px solid #eeeeee; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item-row { border-bottom: 1px solid #eeeeee; padding: 12px 0; display: flex; justify-content: space-between; }
        .total-row { padding-top: 15px; font-size: 18px; font-weight: bold; text-align: right; color: #121212; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main-table">
          <tr>
            <td class="header">
              <img src="https://visionperfumes.com.br/assets/logo-horizontal.png" alt="Vision Perfumes" width="280" style="display: block; margin: 0 auto; filter: brightness(0) invert(1);"/>
            </td>
          </tr>
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin-bottom: 10px; font-weight: bold; letter-spacing: 2px;">VISION PERFUMES</p>
              <p style="opacity: 0.7;">Elegância em cada nota.</p>
              <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                <a href="https://visionperfumes.com.br" style="color: #d4af37; text-decoration: none; margin: 0 10px;">Loja</a>
                <a href="https://visionperfumes.com.br/?view=orders" style="color: #d4af37; text-decoration: none; margin: 0 10px;">Meus Pedidos</a>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
`;

/**
 * Trigger: Quando um novo pedido é criado no Firestore
 */
exports.onOrderCreated = onDocumentCreated(
  {
    document: "orders/{orderId}",
    secrets: [resendApiKey],
    region: "us-central1"
  },
  async (event) => {
    const order = event.data.data();
    const orderId = event.params.orderId;
    const resend = new Resend(resendApiKey.value());

    console.log(`[Email] Enviando confirmação de pedido: ${orderId}`);

    const content = `
      <h1 class="h1">Pedido Recebido com Sucesso!</h1>
      <p>Olá, <strong>${order.customerName}</strong>. Agradecemos por escolher a Vision Perfumes.</p>
      <p>Recebemos seu pedido <strong>#${orderId.slice(0, 8)}</strong> e ele já está em nosso sistema. Agora só falta a confirmação do pagamento para iniciarmos a preparação do seu envio.</p>
      
      <h2 class="h2">Detalhes do Pedido</h2>
      <div class="order-box">
        ${order.items.map(item => `
          <div class="item-row">
            <span><strong>${item.quantity}x</strong> ${item.name} ${item.selectedVariation ? `<small style="color: #666">(${item.selectedVariation.size})</small>` : ''}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
          </div>
        `).join('')}
        <div class="total-row">
          Total: ${formatCurrency(order.total)}
        </div>
      </div>

      <div style="margin-top: 30px;">
        <h2 class="h2">Endereço de Entrega</h2>
        <p style="font-size: 14px; color: #555;">
          ${order.shippingAddress.street}, ${order.shippingAddress.number} ${order.shippingAddress.complement ? `- ${order.shippingAddress.complement}` : ''}<br>
          ${order.shippingAddress.neighborhood} - ${order.shippingAddress.city}/${order.shippingAddress.state}<br>
          CEP: ${order.shippingAddress.zip}
        </p>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="https://visionperfumes.com.br/?view=orders" class="button">Acompanhar Pedido</a>
      </div>
    `;

    const html = getBaseEmailTemplate(content);

    try {
      await resend.emails.send({
        from: 'Vision Perfumes <contato@visionperfumes.com.br>',
        to: [order.customerEmail],
        subject: `Pedido Recebido #${orderId.slice(0, 8)} - Vision Perfumes`,
        html: html,
      });

      // Também avisa o admin
      await resend.emails.send({
        from: 'Vision Perfumes <sistema@visionperfumes.com.br>',
        to: ['fabiozacari@gmail.com'],
        subject: `💰 Novo Pedido: ${formatCurrency(order.total)}`,
        html: `<h3>Novo pedido de ${order.customerName}</h3><p>Valor: ${formatCurrency(order.total)}</p><p>ID: ${orderId}</p><p>Email: ${order.customerEmail}</p>`,
      });
    } catch (error) {
      console.error("[Email] Erro ao enviar email de criação:", error);
    }
  }
);

/**
 * Trigger: Quando o status de um pedido é alterado
 */
exports.onOrderUpdated = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    secrets: [resendApiKey],
    region: "us-central1"
  },
  async (event) => {
    const beforeStatus = event.data.before.data().status;
    const afterStatus = event.data.after.data().status;
    const order = event.data.after.data();
    const orderId = event.params.orderId;

    if (beforeStatus === afterStatus) return;

    const resend = new Resend(resendApiKey.value());
    let statusTitle = "Atualização de Pedido";
    let buttonText = "Ver Detalhes";
    let buttonUrl = "https://visionperfumes.com.br/?view=orders";
    let subject = "";
    let messageBody = "";
    let showTracking = false;

    switch (afterStatus) {
      case 'processing':
        subject = `Pagamento Confirmado! 🎉 #${orderId.slice(0, 8)}`;
        statusTitle = "Pagamento Confirmado!";
        messageBody = "Ótimas notícias! Seu pagamento foi processado com sucesso. Nossa equipe já está separando suas fragrâncias com o máximo cuidado.";
        
        // AUTOMAÇÃO: Gerar etiqueta na Frenet
        await createFrenetPostagem(order, orderId);
        break;
      case 'shipped':
        subject = `Seu pedido está a caminho! 🚚 #${orderId.slice(0, 8)}`;
        statusTitle = "Pedido Enviado!";
        messageBody = "Seu pedido foi coletado pela transportadora e já está a caminho da sua residência.";
        showTracking = true;
        buttonText = "Rastrear Entrega";
        buttonUrl = `https://melhorrastreio.com.br/rastreio/${order.trackingCode}`;
        break;
      case 'delivered':
        subject = `Pedido Entregue — Vision Perfumes`;
        statusTitle = "Entregue!";
        messageBody = "Seu pedido acaba de ser entregue. Esperamos que a sua nova fragrância traga momentos inesquecíveis!";
        break;
      case 'cancelled':
        subject = `Pedido Cancelado #${orderId.slice(0, 8)}`;
        statusTitle = "Pedido Cancelado";
        messageBody = "Lamentamos informar que seu pedido foi cancelado. Se você já realizou o pagamento, o estorno será processado automaticamente.";
        break;
      default:
        return;
    }

    const content = `
      <h1 class="h1">${statusTitle}</h1>
      <p>Olá, <strong>${order.customerName}</strong>.</p>
      <p>${messageBody}</p>
      
      ${showTracking && order.trackingCode ? `
        <div class="order-box" style="text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #666;">CÓDIGO DE RASTREIO</p>
          <p style="font-size: 24px; font-weight: bold; color: #121212; margin: 10px 0;">${order.trackingCode}</p>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 40px;">
        <a href="${buttonUrl}" class="button">${buttonText}</a>
      </div>
    `;

    const html = getBaseEmailTemplate(content);

    try {
      await resend.emails.send({
        from: 'Vision Perfumes <contato@visionperfumes.com.br>',
        to: [order.customerEmail],
        subject: subject,
        html: html,
      });

      // Notificar Admin sobre a mudança de status
      await resend.emails.send({
        from: 'Vision Perfumes <sistema@visionperfumes.com.br>',
        to: ['fabiozacari@gmail.com'],
        subject: `🔄 Pedido Atualizado: ${afterStatus.toUpperCase()} - #${orderId.slice(0, 8)}`,
        html: `<h3>Status do pedido de ${order.customerName} mudou para: ${afterStatus}</h3><p>Pedido: #${orderId}</p>`,
      });
    } catch (error) {
      console.error("[Email] Erro ao enviar email de atualização:", error);
    }
  }
);
/**
 * Trigger: Boas-vindas para novos usuários (Via Firestore)
 */
exports.onUserDocumentCreated = onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [resendApiKey],
    region: "us-central1"
  },
  async (event) => {
    const user = event.data.data();
    const resend = new Resend(resendApiKey.value());

    if (!user.email) return;

    console.log(`[Email] Enviando boas-vindas para: ${user.email}`);

    const content = `
      <h1 class="h1">Bem-vindo à Vision Perfumes</h1>
      <p>Olá, <strong>${user.name || ''}</strong>. Ficamos muito felizes em ter você conosco!</p>
      <p>A Vision Perfumes nasceu para oferecer não apenas fragrâncias, mas uma experiência sensorial única através dos melhores perfumes importados do mundo.</p>
      <p>Agora você tem acesso a:</p>
      <ul style="color: #555;">
        <li>Lançamentos exclusivos em primeira mão</li>
        <li>Histórico de pedidos simplificado</li>
        <li>Curadoria personalizada de fragrâncias</li>
      </ul>
      <div style="text-align: center; margin-top: 40px;">
        <a href="https://visionperfumes.com.br" class="button">Explorar Catálogo</a>
      </div>
    `;

    const html = getBaseEmailTemplate(content);

    try {
      await resend.emails.send({
        from: 'Vision Perfumes <contato@visionperfumes.com.br>',
        to: [user.email],
        subject: 'Bem-vindo à Vision Perfumes — Elegância em cada nota',
        html: html,
      });

      // Notificar Admin sobre novo usuário
      await resend.emails.send({
        from: 'Vision Perfumes <sistema@visionperfumes.com.br>',
        to: ['fabiozacari@gmail.com'],
        subject: `👤 Novo Usuário: ${user.name || user.email}`,
        html: `<h3>Novo usuário cadastrado</h3><p>Nome: ${user.name || 'N/A'}</p><p>Email: ${user.email}</p>`,
      });
    } catch (error) {
      console.error("[Email] Erro ao enviar email de boas-vindas:", error);
    }
  }
);
