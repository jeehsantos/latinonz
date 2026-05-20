# Plan

## What I’ll fix
1. Align the invite flow with the backend path that already works
   - Keep the role assignment entirely on the privileged backend client.
   - Remove any remaining ambiguity in `inviteManager` so the profile role write cannot fall back to a user-scoped RLS path.

2. Add targeted runtime diagnostics for the invite flow
   - Add temporary server-side logging around `inviteUserByEmail`, the returned `userId`, and the `profiles` upsert result.
   - This will confirm whether the live preview is executing the updated code or an older/stale copy.

3. Force validation against the actual running preview
   - Reproduce the invite from the running app/runtime, not just from isolated shell checks.
   - Confirm the newly invited user’s `profiles.role` changes from `user` to `manager` immediately after invite.

4. Remove the blank-screen failure mode
   - Make the invite handler return a clean, descriptive error path if the role update fails again, instead of dropping into the current generic runtime error screen.

## Why this plan
- The database is creating the invited user correctly.
- The `profiles` trigger is creating the initial row correctly.
- The same role update succeeds when executed directly with the privileged backend client.
- That means the remaining issue is most likely the app/runtime path, not the underlying policy itself.

## Technical details
- Files to update:
  - `src/lib/admin.functions.ts`
- Validation steps:
  - Inspect preview/dev-server logs while reproducing the invite.
  - Confirm the exact `userId` created during invite.
  - Confirm `public.profiles.role` is updated for that `userId`.
  - Re-test delete + re-invite flow for the same email.

## Expected result
- Inviting a manager no longer throws the RLS error.
- Re-inviting a deleted user works.
- The invited user appears on `/admin/managers` with the correct role immediately.