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
¦   +-- docs/              # PDFs and reference docs
¦   +-- fonts/             # (empty placeholder for self-hosted fonts)
¦   +-- icons/             # (empty placeholder for icons)
¦   +-- images/            # Optimized, well-named imagery and logos
+-- css
¦   +-- main.css           # Base styles, layout, components, variables
¦   +-- responsive.css     # Breakpoints and mobile navigation
+-- js
¦   +-- main.js            # Navigation toggle, smooth scroll, counters, form handling
+-- README.md
```

## Getting Started
1. Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
2. No build tools are required; all assets are local and loaded via CDN for Google Fonts.

## Design Choices
- **Color palette:** Neutral institutional navy with a bright primary blue and a warm donate accent; soft gray background for contrast.
- **Typography:** Google Font **Poppins** for a professional, modern voice across UI and body text.
- **Layout:** 1160px content width, generous white space, consistent grid for cards and stats, sticky header with clear navigation.
- **Components:** Reusable buttons, cards, chips, and stat blocks using CSS variables and BEM-inspired naming.
- **Responsiveness:** Dedicated `responsive.css` handles breakpoints; mobile nav toggle with accessible ARIA states.
- **Motion:** Animated counters for impact stats and smooth scrolling for anchor navigation.
- **Accessibility:** Semantic HTML5, focus states, readable color contrast, form validation feedback, `sr-only` utility.

## Assets
- Images and logos are renamed and organized under `assets/images/` (e.g., `logo-yfh.png`, `hero-community.jpg`, `sponsor-01.jpg`).
- PDFs previously provided are stored in `assets/docs/` for reference.

## Customization
- Update palette or spacing in `:root` of `css/main.css`.
- Replace images in `assets/images/` with organization-approved assets, keeping descriptive file names.
- Extend navigation links or sections in `index.html`; reuse component classes to maintain consistency.

## Notes
This project is intentionally framework-free for portability. Add analytics, newsletter integrations, or a backend contact endpoint as needed.

## Backend SMTP (Node)
Le formulaire d'inscription de `index.html` envoie maintenant vers `POST /api/contact`.

### Installation
1. Installer les dependances:
   - `npm install`
2. Creer `.env` a partir de `.env.example`.
3. Renseigner les variables SMTP:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MAIL_TO=Youthfoundationhaiti43@gmail.com`
4. Lancer le serveur:
   - `npm start`
5. Ouvrir le site:
   - `http://localhost:3000`

### Gmail (recommande)
- Activez la validation en 2 etapes.
- Generez un mot de passe d'application pour `SMTP_PASS`.
