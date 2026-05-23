## Goal
Make admin package changes reliably update the business owner’s access to premium and ultra features without triggering RLS/runtime errors.

## Root cause identified
- `src/lib/admin.functions.ts` updates a business owner’s entry in `profiles` when an admin changes the package.
- Some users appear to be missing a `profiles` row, so the flow falls back to an insert.
- The backend snapshot shows the trigger function for automatic profile creation exists in migrations, but the current backend state reports no active triggers, so profile rows may not be created automatically for new users.
- That fallback insert is the path failing with `new row violates row-level security policy for table "profiles"`.
- Premium access in the app is mainly driven by `profiles.plan_tier`, with `subscription_status` also referenced in some admin/billing logic.

## Plan
1. Update the admin package-change function
- Replace the fragile update-or-insert branch with a safe server-side write path.
- Handle both cases cleanly:
  - profile exists: update `plan_tier`
  - profile missing: bootstrap the row safely, then apply the plan
- Verify the saved value after the write.

2. Restore profile auto-creation for future users
- Add a backend migration to ensure the auth-user trigger exists.
- Make the trigger function idempotent so duplicate profile creation cannot crash.
- Keep the existing security model intact.

3. Align access with the business rule
- Confirm the package change updates the fields actually used to unlock premium features.
- If needed, include `subscription_status` handling only where the current app logic depends on it.

4. Validate the affected flow
- Test package changes for owners with and without an existing `profiles` row.
- Confirm the runtime error is gone.
- Confirm the upgraded user now receives premium or ultra access from the stored profile data.

## Technical details
- Files likely involved:
  - `src/lib/admin.functions.ts`
  - one new migration under `supabase/migrations/`
- Backend fix shape:
  - restore `on_auth_user_created`
  - make `handle_new_user()` use an idempotent insert pattern
- App fix shape:
  - avoid the current insert path that falls into `profiles` RLS failure
  - verify the stored plan after mutation

## Expected outcome
After the fix, when an admin changes a business package, the owner profile is updated consistently in the database and the user gains access to the corresponding premium features without the blank-screen runtime error.