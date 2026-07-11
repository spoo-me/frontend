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
# too late. Empty key = analytics no-ops (lib/analytics guards on it).
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ENV NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY} \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# ── Runtime: standalone output only, no node_modules, non-root ───────────
FROM node:22-alpine

# Injected by CI: release version or short sha for edge builds
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION} \
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
