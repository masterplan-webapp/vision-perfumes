# Setup Production - Vision Perfumes

## Checklist de Configuração para Uso Real

Este documento descreve todos os passos necessários para colocar o Vision Perfumes em produção.

---

## 1. VARIÁVEIS DE AMBIENTE

### 1.1 Configurar em Vercel (Production)

```bash
# Firebase/Google
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=vision-perfumes
VITE_FIREBASE_AUTH_DOMAIN=vision-perfumes.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_STORAGE_BUCKET=vision-perfumes.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Gemini API
VITE_API_KEY=<sua_chave_gemini>

# Payment Gateway (escolha um)
# Opção A: Stripe
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx (apenas backend)

# Opção B: Pagar.me
PAGARME_ENCRYPTION_KEY=xxx
PAGARME_API_KEY=xxx

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXX

# Email Service
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=noreply@visionperfumes.com

# Frenet (Frete)
FRENET_API_KEY=xxx
FRENET_CNPJ=xxx
```

### 1.2 Configurar .env.local (Local Development)

Copiar `.env` existente e preencher com valores locais/sandbox

---

## 2. INTEGRAÇÕES DE PAGAMENTO

### 2.1 Configurar Stripe (Recomendado)

[ ] Criar conta em https://stripe.com
[ ] Obter chaves Públicas e Secretas (Live)
[ ] Adicionar chaves ao Vercel
[ ] Implementar checkout com `@stripe/react-stripe-js`
[ ] Testar fluxo de pagamento em modo live
[ ] Configurar webhooks para receber eventos

**Arquivo a criar:** `services/stripeService.ts`

### 2.2 Alternativamente: Pagar.me

[ ] Criar conta em https://pagar.me
[ ] Obter API Key e Encryption Key
[ ] Adicionar chaves ao Vercel
[ ] Implementar checkout
[ ] Testar fluxo de pagamento

---

## 3. GOOGLE ANALYTICS 4 (GA4)

### 3.1 Setup GA4

[ ] Criar propriedade GA4 em Google Analytics
[ ] Obter ID da propriedade (G-XXXXX)
[ ] Instalar @react-ga/[email protected]
[ ] Adicionar ao `App.tsx`:

```typescript
import ReactGA from 'react-ga4';

ReactGA.initialize(import.meta.env.VITE_GOOGLE_ANALYTICS_ID!);
```

### 3.2 Tracking de Eventos

[ ] Evento: "view_item" - quando produto é visto
[ ] Evento: "add_to_cart" - adicionar ao carrinho
[ ] Evento: "purchase" - compra completada
[ ] Evento: "lead" - contato enviado

---

## 4. EMAIL SERVICE (SendGrid)

### 4.1 Configurar SendGrid

[ ] Criar conta em https://sendgrid.com
[ ] Verificar domínio (vision-perfumes.com)
[ ] Obter API Key
[ ] Instalar `@sendgrid/mail`
[ ] Criar arquivo `services/emailService.ts`

### 4.2 Templates de Email

[ ] Email de confirmação de pedido
[ ] Email de notificação de envio
[ ] Email de contato recebido
[ ] Email de resetar senha

---

## 5. SEGUNHANÇA E COMPLIANCE

### 5.1 Firestore Security Rules

[ ] Verificar regras atuais em Firebase Console
[ ] Implementar rate limiting
[ ] Adicionar validação de CORS
[ ] Testar permissions com diferentes usuários

### 5.2 Variações HTTPS

[ ] Certificado SSL ativo (Vercel configura automaticamente)
[ ] Redirecionar HTTP para HTTPS
[ ] Testar em navegador

### 5.3 LGPD/Privacy

[ ] Adicionar Privacy Policy
[ ] Adicionar Terms of Service
[ ] Consentimento de cookies
[ ] Direito de exclusão de dados

---

## 6. PERFORMANCE E CDN

### 6.1 Otimizações

[ ] Minificar JavaScript/CSS
[ ] Comprimir imagens (usar Cloudinary ou similiar)
[ ] Implementar lazy loading de imagens
[ ] Cache de assets com Vercel CDN (automático)
[ ] Testar Core Web Vitals

### 6.2 Monitoramento

[ ] Ativar Speed Insights no Vercel
[ ] Ativar Web Analytics no Vercel
[ ] Configurar alertas para erros

---

## 7. BACKUP E DISASTER RECOVERY

### 7.1 Firestore Backup

[ ] Habilitar backups automáticos do Firestore
[ ] Configurar retention policy (30 dias mínimo)
[ ] Testar restauração de backup

### 7.2 CI/CD

[ ] GitHub Actions para testes automáticos
[ ] Verificar linting antes de merge
[ ] Deploy automático ao fazer push em main

---

## 8. TESTES

### 8.1 Testes End-to-End

[ ] Criar conta de usuário
[ ] Buscar produtos
[ ] Adicionar ao carrinho
[ ] Checkout completo com pagamento
[ ] Confirmar pedido no Firestore
[ ] Receber email de confirmação

### 8.2 Testes de Segurança

[ ] Testar autenticação é requerida
[ ] Testar permissões de admin
[ ] Testar rate limiting
[ ] Testar CORS

---

## 9. MONITORAMENTO E LOGGING

### 9.1 Error Tracking

[ ] Integrar Sentry ou similar
[ ] Capturar erros do frontend
[ ] Capturar erros do Firebase
[ ] Alertas para erros críticos

### 9.2 Analytics

[ ] Acompanhar conversão de vendas
[ ] Acompanhar taxa de abandono do carrinho
[ ] Acompanhar páginas mais visitadas
[ ] Relatórios mensais

---

## 10. DOMÍNIO E DNS

### 10.1 Apontar Domínio

[ ] Registrar domínio (se ainda não tiver)
[ ] Apontar DNS para Vercel
[ ] Adicionar CNAME em registrador de domínio
[ ] Aguardar propagação DNS (até 24h)
[ ] Configurar em Vercel > Domains

### 10.2 Certificado SSL

[ ] Vercel configura automaticamente
[ ] Testar em https://visionperfumes.com

---

## 11. CHECKLIST FINAL

- [ ] Todas variáveis de ambiente configuradas
- [ ] Pagamentos funcionando (teste com cartão de teste)
- [ ] Emails sendo enviados
- [ ] GA4 rastreando eventos
- [ ] Firestore fazendo backup
- [ ] Domínio apontando corretamente
- [ ] HTTPS ativo
- [ ] Testes end-to-end passando
- [ ] Monitoramento de erros ativo
- [ ] Performance otimizada (Lighthouse > 90)

---

## Timeline Estimado

- Integração de pagamentos: 2-3 horas
- GA4 + Email Service: 1-2 horas
- Testes e validação: 2-3 horas
- Deploy e monitoramento: 1-2 horas

**Total: 6-10 horas de desenvolvimento**

---

## Referências

- Stripe: https://stripe.com/docs/checkout
- Pagar.me: https://docs.pagar.me
- Firebase: https://firebase.google.com/docs
- SendGrid: https://docs.sendgrid.com
- GA4: https://support.google.com/analytics
