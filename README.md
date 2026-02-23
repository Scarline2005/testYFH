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

## Backend SMTP (Node)
The registration form sends to `POST /api/contact`.

### Required environment variables
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_REQUIRE_TLS`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `MAIL_TO`

### Optional environment variables
- `CLIENT_ORIGINS` (comma-separated CORS allowlist)
- `SMTP_TLS_REJECT_UNAUTHORIZED`
- `SMTP_CONNECTION_TIMEOUT_MS`
- `SMTP_GREETING_TIMEOUT_MS`
- `SMTP_SOCKET_TIMEOUT_MS`

### Health endpoints
- `GET /api/healthz`
  - App status and SMTP env completeness.
- `GET /api/health/email`
  - Live SMTP verification (`transporter.verify()`).

## Production Checklist
1. Deploy this Node backend (not static-only hosting).
2. Configure all SMTP env vars on the production host.
3. Ensure frontend points to backend:
   - Same domain: `data-endpoint="/api/contact"`
   - Separate API domain: set `<html data-api-base-url="https://api.your-domain.org">`
4. Confirm outbound SMTP is allowed by host (ports 587/465).
5. Use HTTPS for frontend and backend.
6. Configure DNS for sending domain:
   - SPF
   - DKIM
   - DMARC

## Reliability and Security Recommendations
- Prefer transactional email providers for production (Mailgun, SendGrid, Brevo, Postmark, SES, Resend).
- Use domain sender address like `no-reply@your-domain.org`.
- Keep secrets only in host environment variables.
- Use the `request_id` returned by API responses to trace errors in host logs.

## Gmail (temporary option)
- Enable 2-step verification.
- Use App Password as `SMTP_PASS`.
- Review blocked sign-in alerts in Google account security.
