# ADR-0020 — Contact mail through Gmail SMTP, guarded by Cloudflare Turnstile

- **Status**: Accepted
- **Date**: 2026-11-15

## Context

ADR-0007 settled that the contact form posts to the API, which validates, rate-limits and relays — never a mail key in the browser. It left open _what_ relays and _how_ a public, unauthenticated route keeps spam out. The form shipped first and told visitors that sending was not available yet (STATUS.md).

Constraints: a single owner, a single mailbox, low volume (a handful of messages a month), an OVH VPS with no mail server of its own, and a site whose whole point is to be reachable by recruiters — a message lost to a spam filter or a captcha a visitor cannot solve is a lost contact.

Stéphane decided on 2026-11-15: Gmail SMTP sending from and to his own address, and Cloudflare Turnstile as an invisible captcha.

## Decision

**Sending.** `POST /api/contact` relays through SMTP with **nodemailer** (the "email delivery" case ADR-0007 names), from a `mailer` plugin. In production it talks to `smtp.gmail.com:465` over TLS, authenticated with a Google **app password**; `From` and `To` are both his address, `Reply-To` the visitor's, the body plain text. Host, port, user, password and recipient live only in the server `.env` (`SMTP_*`, `CONTACT_TO`). In development the defaults point at **Mailpit** (`infra/docker-compose.yml`, SMTP 1025, inbox on 8025), so nothing leaves the machine.

**Spam.** The form carries a **Cloudflare Turnstile** token, rendered `interaction-only` and executed on submit: invisible unless Cloudflare wants the visitor to act. The API verifies it at `siteverify` with `TURNSTILE_SECRET` (server `.env`) **before** anything is sent; a refused token answers 403 and sends nothing. The site key is public and sits in the web config. The script loads only when the contact page renders, never in the prerendered HTML. Development and tests use Cloudflare's documented test keys; the API refuses to boot in production with a test secret or without SMTP credentials.

**Abuse.** The route keeps the global rate limit (`@fastify/rate-limit`, already a dependency) and tightens it to 5 messages per IP per 10 minutes. The body is the shared `contactRequestSchema` (Zod). An SMTP or Cloudflare failure is logged server-side and answers a bare 502: the visitor never sees why.

No honeypot field: the form has none, and Turnstile covers the same bots without adding a hidden input to the accessibility tree.

## Consequences

The contact form works end to end, with no key in the bundle and no third-party mail SDK.

The accepted downsides:

- **Google dependency.** Delivery depends on a personal Gmail account and its sending limits (about 500 a day, far above need). If Google disables SMTP or app passwords for the account, the form stops until the transport changes; nodemailer makes that a configuration change, not a rewrite.
- **App-password rotation.** The app password is a long-lived credential with access to the mailbox's sending. It must be revoked and replaced if the server is compromised, and it disappears if 2-step verification is turned off. Nothing reminds anyone to rotate it.
- **Spoof-looking mail.** The message comes _from_ his own address _to_ himself; the visitor is only in `Reply-To`. Replying works, but the inbox shows his own name as sender.
- **A third-party script on the contact page.** Turnstile loads from `challenges.cloudflare.com` and runs a challenge in an iframe. Cloudflare receives the visitor's IP, user agent and browser signals to score the request. That must be mentioned in the site's privacy note when one exists; Cloudflare states it does not use the data for advertising. A visitor who blocks the script cannot send: the error copy points to LinkedIn.
- **CSP.** The project defines no Content-Security-Policy today (the nginx config lives outside the repo, ADR-0005). The day one is added, the contact page needs `script-src https://challenges.cloudflare.com` and `frame-src https://challenges.cloudflare.com`, and `connect-src 'self'` for the post.
- **Production key not yet in the repo.** Until the real site key replaces the test one in `core/config/turnstile.config.ts`, a production build sends test tokens the real secret refuses: the form fails closed with the captcha message.
- **Synchronous relay.** The visitor waits for Gmail to accept the message (typically under a second). A queue would hide that latency and retry failures; at this volume it is not worth the moving parts.

## Alternatives considered

**A transactional mail API (Resend, Brevo, Postmark).** Better deliverability tooling and no personal mailbox credential on the server, but another account, another key and usually a DNS setup on the domain, for a few messages a month. Stéphane chose Gmail.

**SMTP through OVH's own mail offer.** Would keep Google out, but needs a paid mailbox on the domain and DNS work; not worth it while his inbox is Gmail.

**Google reCAPTCHA or hCaptcha.** reCAPTCHA feeds Google's ad profile and shows image puzzles more readily; hCaptcha's free tier is visibly interactive more often. Turnstile is free, invisible in the common case and does not run an image challenge.

**Honeypot and timing only.** No third party at all, but trivially bypassed by any bot that renders the page; a form that mails a real inbox needs a stronger gate.

**Sending from the browser (EmailJS).** Refused by ADR-0007: a public key in the bundle.
