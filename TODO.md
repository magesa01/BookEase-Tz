# TODO

- [x] Fix category filtering in `src/pages/SearchResultsPage.tsx` so query param `category` can be either DB key (e.g. `clinic`) or human label (e.g. `Clinics`). Ensure Supabase `.eq('category', ...)` receives correct DB key.
- [ ] Update `src/components/Footer.tsx`

  - [ ] Replace contact placeholders with official info (Location, Phone with tel link, Email with mailto link).
  - [ ] Update category links to use human labels in `/search?category=CategoryName` format.
- [ ] Validate build/typecheck and run quick manual tests for category search.

