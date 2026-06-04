## Finish category refactor

Complete the remaining work from the previous turn so the build passes and category labels render consistently from `categories.json`.

### 1. i18n keys
Add to `en.json`, `es.json`, `pt.json` under `profile`:
- `group_asterisk` — "Group *" / "Grupo *" / "Grupo *"
- `group_placeholder` — "Select a group" / "Selecciona un grupo" / "Selecione um grupo"

### 2. Display labels via `getCategoryByKey`
Replace raw `macro_category` / `subcategory` text with the localized label from `useCategories().getCategoryByKey(key)?.label` in:
- `src/components/BusinessCard.tsx`
- `src/routes/index.tsx` (DirectoryHome featured cards)
- `src/routes/business.$slug.tsx` (or equivalent profile page)
- Anywhere else a category is rendered

Fallback to the raw value if the key is unknown (legacy data safety).

### 3. Simplify `directory.tsx` filtering
Since `getBusinesses` now filters by `category_group` server-side, remove the duplicate client-side group filtering branch. Filter chips pass either a `group` id or a category `key` directly to the server fn.

### 4. Verify
- Build passes (no missing i18n key error)
- `/dashboard/profile` shows both Group + Category selects, saves both fields
- Directory + BusinessCard show localized labels (e.g. "Restaurante" not "restaurant")
- Group filter chips return correct results
- Legacy-migrated businesses show their new category label
