# GAURABDEV — Gaurab Pantha's portfolio

Plain HTML, CSS and JavaScript — no build step. Hosted on Cloudflare, deployed from this GitHub repository.

**Everything you see on the site lives in one file: [`data/content.json`](data/content.json).**
You normally never edit it by hand — use the admin panel.

## The admin panel (`/admin/`)

Open `https://gaurabdev.com/admin/`.

What you can manage — everything on the site:

| Tab | What it controls |
| --- | --- |
| Projects | Cards + each project's own page: status, links, features, lessons, and a full **project gallery** of screenshots/photos. Hide, duplicate, reorder, mark "Show on homepage" |
| Design work | The Design page gallery, with a detail pop-up (purpose, role, audience, choices) |
| Gallery (moments) | The Gallery page: add many photos at once, give them albums/categories (filters appear automatically), captions and dates |
| Activities | SSIRC workshops / sessions / competitions on the Experience page |
| Home: what I do · quick facts | The four service cards and the facts strip on the homepage |
| About: journey · Skills | The timeline and skill groups on the About page |
| Page text | Every heading, intro line and button label across all pages |
| Profile & links | Hero text, profile photo, about text, contact/social links, SSIRC roles and details |

Every item can be **edited, duplicated, reordered, hidden (draft) or deleted**.

### First-time sign-in

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Repository access:* **Only select repositories** → pick this portfolio repo.
3. *Permissions → Repository → Contents:* **Read and write**. Nothing else is needed.
4. Open `/admin/`, enter `your-username/repo-name` and the token, and sign in.

### Everyday use

1. Pick a tab → **Add** (or **Edit**). Fill the form. Images are resized and compressed automatically.
2. **Save** each item, then click **Publish changes** once. This creates a single commit with your content and images.
3. Cloudflare redeploys automatically — the live site updates in about a minute.

Good to know:

- Nothing is public until you click **Publish changes**. Leaving the page with unpublished changes asks you to confirm.
- **Backup** downloads the current `content.json`. Do this now and then.
- The token lives only in your browser (in memory for the session, or on this device if you tick *Remember*), and is only ever sent to `api.github.com`. Treat it like a password; if a device is lost, delete the token in GitHub.
- The admin page is public, but it is useless without your token. It is blocked from search engines and has a strict Content-Security-Policy in `_headers`.
- Honesty rule baked in: the *Status* badge on a project is empty until you choose one, and links/sections you leave empty are hidden — nothing is shown as "completed" or "live" unless you say so.

## Files

```
index.html  404.html
about/ projects/ project/ design/ gallery/ experience/ contact/   (each holds an index.html → URLs like /about/ with no .html)
admin/        admin panel (index.html, admin.js, admin.css)
data/         content.json  ← all site content
assets/       images/ (profile, projects, events, gallery), uploads/ (made by the admin), icons/
css/          style.css, responsive.css
js/           content.js (renders content.json), main.js (nav, scroll, lightbox), contact.js
```

Changing the navigation or footer means editing each HTML page (they are written out, not generated).

## Run locally

```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or use VS Code “Live Server” on the project folder
```

A server is required because the site loads `data/content.json` with `fetch` (double-clicking the HTML won't work).

## Deploy notes

- Canonical domain is `https://gaurabdev.com` (see `CNAME`, `<link rel="canonical">`, `sitemap.xml`, `robots.txt`). If you ever change domain, search-and-replace it in those places.
- Open Graph image: `assets/images/og-card.jpg` (1200×630). It still shows the old workers.dev address in small text — re-export it from Canva/Figma with `gaurabdev.com`.
- **Clean URLs:** every page is a folder with an `index.html` (`/about/`, `/contact/`…), so it works on Cloudflare, Live Server and any static host with no configuration. `_redirects` sends old `.html` links to the new ones.
- `/admin/` needs no server code; all saving happens through GitHub's API from your browser.

## Design tokens

Background `#0B0F19` · panels `#111827` / `#151D2B` · accent `#377DFF` · text `#F8FAFC` / `#94A3B8`. Headings Space Grotesk, body Inter. All defined at the top of `css/style.css`.

© Gaurab Pantha. Code shared to read and learn from; please don't copy the design, text or photos as your own.
