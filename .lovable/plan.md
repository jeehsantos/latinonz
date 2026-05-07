## LatinoNZ — Waitlist MVP

Build the waitlist-gated landing experience for Latino NZ. The current project is a blank template, so this plan also includes a lightweight landing page sitting behind the blur (the reference code assumes one exists).

### 1. Landing page (behind blur)

A simple, on-brand Portuguese landing at `/` with:
- Hero: "LatinoNZ — O diretório da comunidade Latina na Nova Zelândia"
- Short value prop for business owners + consumers
- 3 feature highlights (Visibilidade, Leads, Comunidade)
- Footer

Styled with brand green `#1A5336` and gold `#EFC64E`. Purely decorative for MVP — the waitlist modal opens on top by default.

### 2. Waitlist modal (opens by default)

Centered modal over a blurred + darkened landing (`blur-md brightness-75 pointer-events-none`).

Fields:
- **Nome do Negócio** (text, required)
- **Nome do Responsável** (text, required)
- **WhatsApp** (tel, required, `+64` placeholder, validated as NZ format)
- **E-mail** (email, required)
- **Categoria do Negócio** (dropdown, required) with options:
  Restaurante / Café, Mercado Latino, Beleza & Estética, Saúde & Bem-estar, Serviços Profissionais (Contador, Advogado), Construção & Reformas, Transporte & Mudanças, Limpeza, Educação & Aulas, Eventos & Entretenimento, Imobiliária, Turismo & Viagens, Tecnologia, Moda & Vestuário, Automotivo, Outro

CTA: `Entrar para a Lista de Espera` (`bg-[#1A5336]`, rounded-xl).

Behavior:
- Zod validation client-side (lengths, email, NZ phone)
- Submits to Supabase `waitlist_signups` via Lovable Cloud
- On success, swap modal content to animated `CheckCircle2` success screen with confirmation copy
- Close (X) collapses modal; floating CTA `Entrar na Lista de Espera` reappears bottom-right
- Subtle `Lock` icon top-left → admin access

### 3. Admin dashboard

Route: `/admin` (separate route file, not just a state toggle, so it's deep-linkable).

Access: lightweight password gate on entry (env-stored shared secret checked server-side via a server function — not in client code). Roles table not needed for MVP single admin.

UI:
- Header with `Voltar ao site` button (← back to `/`)
- Metric card: **Total Registrados** (count from table)
- White table: Negócio · Responsável · WhatsApp · E-mail · Categoria · Data
- Search input (filter by business name/email)
- `Exportar` button → CSV download of current list

### 4. Backend (Lovable Cloud / Supabase)

Table `waitlist_signups`:
- `id` uuid pk
- `business_name` text
- `owner_name` text
- `email` text
- `whatsapp_number` text
- `service_category` text
- `created_at` timestamptz default now()
- Unique index on `lower(email)` to prevent duplicates

RLS:
- INSERT: allowed for `anon` with server-side input validation (length + format checks in a server function wrapper — client never writes raw)
- SELECT/DELETE: denied to anon; admin reads go through a server function that verifies the admin password
- Simple per-IP rate limit in the submit server function (in-memory token bucket; acceptable for MVP)

### 5. State & routing

- `/` — landing + modal (modal open by default, controlled by local state)
- `/admin` — dashboard (password-gated server-side)
- Lock icon uses `<Link to="/admin">` so it's a real navigable route

### Technical notes

- Stack: TanStack Start + React + Tailwind + Lucide (already in template)
- `src/routes/index.tsx` — landing + WaitlistModal
- `src/routes/admin.tsx` — dashboard (calls auth-gated server fn)
- `src/components/WaitlistModal.tsx`, `src/components/AdminDashboard.tsx`
- `src/lib/waitlist.functions.ts` — `submitWaitlist`, `listWaitlist`, `verifyAdmin` server functions with Zod validation
- SEO: `head()` on `/` with title, description, og tags targeting "Latino business New Zealand" / "negócios latinos Nova Zelândia"

### Out of scope (MVP)

Full directory, business profiles, search, ads, consumer accounts, reviews. Anything beyond the waitlist funnel.