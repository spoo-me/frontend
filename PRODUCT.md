# Product

## Register

brand

## Platform

web

## Users

People looking for a Bitly / Dub / Short.io-class link management platform — marketers, creators, and everyday link-sharers evaluating alternatives. The exact niche is still being found, so the site can't afford gaps against the incumbents: it must read as a complete platform, simple yet feature-packed. Developers and power users are a real secondary audience — the API is one of the biggest hooks and gets heavy use — but the site must never assume the visitor is technical.

## Product Purpose

spoo.me is a free, open-source, API-first link management platform with genuinely premium analytics, self-hostable in one command. It has real scale: 100M+ clicks tracked, 5M+ links shortened, ~400k daily traffic. Success for a visitor session is an account signup; once paid plans arrive (currently dark-launched behind a flag), converting some of those users to paid is the follow-on goal. Every surface must already withstand that transition — nothing can read as a hobby project.

## Positioning

Link analytics you'd pay for elsewhere — with an API-first core and open-source trust. Analytics leads because it's the strongest real capability today; the API and ecosystem are supporting hooks, and open source is credibility rather than the leverage.

## Conversion & proof

- Primary CTA: account signup (into the hosted spoo.me dashboard).
- Secondary path: the instant shortener — shorten a link on the page with zero commitment, then let the analytics upsell follow. GitHub remains a quieter tertiary link for stars and OSS credibility.
- The line a visitor remembers after 10 seconds: "the link platform with analytics the paid tools charge for." ("Free" is never the lead adjective anywhere on the site — it lives only in CTAs and friction copy. See docs/landing-v2-plan.md §1.)
- Belief ladder: (1) this is a real, substantial platform, not a side project — 100M+ clicks, 400k daily visitors; (2) the analytics are genuinely premium-grade; (3) I can try it right now with zero commitment; (4) signing up unlocks the full dashboard and it costs me nothing to start.
- Proof on hand: real usage numbers in `lib/site-config.ts` (100M clicks, 5M links, 99.99% uptime, 8 ecosystem apps, 6 SDKs), a testimonials page (`app/testimonials`), GitHub stars and contributors. There is no structured customer/logo base to market with (unlike Dub's startup-logo wall) — lean on scale numbers and product-real UI instead of logo walls.

## Brand Personality

Confident, polished, approachable. Quiet confidence backed by real numbers rather than hype. Technical depth is present — the API and power users are real — but never worn as a costume: no terminals-and-code-everywhere aesthetic. The site should feel like a serious product company that a non-developer trusts instantly and a developer respects on closer inspection.

## Anti-references

- A Dub.co lookalike — do not read as a clone of the closest competitor's minimal black-and-white aesthetic.
- Hobby / side-project energy — GitHub-readme vibes, default-Tailwind look, badge walls. The platform has very real users; the site must never undercut charging money later.
- Terminal-and-code-everywhere developer aesthetic — the technical audience is secondary and the primary audience isn't technical.

## Design Principles

1. **Show the analytics, don't claim them.** The dashboard and analytics UI are the proof of the positioning — product-real interfaces beat abstract illustration everywhere a claim is made.
2. **Scale speaks quietly.** Real numbers (100M clicks, 400k daily) carry the credibility; state them plainly and let them work. No hype adjectives doing the numbers' job.
3. **Taste before trust.** Zero-commitment activation (the instant shortener) comes before any signup ask; the product experience is the best sales pitch.
4. **Serious enough to charge for.** Every page must survive the arrival of paid plans without redesign — polish to the level of a funded SaaS, because the perception gap is the revenue gap.
5. **Depth without the costume.** API, SDKs, and self-hosting are discoverable for power users without making the surface feel like a developer tool.

## Accessibility & Inclusion

No formal compliance target from day one. Follow good defaults: readable contrast, keyboard-reachable interactions, and reduced-motion alternatives where animation is heavy (particles, marquees, globe).
