# Gaurab Pantha — Portfolio

Static site (HTML, CSS, JavaScript). No build step. Live at https://gaurabportfolio.gpantha99.workers.dev

## Update the site
Edit files in GitHub (or upload new ones) and click **Commit changes**. Cloudflare redeploys within a minute or two.

## 1. Add your email, Instagram and LinkedIn
Open `js/config.js` and fill in the values. Anything left as `""` stays hidden.
Adding an email also turns on the contact form (it opens the visitor's email app with the message ready).

## 2. Add project links
Open `js/projects.js`. For each project set `link: "https://..."`.
While `link` is `""` the card shows "Link coming soon".
The three project cards on the home page are in `index.html`: replace
`<span class="project-link is-soon">Link coming soon</span>` with
`<a class="project-link" href="https://..." target="_blank" rel="noopener">View project <span class="arrow" aria-hidden="true">&rarr;</span></a>`.

## 3. Add a new project
Append an object to the `PROJECTS` array in `js/projects.js` and add a 4:3 image (about 1200x900) in `assets/images/projects/`.

## 4. Event dates
Under each event card in `projects.html`, add `<span class="event-date">12 March 2026</span>` after the description.

## 5. Adding achievements
The Achievements section is hidden in `about.html` until there is something real to show.
Paste this block back in where the `ACHIEVEMENTS` comment is, and edit the text:

```html
<!-- ACHIEVEMENTS -->
  <section class="section">
    <div class="container">
      <div class="section-head" data-reveal>
        <div>
          <p class="eyebrow">Achievements</p>
          <h2 class="section-title">Recognition along the way</h2>
        </div>
        <p class="section-meta">Updated as things happen — no placeholders passed off as real.</p>
      </div>

      <div class="achieve-grid" data-reveal>
        <div class="achieve-card">
          <p class="achieve-cat">SSIRC Leadership</p>
          <p class="achieve-body">Serving as Marketing, Graphic Design, Media &amp; Documentation, and Administrator Head at SSIRC.</p>
        </div>
        <div class="achieve-card is-empty">
          <p class="achieve-cat">Robotics</p>
          <p class="achieve-body">To be added — competition results and certificates will appear here.</p>
        </div>
        <div class="achieve-card is-empty">
          <p class="achieve-cat">Hack Club</p>
          <p class="achieve-body">To be added — project milestones and recognitions will appear here.</p>
        </div>
      </div>
    </div>
  </section>
```

## If you change the web address
Replace `https://gaurabportfolio.gpantha99.workers.dev` in all four `.html` files, `sitemap.xml`, `robots.txt`
and `assets/images/og-card.jpg` (the share preview image shows the address in small text).

## Structure
```
index.html  about.html  projects.html  contact.html
css/style.css  css/responsive.css
js/config.js (your details)  js/main.js  js/projects.js  js/contact.js
assets/images/  assets/icons/
favicon.svg  robots.txt  sitemap.xml  _headers
```

## Latest polish
- Filter buttons show project counts, and `projects.html#robotics` opens straight into a filter.
- Gallery viewer: previous/next buttons, arrow keys and swipe.
- Fixed stretched/inset gallery photos, hover-only captions on touch screens, and added `404.html`.

## Contact details
Email, GitHub, Instagram and Facebook are set in `js/config.js` (and shown on the home hero, home contact section, contact page and footer).
To change one, edit `js/config.js` and the matching links in `index.html`.
