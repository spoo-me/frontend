## What this changes

<!-- One or two sentences. Link the issue if there is one: Closes #123 -->

## Why

<!-- The constraint or problem behind it. Skip if it is obvious from the title. -->

## Screenshots

<!-- Required for anything visual. Both themes if the change touches color. Delete this section otherwise. -->

## Checks

- [ ] `npx biome ci .` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Checked in both light and dark mode (if visual)

## Notes

- [ ] Needs a backend change to land first
- [ ] Changes a wire type in `lib/api/`, and the mock in `app/api/mock/` was updated to match
- [ ] Adds or changes a `NEXT_PUBLIC_*` switch, and it is declared in `lib/flags.ts`
- [ ] Changes how the app is run or configured, and the README was updated
