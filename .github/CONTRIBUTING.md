# Contributing Guidelines

Thanks for considering a contribution to the spoo.me frontend. Every fix helps.

This repo is the web app only. Anything about the API, redirects, database or self-hosting the backend belongs in [spoo-me/spoo](https://github.com/spoo-me/spoo).

## Quick Start

You do not need a backend to work on this. The repo ships a mock one.

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/frontend.git
cd frontend

npm install
npm run dev:mock
```

Visit <http://localhost:3001>. Any email and password signs in, any 6 digits pass the OTP step, and the workspace arrives pre-filled with links, domains, webhooks, keys and click history.

The dataset is seeded from a fixed PRNG in `app/api/mock/[...path]/seed.ts`, so the numbers are identical on every restart. State lives in the dev-server process: restart, or hit `GET /api/mock/reset`, to start over.

Use `npm run dev` instead if you want the real API. It expects a spoo.me backend on `http://localhost:8000`; override with `SPOO_API_URL`. See the [README](../README.md) for the optional environment variables.

> [!NOTE]
> `dev` and `dev:mock` use separate build directories (`.next` and `.next-mock`) and separate ports, so you can run both at once.

## Development Workflow

1. Branch off `main`: `git checkout -b feat/my-change`
2. Make the change
3. Run the checks below
4. Push and open a pull request

## Checks CI runs

`.github/workflows/ci.yml` runs these on every pull request, in this order. Run them locally first.

```bash
npx biome ci .     # formatting + Tailwind class order (npm run format writes fixes)
npm run typecheck  # tsc --noEmit
npm test           # vitest
npm run build      # next build
```

Notes on each:

- **Biome, not Prettier.** `npm run format` is `biome check --write .`. It also sorts Tailwind classes on `className`, `cn()` and `cva()`, which is a lint error when wrong, not a preference.
- **`npm run build` is the real smoke test.** Server and client boundary mistakes pass `tsc` and then explode here. Do not skip it.
- **`npm run lint` (eslint) is not yet a CI gate.** There is a backlog of react-hooks errors in vendored `components/ui`. New code should still be clean.
- Tests are Vitest in a node environment. Only `lib/**/*.test.ts`, `hooks/**/*.test.ts` and `proxy.test.ts` are collected; see `vitest.config.ts`.

## Conventions

- **TypeScript strict.** No `any` escape hatches in new code.
- **Comments explain why.** The codebase leans on block comments at the top of a module stating the constraint it exists to satisfy. Match that. Do not narrate what the code already says.
- **Every `NEXT_PUBLIC_*` switch is declared in `lib/flags.ts`,** with what it hides and when it dies. No other module reads `process.env.NEXT_PUBLIC_*` directly.
- **Wire types live in `lib/api/`,** one module per backend surface. If you change a wire shape, change the mock in `app/api/mock/` in the same commit so the two never drift.
- **UI primitives come from the registry.** `npx shadcn@latest add <name>` for shadcn, `npx shadcn@latest add "https://magicui.design/r/<name>"` for Magic UI, `npx shadcn@latest add "@aceternity/<name>"` for Aceternity. Do not hand-copy them.

## Pull Request Guidelines

- Keep the PR focused on one change
- All CI checks must pass
- Screenshots or a short clip for anything visual, in both themes if the change touches color
- [Conventional commit](https://www.conventionalcommits.org/) messages: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Update the README if you change how the app is run or configured

## Getting Help

- [Discord](https://spoo.me/discord) for real-time help
- [GitHub Issues](https://github.com/spoo-me/frontend/issues) for bugs and feature requests
- [Documentation](https://docs.spoo.me) for API details

## License

AGPL-3.0. See [LICENSE](../LICENSE). By contributing you agree your work is licensed the same way.
