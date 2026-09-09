# Porks Santa Maria — pedidos online

SaaS de pedidos online do Porks Santa Maria (Porco & Chope): landing page,
cardápio com carrinho/checkout e painel administrativo.

## Setup

1. **Banco**: aplique `supabase/migrations/20260909000000_porks_schema.sql` no
   projeto Supabase (`supabase db push` ou SQL Editor). Ela cria o schema,
   as políticas de RLS, o bucket `porks-images`, as funções
   `create_order` / `find_customer_by_phone` / `is_store_open_at` e dados de
   exemplo do cardápio.
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
