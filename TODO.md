# TODO

## Service image upload + display enhancement

- [x] Add `service-images` upload logic to `BusinessDashboardPage.tsx` service modal (file input + preview)

- [ ] Implement TypeScript-safe Supabase storage upload using `supabase.storage.from('service-images').upload(...)` and `getPublicUrl()`
- [ ] Insert new service with `image_url` in `services` table alongside name, price, duration
- [ ] Update customer-facing service list rendering to show `<img>` with fallback placeholder when `image_url` is missing
- [ ] Quick build/typecheck to ensure no TS errors

