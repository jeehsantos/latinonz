# Latino Connect — Backend Implementation Plan

> Guia sequencial para implementar o backend completo, conectando o frontend ao Supabase.
> Baseado no diagrama de casos de uso em `docs/use-case-diagram.md`.
> Seguir a ordem abaixo evita dependências quebradas.

---

## Decisões de Produto Confirmadas

| Decisão | Definição |
|---|---|
| Avaliações | Apenas Google Reviews (via Google Places API). Avaliações nativas podem vir depois. |
| Leads | Visitantes enviam sem conta, mas informam nome + email/WhatsApp. |
| Cadastro | Apenas donos de negócios/organizações. Não há perfil de consumidor. |
| Moderação de leads | Chegam direto ao dashboard do dono, sem moderação. |
| Moderação de perfis | Perfil aparece com badge "Em verificação" até admin aprovar. |
| Eventos | Apenas plano Ultra. |
| Contato Starter | Formulário modal → lead salvo → email ao dono via Resend. Sem botão WhatsApp. |
| Contato Premium | Botão redireciona para WhatsApp do negócio → lead registrado. Sem email. |
| Contato Ultra | Botão redireciona para WhatsApp → lead registrado + email ao dono via Resend. |
| Horários de funcionamento | Exclusivo de Premium+. Starter não configura nem exibe. |
| Opções de atendimento | Exclusivo de Premium+. Starter não configura nem exibe. |
| Cupons | Exclusivo de Premium+. Starter não configura nem exibe. |

---

## Stack & Contexto

- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth (email/password)
- **Storage:** Supabase Storage (fotos, logos)
- **Avaliações:** Google Places API (somente leitura, cache no Supabase)
- **Pagamentos:** Stripe (subscriptions)
- **Email:** Resend
- **WhatsApp:** Twilio
- **Deploy:** Cloudflare Workers via Wrangler
- **Framework:** TanStack Start (server functions via `createServerFn`)
- **Planos:** Starter (grátis) · Premium (NZ$49/mês) · Ultra (NZ$99/mês)

---

## Ordem de Implementação

```
Fase 1 (Auth & Perfis)
        ↓
Fase 2 (Tabela de Negócios)
        ↓
Fase 3 (Storage — Logo & Galeria)
        ↓
Fase 4 (Google Reviews)     Fase 5 (Leads & Notificações)
        ↓                           ↓
Fase 6 (Cupons)             Fase 7 (Analytics)
        ↓
Fase 8 (Pagamentos — Stripe)
        ↓
Fase 9 (Painel Admin)       Fase 10 (QR Code & Eventos)
```

---

## Fase 1 — Autenticação & Perfil de Usuário

> Pré-requisito de tudo. Sem auth nenhuma outra feature funciona.

### 1.1 — Tabela `profiles`

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan_tier IN ('starter', 'premium', 'ultra')),
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'manager', 'admin')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "User updates own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Trigger: cria profile automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.2 — Server Functions de Auth

Arquivo: `src/lib/auth.functions.ts`

- `signUp({ email, password, businessName, ownerName, whatsapp })` — registra + cria entrada em `businesses`
- `signIn({ email, password })` — login, retorna session
- `signOut()` — logout
- `getSession()` — retorna sessão atual (usada em loaders de rota)

### 1.3 — Conectar `/cadastro` e `/login`

- `/cadastro` chama `signUp()` → redireciona para `/dashboard`
- `/login` chama `signIn()` → redireciona para `/dashboard`
- Middleware de auth em `/dashboard/*` e `/admin/*` → redireciona para `/login` se não autenticado
- Usar `src/integrations/supabase/auth-middleware.ts` (já existe)

---

## Fase 2 — Tabela de Negócios

> Core da plataforma. Substitui os dados mock de `src/lib/mock/businesses.ts`.

### 2.1 — Tabela `businesses`

