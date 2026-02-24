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
+-- server.js                # Optional local Express server
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

## Backend Email (SendGrid) en production
Le formulaire envoie vers `POST /api/contact`.
Netlify redirige vers `/.netlify/functions/contact` via `netlify.toml`.

### Variables d'environnement requises
- `SENDGRID_API_KEY`
- `MAIL_FROM` (ex: `contact@youthfoundationhaiti.org`)
- `MAIL_TO`
- `EXPECTED_SENDER_DOMAIN` (ex: `youthfoundationhaiti.org`)

### Variables optionnelles
- `DIAGNOSTIC_TOKEN` (prot&egrave;ge les endpoints diagnostics)
- `MAIL_DOMAIN` (fallback domaine pour diagnostics DNS)
- `DKIM_SELECTORS` (ex: `default,mail,google`)

### Endpoints de sant&eacute; / diagnostics
- `GET /api/healthz`
  - Statut app + variables email pr&eacute;sentes.
- `GET /api/health/email`
  - V&eacute;rification API SendGrid (auth HTTPS).
- `GET /api/diagnostics/dns`
  - Contr&ocirc;le SPF / DKIM / DMARC.

Si `DIAGNOSTIC_TOKEN` est d&eacute;fini, ajouter le header:
- `x-diagnostic-token: <token>`

## Production Checklist
1. Cr&eacute;er la cl&eacute; API SendGrid (permission `Mail Send`).
2. Netlify: Site settings -> Environment variables -> renseigner les variables requises.
3. `MAIL_FROM` doit utiliser le domaine officiel (ex: `contact@youthfoundationhaiti.org`).
4. Configurer l'authentification domaine dans SendGrid:
   - SPF
   - DKIM
3. D&eacute;ployer (`git push`) et v&eacute;rifier `GET /api/healthz`.
4. Tester `GET /api/health/email`.
5. Tester DNS avec `GET /api/diagnostics/dns`.
6. Faire un test formulaire r&eacute;el (`POST /api/contact`) et v&eacute;rifier le `request_id` dans les logs Netlify.
7. V&eacute;rifier la livraison dans la bo&icirc;te `MAIL_TO`.

## Reliability and Security Recommendations
- Utiliser une cl&eacute; API SendGrid d&eacute;di&eacute;e au site (rotation p&eacute;riodique).
- Use domain sender address like `no-reply@your-domain.org`.
- Keep secrets only in host environment variables.
- Use the `request_id` returned by API responses to trace errors in host logs.

## DNS minimum recommand&eacute; (domaine exp&eacute;diteur)
- SPF (TXT racine): `v=spf1 include:sendgrid.net -all`
- DKIM: enregistrements CNAME fournis par SendGrid (Domain Authentication).
- DMARC (`_dmarc.youthfoundationhaiti.org`):
  - `v=DMARC1; p=quarantine; rua=mailto:dmarc@youthfoundationhaiti.org; adkim=s; aspf=s`

## Scripts de test local
- `npm run email:test` : envoie un email de test simple via SendGrid API.
