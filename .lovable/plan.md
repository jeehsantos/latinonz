## Root causes

I traced the full invite flow against the code. There are **four real bugs** stacking on top of each other — the magic-link fix from last round only solved one of them.

1. **`Remover` doesn't delete the user.** `removeManager` only does `update profiles set role='user'`. The auth user keeps existing, so the next invite to the same email hits `inviteUserByEmail` → "already been registered" → falls into the magic-link fallback instead of a fresh invite. That's why `idreamzjsm@gmail.com` was returning `status: "magic_link_sent"` last time and `status: "invited"` only after a real delete.

2. **The waitlist site-gate hijacks `/auth/accept-invite`.** `src/routes/__root.tsx` has `ALLOWED_IN_WAITLIST = ["/", "/admin"]`. When the user clicks the magic link, the app boots in `waitlist` mode and `SiteGate` immediately redirects them to `/` — the accept-invite page never runs `verifyOtp` / `setSession`, so the token gets consumed by the URL handler with nothing to do and the page shows "Convite inválido ou expirado".

3. **The `/admin` guard rejects `manager`.** `src/routes/admin.tsx` `beforeLoad` does `if (profile?.role !== "admin") throw redirect({ to: "/dashboard" })`. A freshly accepted manager gets bounced to `/dashboard`, which then funnels into the empty business profile / waitlist UX. The `AdminLayout` denied screen has the same bug.

4. **Post-login redirects ignore `manager`.** `src/routes/login.tsx` sends only `admin` to `/admin`. `GoogleAuthButton` always hard-navigates to `/dashboard`. So even if a manager signs in correctly, they land in the dashboard.

## Changes

### Backend

- `src/lib/admin.functions.ts` → `removeManager`: replace the role-downgrade with `supabaseAdmin.auth.admin.deleteUser(userId)`. Profile row cascades (or is cleaned with a follow-up `delete from profiles`). Result: re-inviting the same email always takes the clean `invited` path.
- `inviteManager`: keep the existing magic-link fallback as a safety net but it should rarely fire now.

### Frontend guards

- `src/routes/__root.tsx`: extend `ALLOWED_IN_WAITLIST` to include the auth surfaces — `"/auth/accept-invite"` and `"/login"` — and match by `startsWith` so the gate never steals an in-progress auth flow.
- `src/routes/admin.tsx` `beforeLoad`: allow `role in ('admin', 'manager')`. Non-matching roles → `/dashboard`.
- `src/components/admin/AdminLayout.tsx`: same — treat `manager` as authorised. Keep the "Acesso negado" screen only for true `user`/null.
- `src/routes/login.tsx`: after login, route `admin` and `manager` → `/admin`, everyone else → `/dashboard`.
- `src/components/auth/GoogleAuthButton.tsx`: after success, fetch the profile role and `window.location.assign("/admin")` for admin/manager, `/dashboard` otherwise. The OAuth `redirect_uri` stays `/dashboard` — the Google flow then re-evaluates on landing (see next bullet).
- `src/routes/dashboard.tsx` `beforeLoad`: if the signed-in user is admin/manager, `throw redirect({ to: "/admin" })`. This catches the OAuth landing case and the "manager opens /dashboard by mistake" case.

### Accept-invite hardening

`src/routes/auth.accept-invite.tsx` already handles `code` / `token_hash` / hash tokens after the previous fix. The only addition: after `getSession` returns a user, also do a single retry of the profile fetch (the `handle_new_user` trigger inserts asynchronously); if the role is still `user`, the page should treat it as an invite that the backend already set to `manager`/`admin` via upsert — so just re-read once before deciding the redirect target.

## Validation

After the changes I will verify, in this order:

1. Re-invite `idreamzjsm@gmail.com` from `/admin/managers` → response `status: "invited"` (not `magic_link_sent`).
2. From the magic-link email, open `/auth/accept-invite?...` and confirm:
   - the page is **not** redirected by `SiteGate`,
   - the password form renders,
   - on submit the user lands on `/admin` (not `/dashboard`, not waitlist).
3. Sign out, sign back in with the new manager credentials on `/login` → lands on `/admin`.
4. Open `/admin/account` as that manager → can edit name + password.
5. `removeManager` on that user → auth user gone, re-invite works again as a brand-new invite.

## Out of scope

- No DB schema changes. (`profiles.id` already references `auth.users(id)` via the `handle_new_user` trigger; deleting the auth user is enough.)
- No changes to category/business management or the email template.
- No new RLS policies.