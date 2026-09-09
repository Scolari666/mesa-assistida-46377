# Porks Santa Maria — pedidos online

SaaS de pedidos online do Porks Santa Maria (Porco & Chope): landing page,
cardápio com carrinho/checkout e painel administrativo.

## Setup

1. **Banco**: aplique as migrações em `supabase/migrations/` **em ordem** no
   projeto Supabase (`supabase db push` ou colando cada uma no SQL Editor,
   uma de cada vez, na ordem dos nomes). Elas criam o schema, as políticas de
   RLS, o bucket `porks-images`, as funções `create_order` /
   `find_customer_by_phone` / `is_store_open_at` / `quote_order` e o cardápio
   real do Porks Santa Maria.
2. **Variáveis de ambiente**: copie `.env.example` para `.env` e preencha
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (chave anon).
3. **Primeiro admin**: acesse `/admin/login` e use a aba "Criar admin". Ela só
   fica disponível enquanto não existe nenhum administrador; depois disso,
   novos admins são cadastrados por quem já tem acesso.
4. **Configurações**: em `/admin/configuracoes` ajuste taxa por km, raio de
   entrega, percentual e pedido mínimo do desconto online, endereço/coordenadas
   do bar e horário de funcionamento.

Preços, taxa de entrega, desconto e horário são sempre recalculados no backend
pela função `create_order` — o cliente só envia produto, variação e quantidade.

## Pagamento online (Stripe)

Pix e cartão de crédito passam pelo Stripe Checkout. O fluxo é: o backend
calcula o valor exato (`quote_order`, nunca confia no valor do navegador),
abre uma sessão do Stripe Checkout para esse valor, e só cria o pedido de
verdade quando o Stripe confirma o pagamento via webhook — nunca antes disso.

Para ativar com uma conta Stripe real:

1. Crie/acesse sua conta em [dashboard.stripe.com](https://dashboard.stripe.com).
   Para testar sem cobrar de verdade, use o modo **Test mode** (chaves
   começam com `sk_test_`/`pk_test_`); para produção, o modo **Live**.
2. Em **Developers → API keys**, copie a **Secret key**.
3. No Vercel, em **Settings → Environment Variables**, adicione (sem prefixo
   `VITE_` — essas nunca vão para o navegador):
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_URL` (mesma URL do projeto Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → **service_role
     key** — nunca a publishable/anon)
4. Faça um deploy (ou redeploy) para essas variáveis entrarem em vigor.
5. Em **Developers → Webhooks** no Stripe, clique **Add endpoint**:
   - URL: `https://seu-dominio.vercel.app/api/stripe-webhook`
   - Evento: `checkout.session.completed`
   - Copie o **Signing secret** (`whsec_...`) gerado e adicione no Vercel como
     `STRIPE_WEBHOOK_SECRET`, depois redeploy de novo.
6. Se sua conta Stripe suportar Pix (recurso regional para contas Brasil),
   ele aparece automaticamente na tela do Stripe Checkout quando o cliente
   escolhe "Pix" no site.

Sem essas variáveis configuradas, o checkout com Pix/cartão mostra um erro
amigável ao cliente ("não foi possível iniciar o pagamento") em vez de
quebrar — pagamento na entrega/retirada (dinheiro, cartão na maquininha)
continua funcionando normalmente, sem depender do Stripe.

## Project info

**URL**: https://lovable.dev/projects/d6bbed2e-c0e9-4c58-94d7-6f54cf93d840

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d6bbed2e-c0e9-4c58-94d7-6f54cf93d840) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d6bbed2e-c0e9-4c58-94d7-6f54cf93d840) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