```sql
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  description TEXT CHECK (length(description) <= 500),
  type TEXT NOT NULL DEFAULT 'Serviço'
    CHECK (type IN ('Serviço', 'Produto', 'ONG', 'Grupo')),
  macro_category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[],
  phone TEXT,
  email TEXT,
  website TEXT,
  locations TEXT[],            -- múltiplas cidades
  keywords TEXT[],
  logo_url TEXT,
  google_place_id TEXT,        -- para integração Google Reviews
  is_verified BOOLEAN DEFAULT false,   -- aprovado pelo admin
  is_active BOOLEAN DEFAULT true,
  fast_responder BOOLEAN DEFAULT false,
  response_time TEXT,
  rating NUMERIC(3,2) DEFAULT 0,       -- calculado dos Google Reviews
  review_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Público lê todos (verificados ou não — badge diferencia)
CREATE POLICY "Public reads active businesses"
  ON public.businesses FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Dono edita o próprio
CREATE POLICY "Owner updates own business"
  ON public.businesses FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

-- Dono cria (apenas 1 por usuário — enforced na server function)
CREATE POLICY "Owner inserts own business"
  ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
```

### 2.2 — Tabela `business_hours`

```sql
CREATE TABLE public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  day_key TEXT NOT NULL CHECK (day_key IN ('mon','tue','wed','thu','fri','sat','sun')),
  is_closed BOOLEAN DEFAULT false,
  slots JSONB DEFAULT '[]',    -- [{ open: "09:00", close: "18:00" }]
  UNIQUE(business_id, location, day_key)
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads hours"
  ON public.business_hours FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );

CREATE POLICY "Owner manages own hours"
  ON public.business_hours FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );
```

### 2.3 — Tabela `service_options`

```sql
CREATE TABLE public.service_options (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  takeaway BOOLEAN DEFAULT false,
  dinein BOOLEAN DEFAULT false,
  delivery BOOLEAN DEFAULT false,
  booking BOOLEAN DEFAULT false,
  other TEXT
);

ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads service options"
  ON public.service_options FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );

CREATE POLICY "Owner manages own service options"
  ON public.service_options FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );
```

### 2.4 — Server Functions

Arquivo: `src/lib/business.functions.ts`

- `getBusinesses({ category?, city?, q? })` — lista pública com filtros
- `getBusinessBySlug(slug)` — perfil público individual
- `getMyBusiness()` — perfil do dono autenticado
- `updateMyBusiness(data)` — salva edições do dashboard
- `updateBusinessHours(hours)` — salva horários por filial
- `updateServiceOptions(options)` — salva opções de atendimento (Premium/Ultra)

### 2.5 — Conectar Frontend

- `/directory` e `DirectoryHome` → substituir mock `getBusinesses()` pela server function
- `/business/$slug` → substituir mock `getBusinessBySlug()`
- `/dashboard/profile` → substituir estado local por `getMyBusiness()` + `updateMyBusiness()`
- Badge "Em verificação" vs "Verificado" baseado em `is_verified`

---

## Fase 3 — Storage de Imagens

> Depende da Fase 2.

### 3.1 — Buckets no Supabase Storage

- `business-logos` (público) — logos dos negócios
- `business-gallery` (público) — fotos da galeria

Políticas: qualquer um lê; apenas o dono faz upload/delete no próprio path `{owner_id}/...`

### 3.2 — Tabela `business_photos`

```sql
CREATE TABLE public.business_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads photos"
  ON public.business_photos FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );

CREATE POLICY "Owner manages own photos"
  ON public.business_photos FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );
```

### 3.3 — Server Functions

Arquivo: `src/lib/storage.functions.ts`

- `uploadLogo(file)` — upload para `business-logos/{owner_id}/logo.{ext}`, atualiza `businesses.logo_url`
- `uploadPhoto(file, position)` — upload para `business-gallery/{business_id}/{uuid}.{ext}`, insere em `business_photos`
- `deletePhoto(photoId)` — remove do storage e da tabela
- `reorderPhotos(photoIds)` — atualiza `position` de cada foto

