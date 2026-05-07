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

      if (!method || !amount || !customer || !items) {
        res.status(400).json({
          success: false,
          error: "Campos obrigatórios: method, amount, customer, items",
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
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
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

    const itemsList = order.items.map(item => `
      <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
        <strong>${item.name}</strong> ${item.selectedVariation ? `(${item.selectedVariation.size})` : ''}<br/>
        Qtd: ${item.quantity} x ${formatCurrency(item.price)}
      </div>
    `).join('');

    const html = `
      <div style="${getEmailStyles()}">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://visionperfumes.com.br/assets/logo-horizontal.png" alt="Vision Perfumes" style="height: 60px; width: auto;"/>
        </div>
        <h2 style="color: #d4af37;">Obrigado pelo seu pedido, ${order.customerName}!</h2>
        <p>Recebemos seu pedido <strong>#${orderId.slice(0, 8)}</strong> e ele já está registrado.</p>
        
        <h3>Resumo do Pedido</h3>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
          ${itemsList}
          <div style="margin-top: 15px; text-align: right; font-size: 18px;">
            <strong>Total: ${formatCurrency(order.total)}</strong>
          </div>
        </div>

        <p>Assim que o pagamento for confirmado, iniciaremos o processo de envio.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">Vision Perfumes — Elegância em cada nota.</p>
      </div>
    `;

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
        to: ['admin@visionperfumes.com.br'],
        subject: `💰 Novo Pedido: ${formatCurrency(order.total)}`,
        html: `<h3>Novo pedido de ${order.customerName}</h3><p>Valor: ${formatCurrency(order.total)}</p><p>ID: ${orderId}</p>`,
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
    let subject = `Atualização do seu pedido #${orderId.slice(0, 8)}`;
    let messageBody = "";
    let showTracking = false;

    switch (afterStatus) {
      case 'processing':
        subject = `Pagamento Confirmado! 🎉 #${orderId.slice(0, 8)}`;
        messageBody = "Ótimas notícias! Seu pagamento foi confirmado. Já estamos separando suas fragrâncias com todo carinho.";
        break;
      case 'shipped':
        subject = `Seu pedido está a caminho! 🚚 #${orderId.slice(0, 8)}`;
        messageBody = "Seu pedido foi coletado pela transportadora e já está a caminho.";
        showTracking = true;
        break;
      case 'delivered':
        subject = `Pedido Entregue — Vision Perfumes`;
        messageBody = "Seu pedido foi entregue! Esperamos que a experiência seja incrível.";
        break;
      case 'cancelled':
        subject = `Pedido Cancelado #${orderId.slice(0, 8)}`;
        messageBody = "Infelizmente seu pedido foi cancelado. Se houver dúvidas, responda a este e-mail.";
        break;
      default:
        return;
    }

    const html = `
      <div style="${getEmailStyles()}">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://visionperfumes.com.br/assets/logo-horizontal.png" alt="Vision Perfumes" style="height: 60px; width: auto;"/>
        </div>
        <h2 style="color: #d4af37;">Olá, ${order.customerName}</h2>
        <p>${messageBody}</p>
        
        ${showTracking && order.trackingCode ? `
          <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #cce3ff;">
            <strong>Código de Rastreio:</strong> ${order.trackingCode}<br/>
            <a href="https://melhorrastreio.com.br/rastreio/${order.trackingCode}" style="color: #0066cc; font-weight: bold;">Acompanhar Entrega</a>
          </div>
        ` : ''}

        <p>Atenciosamente,<br/><strong>Equipe Vision Perfumes</strong></p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: 'Vision Perfumes <contato@visionperfumes.com.br>',
        to: [order.customerEmail],
        subject: subject,
        html: html,
      });
    } catch (error) {
      console.error("[Email] Erro ao enviar email de atualização:", error);
    }
  }
);
