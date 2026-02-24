# Youth Foundation Haiti Website

A clean, production-ready static site for Youth Foundation Haiti with semantic HTML, modular CSS, and lightweight JavaScript.

## Project Structure
```
C:\Users\kensl\Projet_Youth_Haiti
+-- index.html               # Landing page
+-- about.html               # About / governance placeholder
+-- programs.html            # Programs overview placeholder
+-- donate.html              # Donation entry page
+-- assets
|   +-- docs/                # PDFs and reference docs
|   +-- fonts/               # (empty placeholder for self-hosted fonts)
|   +-- icons/               # (empty placeholder for icons)
|   +-- images/              # Optimized, well-named imagery and logos
+-- css
|   +-- main.css             # Base styles, layout, components, variables
|   +-- responsive.css       # Breakpoints and mobile navigation
+-- js
|   +-- main.js              # Navigation toggle, smooth scroll, counters, form handling
+-- server.js                # Express API + SMTP mail sender
+-- README.md
```

## Getting Started
1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`.
3. Start the app:
   - `npm start`
4. Open:
   - `http://localhost:3000`

## Backend SMTP en production (Netlify Functions)
Le formulaire envoie vers `POST /api/contact` puis Netlify redirige vers `/.netlify/functions/contact` via `netlify.toml`.

### Variables d'environnement requises
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_REQUIRE_TLS`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `MAIL_TO`
- `EXPECTED_SENDER_DOMAIN` (ex: `youthfoundationhaiti.org`)

### Variables optionnelles
- `SMTP_TLS_REJECT_UNAUTHORIZED`
- `SMTP_CONNECTION_TIMEOUT_MS`
- `SMTP_GREETING_TIMEOUT_MS`
- `SMTP_SOCKET_TIMEOUT_MS`
- `SMTP_LOGGER` (default `true`)
- `SMTP_DEBUG` (default `true`)
- `DIAGNOSTIC_TOKEN` (prot&egrave;ge les endpoints diagnostics)
- `MAIL_DOMAIN` (fallback domaine pour diagnostics DNS)
- `DKIM_SELECTORS` (ex: `default,mail,google`)

### Endpoints de sant&eacute; / diagnostics
- `GET /api/healthz`
  - Statut app + variables SMTP pr&eacute;sentes.
- `GET /api/health/email`
  - V&eacute;rification SMTP r&eacute;elle (`transporter.verify()`).
- `GET /api/diagnostics/smtp`
  - Test TCP ports SMTP `25`, `465`, `587` + `verify()` par port.
- `GET /api/diagnostics/dns`
  - Contr&ocirc;le SPF / DKIM / DMARC.

Si `DIAGNOSTIC_TOKEN` est d&eacute;fini, ajouter le header:
- `x-diagnostic-token: <token>`

## Production Checklist
1. Netlify: Site settings -> Environment variables -> renseigner toutes les variables SMTP.
2. `SMTP_FROM` doit utiliser le domaine officiel (ex: `contact@youthfoundationhaiti.org`).
3. D&eacute;ployer (`git push`) et v&eacute;rifier `GET /api/healthz`.
4. Tester `GET /api/health/email`.
5. Tester les ports SMTP avec `GET /api/diagnostics/smtp`.
6. Tester DNS avec `GET /api/diagnostics/dns`.
7. Faire un test formulaire r&eacute;el (`POST /api/contact`) et v&eacute;rifier le `request_id` dans les logs Netlify.
8. V&eacute;rifier la livraison dans la bo&icirc;te `MAIL_TO`.

## Reliability and Security Recommendations
- Prefer transactional email providers for production (Mailgun, SendGrid, Brevo, Postmark, SES, Resend).
- Use domain sender address like `no-reply@your-domain.org`.
- Keep secrets only in host environment variables.
- Use the `request_id` returned by API responses to trace errors in host logs.

## DNS minimum recommand&eacute; (domaine exp&eacute;diteur)
- SPF (TXT racine): `v=spf1 include:<provider> -all`
- DKIM: enregistrements fournis par votre provider SMTP (selectors).
- DMARC (`_dmarc.youthfoundationhaiti.org`):
  - `v=DMARC1; p=quarantine; rua=mailto:dmarc@youthfoundationhaiti.org; adkim=s; aspf=s`

## Scripts de test local
- `npm run smtp:ports` : teste TCP + verify sur 25/465/587.
- `npm run smtp:test` : envoie un email de test simple hors formulaire.

## Gmail (temporary option)
- Enable 2-step verification.
- Use App Password as `SMTP_PASS`.
- Review blocked sign-in alerts in Google account security.