### 3.4 — Conectar Frontend

- `/dashboard/profile` → logo upload chama `uploadLogo()`
- `/dashboard/gallery` → chama `uploadPhoto()` / `deletePhoto()` / `reorderPhotos()`
- Respeitar limite de fotos por plano (`photoLimit` de `src/lib/plans.ts`): Starter = 3, Premium/Ultra = ilimitado

---

## Fase 4 — Google Reviews

> Depende da Fase 2 (precisa do `google_place_id` em `businesses`).
> Avaliações nativas da plataforma **não serão implementadas** nesta fase.

### 4.1 — Tabela `google_reviews` (cache)

```sql
CREATE TABLE public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  google_review_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  published_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, google_review_id)
);

ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads google reviews"
  ON public.google_reviews FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );
```

### 4.2 — Server Functions

Arquivo: `src/lib/reviews.functions.ts`

- `connectGooglePlace(placeId)` — salva `google_place_id` no negócio + dispara primeira sincronização
- `syncGoogleReviews(businessId)` — chama Google Places API, upsert em `google_reviews`, atualiza `businesses.rating` e `businesses.review_count`
- `getReviews(businessId)` — retorna reviews do cache
- `scheduleReviewSync()` — cron job para sincronizar a cada 24h (via Supabase Edge Functions ou Cloudflare Cron)

### 4.3 — Google Places API

- Endpoint: `https://maps.googleapis.com/maps/api/place/details/json?place_id={id}&fields=reviews,rating,user_ratings_total&key={API_KEY}`
- Variável de ambiente: `GOOGLE_PLACES_API_KEY`
- Limite: 5 reviews por chamada na API gratuita. Para mais, usar Places API (New) com campo `reviews` paginado.

### 4.4 — Conectar Frontend

- `/dashboard/profile` → seção "Avaliações Google" com campo para inserir Place ID + botão "Sincronizar"
- `/business/$slug` → seção de avaliações usa `getReviews()` do cache
- Exibir rating médio e total de avaliações do Google no header do perfil

---

## Fase 5 — Leads & Notificações

> Depende da Fase 2. Visitantes enviam sem conta (nome + email/WhatsApp obrigatórios).

### 5.1 — Tabela `leads`

```sql
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  phone TEXT,
  email TEXT,
  message TEXT CHECK (length(message) <= 1000),
  source TEXT DEFAULT 'direct'
    CHECK (source IN ('direct', 'whatsapp', 'email', 'directory')),
  status TEXT DEFAULT 'Pendente'
    CHECK (status IN ('Pendente', 'Contatado', 'Convertido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode enviar um lead (visitante sem conta)
CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Apenas o dono do negócio lê os próprios leads
CREATE POLICY "Owner reads own leads"
  ON public.leads FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

-- Dono atualiza status
CREATE POLICY "Owner updates lead status"
  ON public.leads FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );
```

### 5.2 — Server Functions

Arquivo: `src/lib/leads.functions.ts`

- `submitLead({ businessId, name, phone, email, message })` — cria lead + dispara notificação conforme plano do negócio
- `getMyLeads()` — lista leads do negócio autenticado
- `updateLeadStatus(leadId, status)` — atualiza status

### 5.3 — Lógica de Notificação por Plano

Ao criar um lead, verificar `profiles.plan_tier` do **dono do negócio** (não do visitante):

```
Starter  → Lead salvo + Email via Resend ao dono
           (visitante usou formulário modal — sem WhatsApp)

Premium  → Lead salvo + WhatsApp via Twilio ao dono
           (visitante clicou em redirect WhatsApp — sem email)

Ultra    → Lead salvo + WhatsApp via Twilio ao dono
                      + Email via Resend ao dono
```

### 5.4 — Lógica do Botão de Contato no Perfil Público

O componente de contato em `/business/$slug` deve verificar o plano do negócio e renderizar:

