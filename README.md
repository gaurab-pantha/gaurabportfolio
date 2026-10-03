# Gaurab Pantha — Personal Portfolio

A premium, minimal personal portfolio for Gaurab Pantha — Grade 10 student, graphic designer, and technology/robotics enthusiast. Built with plain HTML, CSS, and vanilla JavaScript (no build step, no frameworks).

## Structure

```
gaurab-portfolio/
├── index.html          Home — hero, intro, what I do, selected work preview, SSIRC teaser, contact CTA
├── about.html           About, skills, learning journey, SSIRC experience, Hack Club, achievements
├── projects.html        Full project grid with filters, events, gallery + lightbox
├── contact.html         Contact form and links
├── README.md
├── favicon.svg
├── robots.txt
├── css/
│   ├── style.css        Design tokens, base styles, components
│   └── responsive.css   Breakpoint overrides (1280 / 1024 / 768 / 425 / 375 / 320)
├── js/
│   ├── main.js           Navigation, scroll effects, reveal animation, lightbox
│   └── projects.js       Project data + working filter system
└── assets/
    ├── images/
    │   ├── profile/gaurab.jpg
    │   ├── projects/ (esp32-car, reminder, site-blocker, dark-mode, stardance, 3am, beest)
    │   ├── events/ (robotics, aviation, cad-session, workshop)
    │   └── gallery/ (gallery-01 to 05)
    └── icons/ (github, instagram, linkedin)
```

## Running it

No build tools needed. Open `index.html` directly in a browser, or serve the folder locally:

```
npx serve .
```

## Design notes

- Dark navy theme with a restrained electric-blue accent, defined as CSS variables in `css/style.css` (`:root`) so the whole palette can be changed in one place.
- Typography: **Space Grotesk** for display/headings, **Inter** for body text, loaded from Google Fonts.
- Navigation: "Work" (on the homepage) and "Projects" (dedicated page) are both in the nav per the brief — "Work" scrolls to the homepage preview, "Projects" opens the full filterable grid. "Experience" links to the SSIRC section on the About page. Adjust in the `<nav>` markup in each file if you'd rather structure it differently.
- Project filtering is real, driven by `js/projects.js` — no project currently uses the "Web" filter since no web project was specified; add one by appending an object with `filter: "web"`.
- Gallery uses a CSS column masonry layout with a fully keyboard-accessible lightbox (Escape to close, click outside to close).
- Respects `prefers-reduced-motion` throughout.

## What you need to replace before publishing

1. **Profile photo** — swap `assets/images/profile/gaurab.jpg` for a real portrait (same filename, ideally a 4:5 portrait crop).
2. **Project images** — replace the seven placeholders in `assets/images/projects/` with real screenshots/photos of ESP32 Bluetooth Car, Reminder, Site Blocker, Dark Mode, Stardance, 3AM, and Beest.
3. **Event photos** — replace the four placeholders in `assets/images/events/`.
4. **Gallery photos** — replace `gallery-01.jpg` through `gallery-05.jpg` with real SSIRC/robotics/event photos. Add more by copying the `<figure class="gallery-item">` block in `projects.html`.
5. **Project links** — every "View project" button currently points to `#`. Update the `link` field in `js/projects.js` (and the matching preview cards in `index.html`) with real GitHub repo or live links.
6. **Contact details** — `contact.html` uses placeholder values (`hello@example.com`, empty GitHub/Instagram/LinkedIn URLs). Replace with your real email and profile links — do not use a school/organization email unless it's actually yours.
7. **Contact form** — the form currently just shows an alert on submit. Wire it to a real service (Formspree, EmailJS, a backend endpoint) or replace it with a `mailto:` link if you'd rather keep it simple.
8. **Achievements** — `about.html` has two placeholder achievement cards marked "to be added." Fill these in only with genuine, verifiable achievements.
9. **Dates** — event cards on `projects.html` say "Date to be added." Fill in real dates when known.
10. **robots.txt / Open Graph URLs** — update the sitemap and `og:url` once the site has a real domain.

## Accessibility & performance checklist (already in place)

- Semantic HTML, landmark elements, and a logical heading hierarchy.
- All images have descriptive `alt` text (replace with more specific text once real photos are in).
- Keyboard-operable navigation, mobile menu (Escape to close, closes on link click), and lightbox.
- Visible focus states on all interactive elements.
- `loading="lazy"` on below-the-fold images.
- No external dependencies beyond Google Fonts — fast by default.
