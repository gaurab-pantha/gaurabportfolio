/* ==========================================================================
   GAURABDEV admin
   Edits data/content.json (and uploads images) in your GitHub repository.
   Publishing creates ONE commit; Cloudflare then redeploys the site.
   Your token stays in this browser only and is sent only to api.github.com.
   ========================================================================== */
(function () {
  "use strict";

  var API = "https://api.github.com";
  var DATA_PATH = "data/content.json";
  var UPLOAD_DIR = "assets/uploads/";

  /* ---------------- state ---------------- */
  var S = {
    repo: "", token: "", branch: "",
    data: null, loadedSha: "",
    dirty: false, busy: false,
    tab: "projects",
    pending: {}            // path -> { blob, url }
  };

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function slug(s) { return String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "item"; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids || []).forEach(function (k) { if (k) n.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  function imgSrc(path) {
    if (!path) return "";
    if (S.pending[path]) return S.pending[path].url;
    return "../" + path;
  }
  var toastTimer;
  function toast(msg, kind) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast " + (kind || "");
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, kind === "err" ? 7000 : 3500);
  }

  /* ---------------- GitHub ---------------- */
  function gh(path, opts) {
    opts = opts || {};
    return fetch(API + path, {
      method: opts.method || "GET",
      headers: {
        "Authorization": "Bearer " + S.token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store"
    }).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) { /* ignore */ }
        if (!r.ok) {
          var msg = (j && j.message) || ("GitHub error " + r.status);
          var err = new Error(r.status === 401 ? "That token isn't valid (or has expired)." :
            r.status === 403 || r.status === 404 ? msg + " — check the token has access to this repository with Contents: Read and write." : msg);
          err.status = r.status;
          throw err;
        }
        return j;
      });
    });
  }

  function b64ToUtf8(b64) {
    var bin = atob(b64.replace(/\n/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  function blobToB64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1]); };
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function loadContent() {
    var q = S.branch ? "?ref=" + encodeURIComponent(S.branch) : "";
    return gh("/repos/" + S.repo + "/contents/" + DATA_PATH + q).then(function (f) {
      var p = f.content ? Promise.resolve(b64ToUtf8(f.content)) :
        gh("/repos/" + S.repo + "/git/blobs/" + f.sha).then(function (b) { return b64ToUtf8(b.content); });
      return p.then(function (txt) {
        S.data = JSON.parse(txt);
        S.loadedSha = f.sha;
      });
    });
  }

  /* ---------------- login ---------------- */
  function store(remember) {
    try {
      localStorage.setItem("gd_repo", S.repo);
      sessionStorage.setItem("gd_token", S.token);
      if (remember) localStorage.setItem("gd_token", S.token); else localStorage.removeItem("gd_token");
    } catch (e) { /* storage unavailable */ }
  }
  function forget() {
    try { sessionStorage.removeItem("gd_token"); localStorage.removeItem("gd_token"); } catch (e) { /* ignore */ }
  }

  function signIn(repo, token, remember) {
    S.repo = repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    S.token = token.trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(S.repo)) return Promise.reject(new Error("Enter the repository as owner/name, e.g. gaurab-pantha/portfolio."));
    return gh("/repos/" + S.repo).then(function (r) {
      if (r.permissions && r.permissions.push === false) throw new Error("This token can only read the repository. Give it Contents: Read and write.");
      S.branch = r.default_branch;
      return loadContent();
    }).then(function () {
      store(remember);
      showDash();
    });
  }

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("login-btn"), err = $("login-error");
    err.hidden = true;
    btn.disabled = true; btn.textContent = "Signing in…";
    signIn($("in-repo").value, $("in-token").value, $("in-remember").checked).catch(function (ex) {
      err.textContent = ex.message || "Could not sign in.";
      err.hidden = false;
    }).then(function () { btn.disabled = false; btn.textContent = "Sign in"; });
  });

  $("btn-logout").addEventListener("click", function () {
    if (S.dirty && !confirm("You have unpublished changes. Sign out and lose them?")) return;
    forget();
    S.dirty = false;
    location.reload();
  });

  window.addEventListener("beforeunload", function (e) {
    if (S.dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------------- schema ---------------- */
  var CAT = {
    projects: ["Browser Extension", "Robotics", "Hack Club", "Web", "Design", "Other"],
    designs: ["Social Media Design", "Event Posters", "Branding", "Technology Events", "Promotional Graphics", "Other Visual Work"],
    events: ["Robotics", "Aviation", "CAD Design", "Workshop", "Competition", "Other"],
    gallery: ["SSIRC", "School", "Robotics", "Aviation", "CAD Design", "Team", "Other"]
  };

  var SCHEMA = {
    projects: {
      title: "Projects", single: "project", titleKey: "name", metaKey: "category", imageKey: "image",
      help: "Shown on the Projects page. Tick “Show on homepage” for the best 3.",
      fields: [
        { k: "name", l: "Project name", t: "text", req: true },
        { k: "category", l: "Category", t: "text", req: true, list: "projects", hint: "Pick one or type a new one — filters are created automatically." },
        { k: "status", l: "Status", t: "select", opts: ["", "Concept", "In progress", "Prototype", "Completed"], hint: "Be honest — visitors see this badge. Leave empty to hide it." },
        { k: "summary", l: "Short description", t: "textarea", req: true, max: 280 },
        { k: "image", l: "Cover image", t: "image", req: true, w: 1400, hint: "A screenshot or photo, ideally 4:3." },
        { k: "featured", l: "Show on homepage", t: "bool" },
        { k: "hidden", l: "Hide from the site (keep as draft)", t: "bool" },
        { k: "tags", l: "Technologies / tags", t: "tags", hint: "Comma separated, only things you actually used." },
        { s: "Links (leave empty if they don't exist yet)" },
        { k: "repo", l: "Source code link (GitHub)", t: "url" },
        { k: "demo", l: "Live demo link", t: "url" },
        { k: "link", l: "Other link (store page, website…)", t: "url" },
        { s: "Project page details (all optional — empty sections are hidden)" },
        { k: "problem", l: "Purpose / problem it addresses", t: "textarea" },
        { k: "features", l: "Features that really work", t: "lines", hint: "One per line." },
        { k: "contribution", l: "What I personally built", t: "textarea" },
        { k: "lessons", l: "What I learned", t: "textarea" },
        { k: "screenshots", l: "Project gallery (screenshots & photos)", t: "shots", hint: "Add as many images as you like — they appear on the project page." }
      ],
      blank: function () { return { id: "", name: "", category: "", status: "", featured: false, hidden: false, summary: "", tags: [], image: "", link: "", repo: "", demo: "", problem: "", features: [], contribution: "", lessons: "", screenshots: [] }; }
    },
    designs: {
      title: "Design work", single: "design", titleKey: "title", metaKey: "category", imageKey: "image",
      help: "Your real posters and graphics. Visitors can open each one for details.",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "category", l: "Category", t: "text", req: true, list: "designs", hint: "Only categories that have designs appear as filters." },
        { k: "image", l: "Design image", t: "image", req: true, w: 1800, hint: "Upload the full design so the typography stays sharp." },
        { k: "description", l: "Purpose of the design", t: "textarea" },
        { k: "role", l: "My role / contribution", t: "text" },
        { k: "audience", l: "Intended audience", t: "text" },
        { k: "choices", l: "Visual choices (colour, type, layout)", t: "textarea" },
        { k: "client", l: "Created for", t: "text", hint: "e.g. SSIRC — Shanti Science ICT & Robotics Club" },
        { k: "date", l: "Date", t: "text", hint: "e.g. March 2026" },
        { k: "hidden", l: "Hide from the site (keep as draft)", t: "bool" }
      ],
      blank: function () { return { id: "", title: "", category: "", image: "", description: "", role: "", audience: "", choices: "", client: "", date: "", hidden: false }; }
    },
    events: {
      title: "Activities", single: "activity", titleKey: "title", metaKey: "category", imageKey: "image",
      help: "SSIRC workshops, sessions and competitions (shown on the Experience page).",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "category", l: "Category", t: "text", req: true, list: "events" },
        { k: "date", l: "Date", t: "text", hint: "Optional, e.g. 12 March 2026" },
        { k: "image", l: "Photo or poster", t: "image", req: true, w: 1400 },
        { k: "description", l: "Description", t: "textarea", req: true, hint: "Say what you did — participated, designed the poster, documented it…" },
        { k: "hidden", l: "Hide from the site (keep as draft)", t: "bool" }
      ],
      blank: function () { return { id: "", title: "", category: "", date: "", image: "", description: "", hidden: false }; }
    },
    gallery: {
      title: "Gallery — moments", single: "photo", titleKey: "caption", metaKey: "category", imageKey: "image", grid: true,
      help: "Photos for the Gallery page (and the preview on Home and Experience). Use categories to make albums.",
      fields: [
        { k: "image", l: "Photo", t: "image", req: true, w: 1600 },
        { k: "caption", l: "Caption", t: "text" },
        { k: "category", l: "Album / category", t: "text", list: "gallery", hint: "Photos with the same category get a filter button on the Gallery page." },
        { k: "date", l: "Date", t: "text", hint: "Optional, e.g. March 2026" },
        { k: "hidden", l: "Hide from the site (keep as draft)", t: "bool" }
      ],
      blank: function () { return { id: "", image: "", caption: "", category: "", date: "", hidden: false }; }
    },
    services: {
      title: "Home — what I do", single: "card", titleKey: "title", noImage: true,
      help: "The four cards in the “What I do” section on the homepage.",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "description", l: "Description", t: "textarea", req: true, max: 200 }
      ],
      blank: function () { return { title: "", description: "" }; }
    },
    facts: {
      title: "Home — quick facts", single: "fact", titleKey: "label", metaKey: "value", noImage: true,
      help: "The small facts strip under the hero (Based in, Studying, Focus…).",
      fields: [
        { k: "label", l: "Label", t: "text", req: true },
        { k: "value", l: "Value", t: "text", req: true }
      ],
      blank: function () { return { label: "", value: "" }; }
    },
    timeline: {
      title: "About — journey", single: "step", titleKey: "title", metaKey: "stage", noImage: true,
      help: "The “Learning journey” timeline on the About page.",
      fields: [
        { k: "stage", l: "Stage label", t: "text", req: true, hint: "e.g. Student, SSIRC, Hack Club" },
        { k: "title", l: "Title", t: "text", req: true },
        { k: "description", l: "Description", t: "textarea", req: true }
      ],
      blank: function () { return { stage: "", title: "", description: "" }; }
    },
    skills: {
      title: "Skills", single: "skill group", titleKey: "group", metaKey: "", noImage: true,
      help: "Grouped, honest lists — no percentages. Edit as your skills grow.",
      fields: [
        { k: "group", l: "Group name", t: "text", req: true },
        { k: "items", l: "Skills", t: "lines", req: true, hint: "One per line." }
      ],
      blank: function () { return { group: "", items: [] }; }
    }
  };

  var PROFILE_FIELDS = [
    { s: "Homepage hero" },
    { k: "profile.heroLabel", l: "Small label above name", t: "text" },
    { k: "profile.heroLine1", l: "Headline — line 1", t: "text" },
    { k: "profile.heroLine2", l: "Headline — line 2 (highlighted)", t: "text" },
    { k: "profile.intro", l: "Intro paragraph", t: "textarea", max: 400 },
    { k: "profile.profileImage", l: "Profile photo", t: "image", req: true, w: 1080, hint: "Portrait, about 3:4." },
    { k: "profile.location", l: "Location label", t: "text" },
    { s: "About page" },
    { k: "profile.school", l: "School", t: "text" },
    { k: "profile.grade", l: "Grade", t: "text" },
    { k: "profile.about", l: "About paragraphs", t: "paras", hint: "Separate paragraphs with a blank line." },
    { k: "profile.aspiration", l: "Goals / aspiration", t: "textarea" },
    { k: "profile.tagline", l: "Personal tagline", t: "text" },
    { s: "Contact & social links (empty = hidden)" },
    { k: "profile.links.email", l: "Public email", t: "text", hint: "Only publish an address you want strangers to see." },
    { k: "profile.links.github", l: "GitHub", t: "url" },
    { k: "profile.links.instagram", l: "Instagram", t: "url" },
    { k: "profile.links.facebook", l: "Facebook", t: "url" },
    { k: "profile.links.linkedin", l: "LinkedIn", t: "url" },
    { s: "SSIRC" },
    { k: "profile.ssirc.summary", l: "SSIRC summary", t: "textarea" },
    { k: "profile.ssirc.roles", l: "My roles", t: "lines", hint: "One per line." },
    { k: "profile.ssirc.contributions", l: "What I contribute", t: "lines", hint: "One per line." },
    { k: "profile.ssirc.website", l: "Club website", t: "url" },
    { k: "profile.ssirc.email", l: "Club email", t: "text" },
    { k: "profile.ssirc.location", l: "Club location", t: "text" }
  ];

  function pf(group, label, items) {
    var out = [{ s: label }];
    items.forEach(function (i) { out.push({ k: "pages." + group + "." + i[0], l: i[1], t: i[2] || "text" }); });
    return out;
  }
  var PAGE_FIELDS = [].concat(
    pf("home", "Home — hero & intro", [["cta1", "Main button text"], ["cta2", "Second button text"], ["lead", "Big line under the hero", "textarea"]]),
    pf("homeWhat", "Home — “What I do” heading", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Side note", "textarea"]]),
    pf("homeProjects", "Home — projects heading", [["eyebrow", "Small label"], ["title", "Heading"]]),
    pf("homeSsirc", "Home — SSIRC panel", [["eyebrow", "Small label"], ["title", "Heading"]]),
    pf("homeMoments", "Home — moments heading", [["eyebrow", "Small label"], ["title", "Heading"]]),
    pf("homeContact", "Home — contact block", [["eyebrow", "Small label"], ["title", "Heading"], ["text", "Text", "textarea"]]),
    pf("about", "About page — top", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Intro", "textarea"]]),
    pf("aboutSkills", "About — skills heading", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Side note", "textarea"]]),
    pf("aboutJourney", "About — journey heading", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Side note", "textarea"]]),
    pf("projects", "Projects page — top", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Intro", "textarea"]]),
    pf("design", "Design page — top", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Intro", "textarea"]]),
    pf("gallery", "Gallery page — top", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Intro", "textarea"]]),
    pf("experience", "Experience page — top", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Intro", "textarea"], ["rolesTitle", "Roles heading"]]),
    pf("experienceActivities", "Experience — activities heading", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Side note", "textarea"]]),
    pf("experienceMoments", "Experience — gallery heading", [["eyebrow", "Small label"], ["title", "Heading"]]),
    pf("contact", "Contact page — top", [["eyebrow", "Small label"], ["title", "Heading"], ["lead", "Intro", "textarea"]]),
    pf("footer", "Footer", [["tagline", "Footer tagline"]])
  );

  /* ---------------- dot-path helpers ---------------- */
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split("."), last = ks.pop();
    var t = ks.reduce(function (a, k) { if (a[k] == null || typeof a[k] !== "object") a[k] = {}; return a[k]; }, o);
    t[last] = v;
  }

  /* ---------------- image processing ---------------- */
  function processImage(file, maxSide, hintName) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error("“" + file.name + "” is not an image."));
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, sc = Math.min(1, maxSide / Math.max(w, h));
        var cw = Math.round(w * sc), ch = Math.round(h * sc);
        var c = document.createElement("canvas");
        c.width = cw; c.height = ch;
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        c.toBlob(function (blob) {
          if (!blob) return reject(new Error("Could not process that image."));
          var base = slug(hintName || file.name.replace(/\.[^.]+$/, ""));
          var path = UPLOAD_DIR + base + "-" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36) + ".jpg";
          S.pending[path] = { blob: blob, url: URL.createObjectURL(blob) };
          resolve(path);
        }, "image/jpeg", 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Could not read “" + file.name + "”. Try a JPG or PNG.")); };
      img.src = url;
    });
  }

  /* ---------------- dirty / status ---------------- */
  function setDirty(v) {
    S.dirty = v;
    var pill = $("status");
    pill.textContent = v ? "Unpublished changes" : "Up to date";
    pill.className = "pill" + (v ? " dirty" : "");
    $("btn-publish").disabled = !v || S.busy;
  }

  /* ---------------- dashboard ---------------- */
  function showDash() {
    $("login").hidden = true;
    $("dash").hidden = false;
    buildTabs();
    renderPanel();
  }

  var TABS = [["projects", "Projects"], ["designs", "Design work"], ["gallery", "Gallery (moments)"], ["events", "Activities"], ["services", "Home: what I do"], ["facts", "Home: quick facts"], ["timeline", "About: journey"], ["skills", "Skills"], ["pages", "Page text"], ["profile", "Profile & links"]];
  function buildTabs() {
    var nav = $("tabs");
    nav.innerHTML = "";
    TABS.forEach(function (t) {
      var count = (t[0] === "profile" || t[0] === "pages") ? "" : (S.data[t[0]] || []).length;
      var b = el("button", { class: "tab", type: "button", role: "tab", "aria-selected": S.tab === t[0] ? "true" : "false", onclick: function () { S.tab = t[0]; buildTabs(); renderPanel(); } },
        [el("span", { text: t[1] }), el("span", { class: "n", text: String(count) })]);
      nav.appendChild(b);
    });
  }

  function renderPanel() {
    var panel = $("panel");
    panel.innerHTML = "";
    if (S.tab === "profile") return renderProfile(panel);
    if (S.tab === "pages") return renderPages(panel);
    var sc = SCHEMA[S.tab], list = S.data[S.tab] = S.data[S.tab] || [];

    var head = el("div", { class: "panel-head" }, [
      el("div", {}, [el("h1", { text: sc.title }), el("p", { text: sc.help })]),
      el("div", { class: "row-actions" }, [
        S.tab === "gallery" ? el("button", { class: "btn primary", type: "button", onclick: addGalleryPhotos, text: "+ Add photos (many at once)" }) : null,
        S.tab === "gallery" ? el("button", { class: "btn", type: "button", onclick: function () { openEditor("gallery", -1); }, text: "+ Add one with details" }) : null,
        S.tab !== "gallery" ? el("button", { class: "btn primary", type: "button", onclick: function () { openEditor(S.tab, -1); }, text: "+ Add " + sc.single }) : null
      ])
    ]);
    panel.appendChild(head);

    if (!list.length) {
      panel.appendChild(el("div", { class: "empty", text: "Nothing here yet. Use the button above to add your first " + sc.single + "." }));
      return;
    }

    if (sc.grid) {
      var g = el("div", { class: "grid-gal" });
      list.forEach(function (it, i) {
        g.appendChild(el("div", { class: "gal-item" }, [
          el("img", { src: imgSrc(it.image), alt: "" }),
          el("div", {}, [
            el("p", { text: (it.caption || "(no caption)") + (it.category ? " · " + it.category : "") + (it.hidden ? " · hidden" : "") }),
            el("div", { class: "row-actions" }, rowButtons(S.tab, i, list.length))
          ])
        ]));
      });
      panel.appendChild(g);
      return;
    }

    var wrap = el("div", { class: "list" });
    if (list.length > 6) {
      var q = el("input", { type: "text", placeholder: "Search…", class: "search", "aria-label": "Search" });
      q.addEventListener("input", function () {
        var v = q.value.toLowerCase();
        Array.prototype.forEach.call(wrap.querySelectorAll(".row"), function (r) { r.hidden = v && r.textContent.toLowerCase().indexOf(v) === -1; });
      });
      panel.appendChild(q);
    }
    list.forEach(function (it, i) {
      var meta = [];
      if (sc.metaKey && it[sc.metaKey]) meta.push(el("span", { text: it[sc.metaKey] }));
      if (S.tab === "projects") {
        if (it.status) meta.push(el("span", { class: "tag", text: it.status }));
        if (it.featured) meta.push(el("span", { class: "tag on", text: "Homepage" }));
      }
      if (it.hidden) meta.push(el("span", { class: "tag", text: "Hidden" }));
      if (S.tab === "skills") meta.push(el("span", { text: (it.items || []).join(", ") }));
      var row = el("div", { class: "row" + (sc.noImage ? " noimg" : "") }, [
        sc.noImage ? null : el("img", { class: "thumb", src: imgSrc(it[sc.imageKey]), alt: "" }),
        el("div", {}, [el("div", { class: "row-title", text: it[sc.titleKey] || "(untitled)" }), el("div", { class: "row-meta" }, meta)]),
        el("div", { class: "row-actions" }, rowButtons(S.tab, i, list.length))
      ]);
      wrap.appendChild(row);
    });
    panel.appendChild(wrap);
  }

  function rowButtons(tab, i, n) {
    return [
      el("button", { class: "btn small", type: "button", onclick: function () { openEditor(tab, i); }, text: "Edit" }),
      el("button", { class: "btn small", type: "button", onclick: function () { duplicate(tab, i); }, text: "Duplicate" }),
      el("button", { class: "btn small", type: "button", "aria-label": "Move up", disabled: i === 0, onclick: function () { move(tab, i, -1); }, text: "↑" }),
      el("button", { class: "btn small", type: "button", "aria-label": "Move down", disabled: i === n - 1, onclick: function () { move(tab, i, 1); }, text: "↓" }),
      el("button", { class: "btn small danger", type: "button", onclick: function () { remove(tab, i); }, text: "Delete" })
    ];
  }

  function move(tab, i, d) {
    var a = S.data[tab], j = i + d;
    if (j < 0 || j >= a.length) return;
    var t = a[i]; a[i] = a[j]; a[j] = t;
    setDirty(true); renderPanel();
  }
  function duplicate(tab, i) {
    var c = clone(S.data[tab][i]), sc = SCHEMA[tab];
    if (c.id) c.id = c.id + "-copy-" + Date.now().toString(36).slice(-3);
    if (sc.titleKey && c[sc.titleKey]) c[sc.titleKey] = c[sc.titleKey] + " (copy)";
    S.data[tab].splice(i + 1, 0, c);
    setDirty(true); buildTabs(); renderPanel();
    toast("Duplicated. Click Edit on the copy to change it.", "ok");
  }
  function remove(tab, i) {
    var it = S.data[tab][i], name = it[SCHEMA[tab].titleKey] || "this item";
    if (!confirm("Delete “" + name + "”? It disappears from the site after you publish.")) return;
    S.data[tab].splice(i, 1);
    setDirty(true); buildTabs(); renderPanel();
  }

  function addGalleryPhotos() {
    var album = (window.prompt("Album / category for these photos (optional, e.g. SSIRC, School, Robotics):", S.lastAlbum || "") || "").trim();
    S.lastAlbum = album;
    var inp = el("input", { type: "file", accept: "image/*", multiple: true });
    inp.addEventListener("change", function () {
      var files = Array.prototype.slice.call(inp.files);
      if (!files.length) return;
      toast("Processing " + files.length + " photo(s)…");
      files.reduce(function (p, f) {
        return p.then(function () {
          return processImage(f, 1600).then(function (path) {
            S.data.gallery.push({ id: "g-" + Date.now().toString(36) + Math.floor(Math.random() * 999), image: path, caption: "", category: album, date: "", hidden: false });
          }).catch(function (e) { toast(e.message, "err"); });
        });
      }, Promise.resolve()).then(function () { setDirty(true); buildTabs(); renderPanel(); toast("Added. Click Edit on a photo to add a caption, then Publish.", "ok"); });
    });
    inp.click();
  }

  /* ---------------- form builder ---------------- */
  function buildForm(container, fields, source, ctx) {
    // ctx.getters: map key -> function returning value
    container.innerHTML = "";
    var getters = {};
    var dl = {};
    fields.forEach(function (f, idx) {
      if (f.s) { container.appendChild(el("div", { class: "sect", text: f.s })); return; }
      var id = "f-" + idx;
      var cur = getPath(source, f.k);
      var wrap = el("div", { class: "field" });
      var label = el("label", { for: id }, [f.l, f.req ? el("span", { class: "req", text: " *" }) : null]);

      if (f.t === "text" || f.t === "url") {
        var inp = el("input", { type: f.t === "url" ? "url" : "text", id: id, value: cur || "", placeholder: f.t === "url" ? "https://…" : null, list: f.list ? "dl-" + f.list : null, autocomplete: "off" });
        inp.value = cur || "";
        wrap.appendChild(label); wrap.appendChild(inp);
        if (f.list && !dl[f.list]) {
          var d = el("datalist", { id: "dl-" + f.list });
          var seen = {};
          CAT[f.list].concat((S.data[f.list] || []).map(function (x) { return x.category; })).forEach(function (c) { if (c && !seen[c]) { seen[c] = 1; d.appendChild(el("option", { value: c })); } });
          container.appendChild(d); dl[f.list] = true;
        }
        getters[f.k] = function () { return inp.value.trim(); };
      } else if (f.t === "textarea") {
        var ta = el("textarea", { id: id, maxlength: f.max || null });
        ta.value = cur || "";
        wrap.appendChild(label); wrap.appendChild(ta);
        getters[f.k] = function () { return ta.value.trim(); };
      } else if (f.t === "lines" || f.t === "paras" || f.t === "tags") {
        var t2 = el("textarea", { id: id });
        t2.value = f.t === "lines" ? (cur || []).join("\n") : f.t === "paras" ? (cur || []).join("\n\n") : (cur || []).join(", ");
        if (f.t === "tags") { t2 = el("input", { type: "text", id: id }); t2.value = (cur || []).join(", "); }
        wrap.appendChild(label); wrap.appendChild(t2);
        getters[f.k] = function () {
          var v = t2.value;
          var parts = f.t === "lines" ? v.split(/\n/) : f.t === "paras" ? v.split(/\n{2,}/) : v.split(",");
          return parts.map(function (x) { return x.trim(); }).filter(Boolean);
        };
      } else if (f.t === "select") {
        var sel = el("select", { id: id });
        f.opts.forEach(function (o) { var op = el("option", { value: o, text: o || "— none —" }); if (o === (cur || "")) op.selected = true; sel.appendChild(op); });
        wrap.appendChild(label); wrap.appendChild(sel);
        getters[f.k] = function () { return sel.value; };
      } else if (f.t === "bool") {
        var cb = el("input", { type: "checkbox", id: id });
        cb.checked = !!cur;
        wrap.appendChild(el("label", { class: "check", for: id }, [cb, " " + f.l]));
        getters[f.k] = function () { return cb.checked; };
      } else if (f.t === "image") {
        var state = { path: cur || "" };
        var prev = el("img", { class: "thumb", alt: "", src: imgSrc(state.path) });
        if (!state.path) prev.style.visibility = "hidden";
        var file = el("input", { type: "file", accept: "image/*", hidden: true });
        var choose = el("button", { type: "button", class: "btn small", text: state.path ? "Replace image" : "Choose image", onclick: function () { file.click(); } });
        file.addEventListener("change", function () {
          if (!file.files[0]) return;
          choose.textContent = "Processing…";
          processImage(file.files[0], f.w || 1600, ctx.nameHint && ctx.nameHint()).then(function (p) {
            state.path = p; prev.src = imgSrc(p); prev.style.visibility = "visible"; choose.textContent = "Replace image";
          }).catch(function (e) { choose.textContent = state.path ? "Replace image" : "Choose image"; showEditorError(e.message); });
        });
        wrap.appendChild(el("span", { class: "lbl" }, [f.l, f.req ? el("span", { class: "req", text: " *" }) : null]));
        wrap.appendChild(el("div", { class: "imgfield" }, [prev, choose, file]));
        getters[f.k] = function () { return state.path; };
      } else if (f.t === "shots") {
        var shots = (cur || []).map(function (s) { return { src: s.src, caption: s.caption || "" }; });
        var box = el("div", { class: "shots" });
        var addBtn = el("button", { type: "button", class: "btn small", text: "+ Add screenshots" });
        var redraw = function () {
          box.innerHTML = "";
          shots.forEach(function (s, i) {
            var cap = el("input", { type: "text", placeholder: "Caption (what does it show?)", value: s.caption });
            cap.value = s.caption;
            cap.addEventListener("input", function () { s.caption = cap.value; });
            box.appendChild(el("div", { class: "shot" }, [
              el("img", { class: "thumb", src: imgSrc(s.src), alt: "" }), cap,
              el("button", { type: "button", class: "btn small danger", text: "Remove", onclick: function () { shots.splice(i, 1); redraw(); } })
            ]));
          });
        };
        addBtn.addEventListener("click", function () {
          var inp = el("input", { type: "file", accept: "image/*", multiple: true });
          inp.addEventListener("change", function () {
            Array.prototype.slice.call(inp.files).reduce(function (p, fl) {
              return p.then(function () { return processImage(fl, 1600, ctx.nameHint && ctx.nameHint()).then(function (path) { shots.push({ src: path, caption: "" }); }).catch(function (e) { showEditorError(e.message); }); });
            }, Promise.resolve()).then(redraw);
          });
          inp.click();
        });
        wrap.appendChild(el("span", { class: "lbl", text: f.l }));
        wrap.appendChild(box); wrap.appendChild(addBtn);
        redraw();
        getters[f.k] = function () { return shots.filter(function (s) { return s.src; }).map(function (s) { return { src: s.src, caption: s.caption.trim() }; }); };
      }
      if (f.hint) wrap.appendChild(el("p", { class: "hint", text: f.hint }));
      container.appendChild(wrap);
    });
    return getters;
  }

  function showEditorError(msg) { var e = $("editor-error"); e.textContent = msg; e.hidden = !msg; }

  /* ---------------- editor dialog ---------------- */
  var editorDone = null;
  function openDialog(title, fields, source, onSave, nameHint) {
    $("editor-title").textContent = title;
    showEditorError("");
    var ctx = { nameHint: nameHint };
    var getters = buildForm($("editor-body"), fields, source, ctx);
    editorDone = function () {
      var out = {}, missing = [];
      fields.forEach(function (f) {
        if (f.s) return;
        var v = getters[f.k]();
        out[f.k] = v;
        if (f.req && (v == null || v === "" || (Array.isArray(v) && !v.length))) missing.push(f.l);
      });
      if (missing.length) { showEditorError("Please fill in: " + missing.join(", ") + "."); return false; }
      for (var i = 0; i < fields.length; i++) {
        var f2 = fields[i];
        if (f2.t === "url" && out[f2.k] && !/^https?:\/\//i.test(out[f2.k])) { showEditorError("“" + f2.l + "” must start with https://"); return false; }
      }
      onSave(out);
      return true;
    };
    var dlg = $("editor");
    if (!dlg.open) dlg.showModal();
    $("editor-body").scrollTop = 0;
  }

  function closeEditor() { var d = $("editor"); if (d.open) d.close(); editorDone = null; }
  $("editor-close").addEventListener("click", closeEditor);
  $("editor-cancel").addEventListener("click", closeEditor);
  $("editor-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (editorDone && editorDone()) closeEditor();
  });

  function openEditor(tab, index) {
    var sc = SCHEMA[tab], isNew = index < 0;
    var item = isNew ? sc.blank() : clone(S.data[tab][index]);
    var hintKey = sc.titleKey;
    var live = function () { var i = $("editor-body").querySelector("input[type=text]"); return i ? i.value : (item[hintKey] || ""); };
    openDialog((isNew ? "Add " : "Edit ") + sc.single, sc.fields, item, function (vals) {
      Object.keys(vals).forEach(function (k) { item[k] = vals[k]; });
      if (("id" in item) && !item.id) {
        var base = slug(item[hintKey] || item.group || "item"), id = base, n = 2;
        var ids = (S.data[tab] || []).map(function (x) { return x.id; });
        while (ids.indexOf(id) !== -1) id = base + "-" + n++;
        item.id = id;
      }
      if (isNew) S.data[tab].push(item); else S.data[tab][index] = item;
      setDirty(true); buildTabs(); renderPanel();
      toast("Saved. Click “Publish changes” to put it on your site.", "ok");
    }, live);
  }

  /* ---------------- profile ---------------- */
  function renderProfile(panel) {
    panel.appendChild(el("div", { class: "panel-head" }, [
      el("div", {}, [el("h1", { text: "Profile & links" }), el("p", { text: "Your intro, about text, contact links and SSIRC details." })]),
      el("button", { class: "btn primary", type: "button", onclick: function () { openProfileEditor(); }, text: "Edit profile" })
    ]));
    var p = S.data.profile || {};
    var rows = [["Headline", (p.heroLine1 || "") + " " + (p.heroLine2 || "")], ["Intro", p.intro], ["Location", p.location], ["Email", (p.links || {}).email || "(hidden)"], ["GitHub", (p.links || {}).github || "(hidden)"], ["Instagram", (p.links || {}).instagram || "(hidden)"], ["Facebook", (p.links || {}).facebook || "(hidden)"], ["LinkedIn", (p.links || {}).linkedin || "(hidden)"]];
    var list = el("div", { class: "list" });
    list.appendChild(el("div", { class: "row" }, [
      el("img", { class: "thumb", src: imgSrc(p.profileImage), alt: "" }),
      el("div", {}, [el("div", { class: "row-title", text: p.name || "Profile photo" }), el("div", { class: "row-meta", text: "Profile photo" })]),
      el("span")
    ]));
    rows.forEach(function (r) {
      list.appendChild(el("div", { class: "row noimg" }, [el("div", {}, [el("div", { class: "row-meta", text: r[0] }), el("div", { text: r[1] || "(empty)" })]), el("span")]));
    });
    panel.appendChild(list);
  }
  function openProfileEditor() {
    var working = clone(S.data);
    openDialog("Edit profile & links", PROFILE_FIELDS, working, function (vals) {
      Object.keys(vals).forEach(function (k) { setPath(S.data, k, vals[k]); });
      setDirty(true); renderPanel();
      toast("Saved. Click “Publish changes” to put it on your site.", "ok");
    }, function () { return "profile"; });
  }

  function renderPages(panel) {
    panel.appendChild(el("div", { class: "panel-head" }, [
      el("div", {}, [el("h1", { text: "Page text" }), el("p", { text: "Every heading, intro line and button label on the site. Clear a field to go back to the built-in text." })]),
      el("button", { class: "btn primary", type: "button", onclick: function () {
        var working = clone(S.data);
        openDialog("Edit page text", PAGE_FIELDS, working, function (vals) {
          Object.keys(vals).forEach(function (k) { setPath(S.data, k, vals[k]); });
          setDirty(true); renderPanel(); toast("Saved. Click “Publish changes” to put it on your site.", "ok");
        }, function () { return "page"; });
      }, text: "Edit page text" })
    ]));
    var list = el("div", { class: "list" });
    var pg = S.data.pages || {};
    ["home", "about", "projects", "design", "gallery", "experience", "contact"].forEach(function (k) {
      var p = pg[k] || {};
      list.appendChild(el("div", { class: "row noimg" }, [el("div", {}, [el("div", { class: "row-meta", text: k }), el("div", { class: "row-title", text: p.title || p.lead || "(built-in text)" })]), el("span")]));
    });
    panel.appendChild(list);
  }

  /* ---------------- backup ---------------- */
  $("btn-backup").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(S.data, null, 2)], { type: "application/json" });
    var a = el("a", { href: URL.createObjectURL(blob), download: "content-backup-" + new Date().toISOString().slice(0, 10) + ".json" });
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------------- publish ---------------- */
  function referencedUploads() {
    var found = {};
    (function walk(v) {
      if (typeof v === "string") { if (S.pending[v]) found[v] = true; }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.keys(v).forEach(function (k) { walk(v[k]); });
    })(S.data);
    return Object.keys(found);
  }

  function publish() {
    if (S.busy || !S.dirty) return;
    S.busy = true;
    var pill = $("status");
    pill.textContent = "Publishing…"; pill.className = "pill busy";
    $("btn-publish").disabled = true;
    var repo = "/repos/" + S.repo, files = referencedUploads(), commitSha, baseTree;
    var json = JSON.stringify(S.data, null, 2) + "\n";

    gh(repo + "/git/ref/heads/" + encodeURIComponent(S.branch)).then(function (ref) {
      commitSha = ref.object.sha;
      return gh(repo + "/git/commits/" + commitSha);
    }).then(function (c) {
      baseTree = c.tree.sha;
      // make sure nobody changed content.json since we loaded it
      return gh(repo + "/contents/" + DATA_PATH + "?ref=" + encodeURIComponent(S.branch));
    }).then(function (cur) {
      if (cur.sha !== S.loadedSha) throw new Error("The content changed on GitHub since you signed in. Download a Backup, sign out, sign in again and re-apply your edits.");
      var entries = [];
      var chain = files.reduce(function (p, path) {
        return p.then(function () {
          return blobToB64(S.pending[path].blob).then(function (b64) {
            return gh(repo + "/git/blobs", { method: "POST", body: { content: b64, encoding: "base64" } });
          }).then(function (b) { entries.push({ path: path, mode: "100644", type: "blob", sha: b.sha }); });
        });
      }, Promise.resolve());
      return chain.then(function () {
        return gh(repo + "/git/blobs", { method: "POST", body: { content: utf8ToB64(json), encoding: "base64" } });
      }).then(function (b) {
        entries.push({ path: DATA_PATH, mode: "100644", type: "blob", sha: b.sha });
        return entries;
      });
    }).then(function (entries) {
      return gh(repo + "/git/trees", { method: "POST", body: { base_tree: baseTree, tree: entries } });
    }).then(function (tree) {
      var n = files.length;
      return gh(repo + "/git/commits", { method: "POST", body: { message: "Update portfolio content via admin" + (n ? " (" + n + " image" + (n > 1 ? "s" : "") + ")" : ""), tree: tree.sha, parents: [commitSha] } });
    }).then(function (commit) {
      return gh(repo + "/git/refs/heads/" + encodeURIComponent(S.branch), { method: "PATCH", body: { sha: commit.sha } });
    }).then(function () {
      return gh(repo + "/contents/" + DATA_PATH + "?ref=" + encodeURIComponent(S.branch));
    }).then(function (cur) {
      S.loadedSha = cur.sha;
      // uploaded images now live in the repo — keep showing them from there
      files.forEach(function (p) { delete S.pending[p]; });
      S.busy = false;
      setDirty(false);
      toast("Published! Your site updates in about a minute.", "ok");
      renderPanel();
    }).catch(function (e) {
      S.busy = false;
      setDirty(true);
      toast("Could not publish: " + e.message, "err");
    });
  }
  $("btn-publish").addEventListener("click", publish);

  /* ---------------- boot ---------------- */
  (function boot() {
    try {
      var repo = localStorage.getItem("gd_repo");
      if (repo) $("in-repo").value = repo;
      var tok = sessionStorage.getItem("gd_token") || localStorage.getItem("gd_token");
      if (tok) {
        $("in-token").value = tok;
        if (localStorage.getItem("gd_token")) $("in-remember").checked = true;
        if (repo) {
          $("login-btn").textContent = "Signing in…";
          signIn(repo, tok, $("in-remember").checked).catch(function (e) {
            $("login-error").textContent = e.message; $("login-error").hidden = false; $("login-btn").textContent = "Sign in";
          });
        }
      }
    } catch (e) { /* storage unavailable */ }
  })();

  // expose for tests
  window.__admin = { S: S, processImage: processImage };
})();
