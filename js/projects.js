/* ==========================================================================
   GAURAB PANTHA — PORTFOLIO
   Project data + filtering system
   To add a project later: append an object to the PROJECTS array below.
   Set `link` to the project's URL (GitHub repo, live demo, store page).
   While `link` is "", the card shows "Link coming soon" instead of a dead link.
   ========================================================================== */

var PROJECTS = [
  {
    slug: "esp32-bluetooth-car",
    name: "ESP32 Bluetooth Car",
    category: "Robotics",
    filter: "robotics",
    desc: "A hands-on robotics project exploring embedded technology, Bluetooth control, electronics, and motors.",
    tags: ["ESP32", "Bluetooth", "Electronics", "Motors"],
    image: "assets/images/projects/esp32-car.jpg",
    link: ""
  },
  {
    slug: "reminder",
    name: "Reminder",
    category: "Browser Extension",
    filter: "extensions",
    desc: "A browser extension focused on reminders and everyday productivity.",
    tags: ["JavaScript", "Chrome API", "Productivity"],
    image: "assets/images/projects/reminder.jpg",
    link: ""
  },
  {
    slug: "site-blocker",
    name: "Site Blocker",
    category: "Browser Extension",
    filter: "extensions",
    desc: "A browser extension experiment for blocking selected websites.",
    tags: ["JavaScript", "Chrome API"],
    image: "assets/images/projects/site-blocker.jpg",
    link: ""
  },
  {
    slug: "dark-mode",
    name: "Dark Mode",
    category: "Browser Extension",
    filter: "extensions",
    desc: "A browser extension that applies dark-mode styling across websites.",
    tags: ["JavaScript", "CSS", "Chrome API"],
    image: "assets/images/projects/dark-mode.jpg",
    link: ""
  },
  {
    slug: "stardance",
    name: "Stardance",
    category: "Hack Club",
    filter: "hackclub",
    desc: "A project built through Hack Club's YSWS ecosystem, used as a way to learn and experiment.",
    tags: ["Hack Club", "YSWS"],
    image: "assets/images/projects/stardance.jpg",
    link: ""
  },
  {
    slug: "3am",
    name: "3AM",
    category: "Hack Club",
    filter: "hackclub",
    desc: "A Hack Club project built for exploration and hands-on learning.",
    tags: ["Hack Club", "YSWS"],
    image: "assets/images/projects/3am.jpg",
    link: ""
  },
  {
    slug: "beest",
    name: "Beest",
    category: "Hack Club",
    filter: "hackclub",
    desc: "A Hack Club project built for exploration and hands-on learning.",
    tags: ["Hack Club", "YSWS"],
    image: "assets/images/projects/beest.jpg",
    link: ""
  }
];

(function () {
  "use strict";

  var grid = document.getElementById("project-grid");
  if (!grid) return;

  var filterBar = document.querySelector(".filter-bar");
  var limit = grid.getAttribute("data-limit");
  var data = limit ? PROJECTS.slice(0, parseInt(limit, 10)) : PROJECTS;

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cardHTML(project) {
    var hasLink = !!project.link;
    var ext = /^https?:/.test(project.link) ? ' target="_blank" rel="noopener"' : "";
    var img = '<img src="' + project.image + '" alt="' + esc(project.name) + ' preview" loading="lazy" width="1200" height="900">';
    var thumb = hasLink
      ? '<a class="project-thumb" href="' + esc(project.link) + '"' + ext + ' aria-label="Open ' + esc(project.name) + '" tabindex="-1">' + img + '</a>'
      : '<div class="project-thumb">' + img + '</div>';
    var action = hasLink
      ? '<a class="project-link" href="' + esc(project.link) + '"' + ext + '>View project <span class="arrow" aria-hidden="true">&rarr;</span></a>'
      : '<span class="project-link is-soon">Link coming soon</span>';

    return (
      '<article class="project-card" data-filter="' + project.filter + '">' +
        thumb +
        '<div class="project-body">' +
          '<div class="project-top"><span class="project-cat">' + esc(project.category) + '</span></div>' +
          '<h3 class="project-name">' + esc(project.name) + '</h3>' +
          '<p class="project-desc">' + esc(project.desc) + '</p>' +
          '<div class="project-tags">' +
            project.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join("") +
          '</div>' +
          action +
        '</div>' +
      '</article>'
    );
  }

  function render(list) {
    if (!list.length) {
      grid.innerHTML = '<p class="section-sub">Nothing here yet. More projects are on the way.</p>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join("");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      grid.querySelectorAll(".project-card").forEach(function (card, i) {
        card.style.setProperty("--i", i);
        card.classList.add("is-entering");
      });
    }
  }

  var filters = ["all", "extensions", "robotics", "hackclub"];

  // Show how many projects each filter holds
  if (filterBar && !limit) {
    filterBar.querySelectorAll(".filter-btn").forEach(function (btn) {
      var v = btn.getAttribute("data-filter");
      var n = v === "all" ? data.length : data.filter(function (p) { return p.filter === v; }).length;
      var span = document.createElement("span");
      span.className = "count";
      span.setAttribute("aria-hidden", "true");
      span.textContent = n;
      btn.appendChild(span);
    });
  }

  function apply(value, updateHash) {
    if (filters.indexOf(value) === -1) value = "all";
    if (filterBar) {
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) {
        var on = b.getAttribute("data-filter") === value;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    render(value === "all" ? data : data.filter(function (p) { return p.filter === value; }));
    if (updateHash && window.history && history.replaceState) {
      history.replaceState(null, "", value === "all" ? location.pathname + location.search : "#" + value);
    }
  }

  // Open straight into a filter, e.g. projects.html#robotics
  apply(limit ? "all" : location.hash.replace("#", ""), false);

  if (filterBar && !limit) {
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      apply(btn.getAttribute("data-filter"), true);
    });
  }
})();
