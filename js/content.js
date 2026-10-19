/* ==========================================================================
   GAURABDEV — content renderer
   Everything you see on the site (projects, designs, events, gallery, skills,
   profile text, links) comes from data/content.json. Edit it in /admin —
   no need to touch the HTML or this file.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slug(s) {
    return String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    return /^(https?:\/\/|mailto:)/i.test(u) ? u : "";
  }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function $(id) { return document.getElementById(id); }
  function pretty(url) { return String(url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); }

  var STATUS_CLASS = { "in progress": "is-progress", "prototype": "is-proto", "completed": "is-done", "concept": "is-concept" };
  function statusBadge(s) {
    if (!s) return "";
    return '<span class="status ' + (STATUS_CLASS[String(s).toLowerCase()] || "") + '">' + esc(s) + "</span>";
  }

  function staggerIn(container) {
    if (reduceMotion) return;
    container.querySelectorAll(".project-card, .event-card, .design-card, .gallery-item").forEach(function (el, i) {
      el.style.setProperty("--i", Math.min(i, 8));
      el.classList.add("is-entering");
    });
  }

  function vis(list) { return (list || []).filter(function (x) { return !x.hidden; }); }

  /* ---------------- Loading ---------------- */
  function load() {
    return fetch("/data/content.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("content.json " + r.status);
      return r.json();
    });
  }

  /* ---------------- Simple bindings ---------------- */
  function bind(data) {
    var p = data.profile || {};
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      var v = get(data, el.getAttribute("data-bind"));
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-bind-src]").forEach(function (el) {
      var v = get(data, el.getAttribute("data-bind-src"));
      if (v) el.setAttribute("src", v);
    });
    document.querySelectorAll("[data-link]").forEach(function (el) {
      var key = el.getAttribute("data-link");
      var v = get(p.links || {}, key) || get(p, key) || get(p.ssirc || {}, key);
      var isMail = key === "email" || key === "ssirc.email";
      if (!v) { el.hidden = true; return; }
      el.hidden = false;
      var href = isMail ? "mailto:" + v : safeUrl(v);
      if (!href) { el.hidden = true; return; }
      el.setAttribute("href", href);
      var val = el.querySelector(".contact-link-value");
      if (val) val.textContent = isMail ? v : pretty(v);
    });
  }

  function renderSocial(data) {
    var links = (data.profile || {}).links || {};
    var wrap = document.querySelector(".footer-social");
    if (!wrap) return;
    var defs = [["github", "GitHub"], ["instagram", "Instagram"], ["facebook", "Facebook"], ["linkedin", "LinkedIn"], ["email", "Email"]];
    wrap.innerHTML = defs.map(function (d) {
      var v = links[d[0]];
      if (!v) return "";
      var mail = d[0] === "email";
      var href = mail ? "mailto:" + v : safeUrl(v);
      if (!href) return "";
      return '<a href="' + esc(href) + '"' + (mail ? "" : ' target="_blank" rel="noopener"') +
        ' aria-label="' + (mail ? "Email me" : d[1] + " (opens in a new tab)") + '">' +
        '<img src="/assets/icons/' + (mail ? "mail" : d[0]) + '.svg" alt="" width="18" height="18"></a>';
    }).join("");
  }

  /* ---------------- Projects ---------------- */
  function projectCard(p) {
    var href = "/project/?p=" + encodeURIComponent(p.id);
    var tags = (p.tags || []).slice(0, 4).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    return (
      '<article class="project-card" data-cat="' + esc(slug(p.category)) + '">' +
        '<a class="project-thumb" href="' + href + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + esc(p.image) + '" alt="" loading="lazy" width="1200" height="900"></a>' +
        '<div class="project-body">' +
          '<div class="project-top"><span class="project-cat">' + esc(p.category) + "</span>" + statusBadge(p.status) + "</div>" +
          '<h3 class="project-name"><a href="' + href + '">' + esc(p.name) + "</a></h3>" +
          '<p class="project-desc">' + esc(p.summary) + "</p>" +
          '<div class="project-tags">' + tags + "</div>" +
          '<a class="project-link" href="' + href + '">View details <span class="arrow" aria-hidden="true">&rarr;</span></a>' +
        "</div></article>"
    );
  }

  function buildFilters(bar, items, key, onChange) {
    var cats = [];
    items.forEach(function (it) {
      var c = it[key];
      if (c && cats.indexOf(c) === -1) cats.push(c);
    });
    if (cats.length < 2) { bar.hidden = true; onChange("all"); return function () {}; }
    bar.hidden = false;
    bar.innerHTML = '<button class="filter-btn is-active" data-filter="all" aria-pressed="true">All<span class="count" aria-hidden="true">' + items.length + "</span></button>" +
      cats.map(function (c) {
        var n = items.filter(function (it) { return it[key] === c; }).length;
        return '<button class="filter-btn" data-filter="' + esc(slug(c)) + '" aria-pressed="false">' + esc(c) + '<span class="count" aria-hidden="true">' + n + "</span></button>";
      }).join("");
    function apply(v, push) {
      if (v !== "all" && !cats.some(function (c) { return slug(c) === v; })) v = "all";
      bar.querySelectorAll(".filter-btn").forEach(function (b) {
        var on = b.getAttribute("data-filter") === v;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      onChange(v);
      if (push && history.replaceState) history.replaceState(null, "", v === "all" ? location.pathname + location.search : "#" + v);
    }
    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".filter-btn");
      if (b) apply(b.getAttribute("data-filter"), true);
    });
    apply(location.hash.replace("#", ""), false);
    return apply;
  }

  function renderProjects(data) {
    var grid = $("project-grid");
    if (!grid) return;
    var all = vis(data.projects);
    var featured = grid.hasAttribute("data-featured");
    var list = all;
    if (featured) {
      list = all.filter(function (p) { return p.featured; });
      if (!list.length) list = all.slice(0, 3);
      grid.innerHTML = list.map(projectCard).join("");
      staggerIn(grid);
      return;
    }
    function show(v) {
      var shown = v === "all" ? all : all.filter(function (p) { return slug(p.category) === v; });
      grid.innerHTML = shown.length ? shown.map(projectCard).join("") : '<p class="empty-note">Nothing here yet — more projects are on the way.</p>';
      staggerIn(grid);
    }
    var bar = document.querySelector("[data-filter-bar='projects']");
    if (bar) buildFilters(bar, all, "category", show); else show("all");
  }

  /* ---------------- Project detail page ---------------- */
  function listHTML(arr) {
    return '<ul class="detail-list">' + arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
  }
  function para(s) {
    return String(s).split(/\n{2,}/).map(function (x) { return "<p>" + esc(x).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function block(title, html) {
    return '<section class="detail-block"><h2 class="detail-h">' + esc(title) + "</h2>" + html + "</section>";
  }

  function renderProjectDetail(data) {
    var root = $("project-detail");
    if (!root) return;
    var id = new URLSearchParams(location.search).get("p");
    var p = vis(data.projects).filter(function (x) { return x.id === id; })[0];
    if (!p) {
      root.innerHTML = '<div class="container"><p class="eyebrow">Project</p><h1 class="detail-title">Project not found</h1>' +
        '<p class="detail-summary">That project doesn\'t exist (or was removed).</p>' +
        '<a class="btn btn-primary" href="/projects/">See all projects</a></div>';
      return;
    }
    document.title = p.name + " — Gaurab Pantha";
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", p.summary);
    var links = [];
    if (safeUrl(p.demo)) links.push('<a class="btn btn-primary" href="' + esc(p.demo) + '" target="_blank" rel="noopener">Live demo <span aria-hidden="true">&nearr;</span></a>');
    if (safeUrl(p.repo)) links.push('<a class="btn btn-ghost" href="' + esc(p.repo) + '" target="_blank" rel="noopener">Source code <span aria-hidden="true">&nearr;</span></a>');
    if (safeUrl(p.link)) links.push('<a class="btn btn-ghost" href="' + esc(p.link) + '" target="_blank" rel="noopener">Visit project <span aria-hidden="true">&nearr;</span></a>');

    var body = "";
    if (p.problem) body += block("Purpose", para(p.problem));
    if (p.features && p.features.length) body += block("What's implemented", listHTML(p.features));
    if (p.tags && p.tags.length) body += block("Technologies", '<div class="project-tags">' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>");
    if (p.contribution) body += block("My contribution", para(p.contribution));
    if (p.lessons) body += block("What I learned", para(p.lessons));
    if (p.screenshots && p.screenshots.length) {
      body += block("Screenshots", '<div class="gallery-grid shots">' + p.screenshots.map(function (s) {
        return '<figure class="gallery-item"><img src="' + esc(s.src) + '" alt="' + esc(s.caption || p.name + " screenshot") + '" loading="lazy">' +
          (s.caption ? '<figcaption class="gallery-cap">' + esc(s.caption) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div>");
    }
    if (!p.problem && !(p.features && p.features.length) && !p.contribution && !p.lessons) {
      body += '<p class="empty-note">A full write-up for this project is coming soon.</p>';
    }

    root.innerHTML =
      '<div class="container">' +
        '<a class="back-link" href="/projects/">&larr; All projects</a>' +
        '<div class="detail-head"><p class="eyebrow">' + esc(p.category) + "</p>" +
        '<h1 class="detail-title">' + esc(p.name) + " " + statusBadge(p.status) + "</h1>" +
        '<p class="detail-summary">' + esc(p.summary) + "</p>" +
        (links.length ? '<div class="hero-actions">' + links.join("") + "</div>" : "") + "</div>" +
        '<div class="detail-cover"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + ' preview" width="1200" height="900"></div>' +
        '<div class="detail-body">' + body + "</div>" +
      "</div>";
  }

  /* ---------------- Events / gallery ---------------- */
  function renderEvents(data) {
    var el = $("event-grid");
    if (!el) return;
    var list = vis(data.events);
    var limit = parseInt(el.getAttribute("data-limit") || "0", 10);
    if (limit) list = list.slice(0, limit);
    el.innerHTML = list.map(function (e) {
      return '<article class="event-card"><div class="event-thumb"><img src="' + esc(e.image) + '" alt="' + esc(e.title) + '" loading="lazy"></div>' +
        '<div class="event-body"><p class="event-cat">' + esc(e.category) + "</p>" +
        '<h3 class="event-title">' + esc(e.title) + "</h3>" +
        (e.date ? '<span class="event-date">' + esc(e.date) + "</span>" : "") +
        '<p class="event-desc">' + esc(e.description) + "</p></div></article>";
    }).join("") || '<p class="empty-note">Events will appear here.</p>';
    staggerIn(el);
  }

  function renderGallery(data) {
    var el = $("gallery-grid");
    if (!el) return;
    var all = vis(data.gallery);
    var limit = parseInt(el.getAttribute("data-limit") || "0", 10);
    function show(v) {
      var shown = v === "all" ? all : all.filter(function (g) { return slug(g.category) === v; });
      if (limit) shown = shown.slice(0, limit);
      el.innerHTML = shown.map(function (g) {
        var cap = g.caption || "";
        return '<figure class="gallery-item"><img src="' + esc(g.image) + '" alt="' + esc(cap || "Gallery photo") + '" loading="lazy">' +
          '<figcaption class="gallery-cap">' + esc(cap) + (g.date ? ' &middot; ' + esc(g.date) : "") + "</figcaption></figure>";
      }).join("") || '<p class="empty-note">Photos will appear here.</p>';
      staggerIn(el);
    }
    var bar = document.querySelector("[data-filter-bar='gallery']");
    if (bar && !limit) buildFilters(bar, all, "category", show); else show("all");
  }

  /* ---------------- Design gallery ---------------- */
  function renderDesigns(data) {
    var grid = $("design-grid");
    if (!grid) return;
    var all = vis(data.designs);
    var empty = $("design-empty");
    var bar = document.querySelector("[data-filter-bar='designs']");
    if (!all.length) {
      grid.hidden = true;
      if (bar) bar.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.hidden = false;

    function card(d, i) {
      return '<button type="button" class="design-card" data-i="' + i + '" aria-label="Open ' + esc(d.title) + '">' +
        '<img src="' + esc(d.image) + '" alt="' + esc(d.title) + '" loading="lazy">' +
        '<span class="design-card-info"><span class="design-card-cat">' + esc(d.category) + '</span><span class="design-card-title">' + esc(d.title) + "</span></span></button>";
    }
    var shown = all;
    function show(v) {
      shown = v === "all" ? all : all.filter(function (d) { return slug(d.category) === v; });
      grid.innerHTML = shown.map(card).join("");
      staggerIn(grid);
    }
    if (bar) buildFilters(bar, all, "category", show); else show("all");

    var modal = $("design-modal");
    if (!modal) return;
    var cur = 0, last = null;
    function fill(i) {
      cur = (i + shown.length) % shown.length;
      var d = shown[cur];
      modal.querySelector(".dm-img").src = d.image;
      modal.querySelector(".dm-img").alt = d.title;
      modal.querySelector(".dm-cat").textContent = d.category;
      modal.querySelector(".dm-title").textContent = d.title;
      var rows = [["Purpose", d.description], ["My role", d.role], ["Audience", d.audience], ["Design choices", d.choices], ["Date", d.date], ["Created for", d.client]];
      modal.querySelector(".dm-meta").innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
        return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>";
      }).join("");
      modal.querySelector(".dm-count").textContent = (cur + 1) + " / " + shown.length;
      modal.querySelectorAll(".dm-nav").forEach(function (b) { b.hidden = shown.length < 2; });
    }
    function open(i) {
      last = document.activeElement;
      fill(i);
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      modal.querySelector(".dm-close").focus();
    }
    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (last && last.focus) last.focus();
    }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".design-card");
      if (b) open(parseInt(b.getAttribute("data-i"), 10));
    });
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    modal.querySelector(".dm-close").addEventListener("click", close);
    modal.querySelector(".dm-prev").addEventListener("click", function () { fill(cur - 1); });
    modal.querySelector(".dm-next").addEventListener("click", function () { fill(cur + 1); });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") fill(cur - 1);
      else if (e.key === "ArrowRight") fill(cur + 1);
    });
  }

  /* ---------------- About / skills / experience ---------------- */
  function renderAbout(data) {
    var p = data.profile || {};
    var about = $("about-copy");
    if (about) {
      about.innerHTML = (p.about || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
        (p.aspiration ? "<p>" + esc(p.aspiration) + "</p>" : "") +
        (p.tagline ? '<p class="about-statement">' + esc(p.tagline) + "</p>" : "");
    }
    var skills = $("skills-grid");
    if (skills) {
      skills.innerHTML = (data.skills || []).map(function (g) {
        return '<div class="skill-group"><p class="skill-group-title">' + esc(g.group) + "</p><ul>" +
          (g.items || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
      }).join("");
    }
    var s = p.ssirc || {};
    var roles = document.querySelectorAll("[data-roles]");
    roles.forEach(function (el) {
      el.innerHTML = (s.roles || []).map(function (r) { return '<div class="role-item"><span>Role</span>' + esc(r) + "</div>"; }).join("");
    });
    var contrib = $("contrib-list");
    if (contrib) contrib.innerHTML = (s.contributions || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    document.querySelectorAll("[data-ssirc-summary]").forEach(function (el) { if (s.summary) el.textContent = s.summary; });
  }

  function renderBlocks(data) {
    var sv = $("services-grid");
    if (sv && data.services && data.services.length) {
      sv.innerHTML = data.services.map(function (x, i) {
        return '<div class="service-card"><div class="service-num">0' + (i + 1) + '</div><h3 class="service-title">' + esc(x.title) + '</h3><p class="service-desc">' + esc(x.description) + "</p></div>";
      }).join("");
    }
    var f = $("facts-grid");
    if (f && data.facts && data.facts.length) {
      f.innerHTML = data.facts.map(function (x) {
        return '<div class="intro-item"><div class="intro-item-label">' + esc(x.label) + '</div><div class="intro-item-value">' + esc(x.value) + "</div></div>";
      }).join("");
    }
    var t = $("timeline-grid");
    if (t && data.timeline && data.timeline.length) {
      t.innerHTML = data.timeline.map(function (x) {
        return '<div class="timeline-item"><p class="timeline-stage">' + esc(x.stage) + '</p><h3 class="timeline-title">' + esc(x.title) + '</h3><p class="timeline-desc">' + esc(x.description) + "</p></div>";
      }).join("");
    }
  }

  function renderHero(data) {
    var p = data.profile || {};
    var l1 = document.querySelector("[data-hero-1]"), l2 = document.querySelector("[data-hero-2]");
    if (l1 && p.heroLine1) l1.textContent = p.heroLine1;
    if (l2 && p.heroLine2) l2.textContent = p.heroLine2;
  }

  /* ---------------- Run ---------------- */
  function fixPaths(v) {
    if (typeof v === "string") return /^assets\//.test(v) ? "/" + v : v;
    if (Array.isArray(v)) return v.map(fixPaths);
    if (v && typeof v === "object") { var o = {}; Object.keys(v).forEach(function (k) { o[k] = fixPaths(v[k]); }); return o; }
    return v;
  }

  function run(data) {
    data = fixPaths(data);
    window.SITE_DATA = data;
    bind(data);
    renderHero(data);
    renderBlocks(data);
    renderSocial(data);
    renderProjects(data);
    renderProjectDetail(data);
    renderEvents(data);
    renderGallery(data);
    renderDesigns(data);
    renderAbout(data);
    document.dispatchEvent(new CustomEvent("site:ready", { detail: data }));
  }

  load().then(run).catch(function (err) {
    if (window.console) console.warn("Could not load content:", err);
    document.querySelectorAll("[data-needs-content]").forEach(function (el) {
      el.innerHTML = '<p class="empty-note">Content could not be loaded. Please refresh, or open the site through a web server.</p>';
    });
  });
})();