```
Starter  → Botão "Enviar mensagem" → abre modal com formulário
           (campos: nome, email/WhatsApp, mensagem)
           Sem botão de WhatsApp visível

Premium  → Botão "Falar no WhatsApp" → redirect wa.me/{phone}
           Lead registrado via server function no clique

Ultra    → Botão "Falar no WhatsApp" → redirect wa.me/{phone}
           Lead registrado + email enviado ao dono
```

### 5.5 — Conectar Frontend

- `/business/$slug` → componente de contato renderiza conforme plano do negócio:
  - **Starter:** botão "Enviar mensagem" → abre modal com formulário (nome + email/WhatsApp + mensagem) → chama `submitLead()` → email ao dono
  - **Premium:** botão "Falar no WhatsApp" → redirect `wa.me/{phone}` + chama `submitLead()` em background
  - **Ultra:** botão "Falar no WhatsApp" → redirect `wa.me/{phone}` + chama `submitLead()` em background (dispara WhatsApp + email ao dono)
- `/dashboard/leads` → substituir mock `LEADS` por `getMyLeads()`
- Botões "Responder" / "Marcar resolvido" chamam `updateLeadStatus()`

---

## Fase 6 — Cupons

> Depende da Fase 2. Disponível apenas para Premium e Ultra.

### 6.1 — Tabela `coupons`

```sql
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (length(code) BETWEEN 3 AND 30),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2),
  expires_at DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active coupons"
  ON public.coupons FOR SELECT TO anon, authenticated
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );

CREATE POLICY "Owner manages own coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );
```

### 6.2 — Server Functions

- `getMyCoupons()` — lista cupons do negócio autenticado
- `createCoupon(data)` — cria cupom (verifica plano Premium/Ultra antes)
- `toggleCoupon(couponId)` — ativa/desativa
- `deleteCoupon(couponId)` — remove

### 6.3 — Conectar Frontend

- `/dashboard/coupons` → substituir mock por `getMyCoupons()` + `createCoupon()`
- `/business/$slug` → seção de cupons usa `getCouponsByBusiness(businessId)`

---

## Fase 7 — Analytics

> Depende da Fase 2. Disponível apenas para Premium e Ultra.

### 7.1 — Tabela `profile_views`

```sql
CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a view"
  ON public.profile_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owner reads own views"
  ON public.profile_views FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );
```

### 7.2 — Server Functions

- `logProfileView(businessId)` — registra visualização (chamado ao carregar `/business/$slug`)
- `getAnalytics()` — retorna métricas agregadas dos últimos 30 dias:
  - Total de visualizações
  - Total de leads
  - Cliques em contato (WhatsApp, email, site)
  - Taxa de conversão (leads / views)

### 7.3 — Conectar Frontend

- `/business/$slug` loader → chama `logProfileView()`
- `/dashboard/analytics` → substituir dados mock por `getAnalytics()`

---

## Fase 8 — Pagamentos (Stripe)

> Depende das Fases 1 e 2.

### 8.1 — Configuração Stripe

- Criar produtos no Stripe Dashboard: Premium (NZ$49/mês) e Ultra (NZ$99/mês)
- Configurar webhook Stripe apontando para server function `handleStripeWebhook()`
- Armazenar `stripe_customer_id` e `stripe_subscription_id` em `profiles`

### 8.2 — Server Functions

Arquivo: `src/lib/stripe.functions.ts`

- `createCheckoutSession(planTier)` — cria sessão Stripe Checkout
- `createBillingPortalSession()` — abre portal de gerenciamento de assinatura
- `handleStripeWebhook(event)` — processa eventos:
  - `checkout.session.completed` → atualiza `profiles.plan_tier` e `subscription_status`
  - `customer.subscription.updated` → atualiza plano
  - `customer.subscription.deleted` → rebaixa para Starter

### 8.3 — Conectar Frontend

