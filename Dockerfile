# ── Deps: install from lockfile only ─────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Dependency layer keyed on the lockfile inputs alone — code changes never
# invalidate it, so rebuilds after app edits skip the entire install.
COPY package.json package-lock.json ./
RUN npm ci


# ── Builder: compile the standalone server bundle ────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* values are inlined into the client bundle at build time —
# they must arrive here as build args, runtime env on the container is
# too late. Empty defaults degrade cleanly (lib/flags.ts): analytics
# no-ops, pricing stays dark, the captcha step is skipped.
# The /auth, /oauth and /api/v1 proxy targets are compiled into the routes
# manifest at build time, so the backend origin must arrive here too; the
# runtime env of the same name only steers server-side fetches.
ARG SPOO_API_URL="https://spoo.me"
ENV SPOO_API_URL=${SPOO_API_URL}
RUN echo "proxy compiled for ${SPOO_API_URL}"
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ARG NEXT_PUBLIC_PRICING=""
ARG NEXT_PUBLIC_HCAPTCHA_SITEKEY=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_CLARITY_ID=""
ENV NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY} \
    NEXT_PUBLIC_PRICING=${NEXT_PUBLIC_PRICING} \
    NEXT_PUBLIC_HCAPTCHA_SITEKEY=${NEXT_PUBLIC_HCAPTCHA_SITEKEY} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    NEXT_PUBLIC_CLARITY_ID=${NEXT_PUBLIC_CLARITY_ID} \
    NEXT_TELEMETRY_DISABLED=1

# Source-map upload runs during `next build` only when these are present
# (CI). Unset → the Sentry bundler plugin is inert and the build still
# succeeds. Org/project are public identifiers, so they ride as ARG/ENV;
# the auth token is secret, so it is mounted only for the build RUN via
# a BuildKit secret — never an ARG/ENV, which would bake it into builder
# layer metadata and leak through the exported build cache.
ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ENV SENTRY_ORG=${SENTRY_ORG} \
    SENTRY_PROJECT=${SENTRY_PROJECT}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    npm run build


# ── Runtime: standalone output only, no node_modules, non-root ───────────
FROM node:22-alpine

# Injected by CI: release version or short sha for edge builds
ARG APP_VERSION=dev
ARG SPOO_API_URL="https://spoo.me"
ENV APP_VERSION=${APP_VERSION} \
    SPOO_BUILT_API_URL=${SPOO_API_URL} \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --gid 1001 --system nodejs \
    && adduser --uid 1001 --system nextjs --ingroup nodejs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
