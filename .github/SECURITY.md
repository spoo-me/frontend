# Security Policy

## Supported Versions

Security fixes are applied to the latest version. The deployed frontend at <https://spoo.me> always tracks the most recent release.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing [security@spoo.me](mailto:security@spoo.me). Do not open a public issue. We will respond as quickly as possible.

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce it, including the URL and browser if relevant.
- Any potential fixes or mitigations you have identified.

Findings that affect the API, redirects or the database belong in [spoo-me/spoo](https://github.com/spoo-me/spoo/security), but the same address works for both. When in doubt, send it here.

## Scope Notes

- `NEXT_PUBLIC_*` values are inlined into the client bundle at build time. They are public by design (analytics keys, captcha sitekeys, the browser Sentry DSN), so finding one in the shipped JavaScript is expected, not a vulnerability.
- Authentication tokens live in HttpOnly cookies set by the backend and proxied same-origin. The frontend never reads or stores them in JavaScript.
- The mock backend under `app/api/mock/` is inert unless `SPOO_MOCK=1` is set, which never happens in a production build.

## Security Updates

We announce security updates through the [GitHub repository](https://github.com/spoo-me/frontend) and the [Discord server](https://spoo.me/discord). Watch the repo to stay informed.

## Security Best Practices

If you self-host this frontend:

- Keep dependencies current and apply patches promptly.
- Serve it over HTTPS only, with the backend on the same origin so the auth cookies stay first-party.
- Set strong, unique credentials on the backend it points at, and enable two-factor authentication where possible.
- Monitor your deployment for suspicious activity and respond promptly.

## Contact

Questions or anything else: [security@spoo.me](mailto:security@spoo.me).