- `/dashboard/upgrade` → botões "Assinar Premium" / "Assinar Ultra" chamam `createCheckoutSession()`
- `/dashboard/settings` → botão "Mudar plano" chama `createBillingPortalSession()`
- Substituir `useCurrentPlan()` (dev mock) por hook real que lê `profiles.plan_tier` do Supabase

---

## Fase 9 — Painel Admin

> Depende de todas as fases anteriores.

### 9.1 — Políticas Admin

```sql
-- Admins e gerentes leem todos os negócios
CREATE POLICY "Admins read all businesses"
  ON public.businesses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
    )
  );

-- Admins aprovam/bloqueiam negócios
CREATE POLICY "Admins update any business"
  ON public.businesses FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
    )
  );
```

### 9.2 — Server Functions Admin

Arquivo: `src/lib/admin.functions.ts`

- `getAdminBusinesses({ filter?, query? })` — lista todos os negócios com status
- `approveBusiness(businessId)` — define `is_verified = true`
- `lockBusiness(businessId)` — define `is_active = false`
- `unlockBusiness(businessId)` — define `is_active = true`
- `getAdminMetrics()` — MRR, ARR, total de negócios por plano, buscas populares
- `getAdminManagers()` — lista usuários com role manager/admin
- `inviteManager({ name, email, role })` — cria usuário com role manager
- `removeManager(userId)` — rebaixa role para user

### 9.3 — Conectar Frontend

- `/admin/` → `getAdminMetrics()` substitui dados calculados do mock
- `/admin/businesses` → `getAdminBusinesses()` + `approveBusiness()` / `lockBusiness()`
- `/admin/managers` → `getAdminManagers()` + `inviteManager()` / `removeManager()`
- `/admin/waitlist` → já conectado (server function `listWaitlist` existe)

---

## Fase 10 — QR Code & Eventos

> QR Code: depende da Fase 2. Eventos: apenas Ultra, depende da Fase 8.

### 10.1 — QR Code

- Geração client-side com biblioteca `qrcode`
- URL do QR: `https://latinoconnecthub.co.nz/business/{slug}`
- Disponível apenas para Premium e Ultra
- `/dashboard/profile` → botão "Gerar QR Code" gera + botão "Baixar" exporta como PNG

### 10.2 — Tabela `events` (Ultra apenas)

```sql
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active events"
  ON public.events FOR SELECT TO anon, authenticated
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );

CREATE POLICY "Ultra owner manages own events"
  ON public.events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.id = b.owner_id
      WHERE b.id = business_id AND b.owner_id = auth.uid() AND p.plan_tier = 'ultra'
    )
  );
```

---

## Regras de Acesso por Plano

| Feature | Starter | Premium | Ultra |
|---|---|---|---|
| Perfil na rede | ✓ básico | ✓ completo | ✓ destaque |
| Badge verificado | ✓ | ✓ | ✓ |
| Fotos | 3 | ilimitado | ilimitado |
| Google Reviews | ✓ | ✓ | ✓ |
| Contato via formulário modal | ✓ | — | — |
| Contato via WhatsApp (redirect) | — | ✓ | ✓ |
| Notificação de lead por email | ✓ | — | ✓ |
| Notificação de lead por WhatsApp | — | ✓ | ✓ |
| Horários de funcionamento | — | ✓ | ✓ |
| Opções de atendimento | — | ✓ | ✓ |
| Cupons | — | ✓ | ✓ |
| Mensagens diretas | — | ✓ | ✓ |
| QR Code | — | ✓ | ✓ |
| Analytics | — | ✓ | ✓ |
| Eventos | — | — | ✓ |
| Posts sociais | — | — | ✓ |
| Destaque no topo | — | — | ✓ |
| WhatsApp comunidade | — | — | ✓ |

---

## Variáveis de Ambiente Necessárias

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Places API
GOOGLE_PLACES_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_ULTRA_PRICE_ID=

# Email (Resend)
RESEND_API_KEY=

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```
