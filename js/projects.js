/* ==========================================================================
   GAURAB PANTHA — PORTFOLIO
   Project data + filtering system
   To add a project later: append an object to the PROJECTS array below.
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
    link: "#"
  },
  {
    slug: "reminder",
    name: "Reminder",
    category: "Browser Extension",
    filter: "extensions",
    desc: "A browser extension focused on reminders and everyday productivity.",
    tags: ["JavaScript", "Chrome API", "Productivity"],
    image: "assets/images/projects/reminder.jpg",
    link: "#"
  },
  {
    slug: "site-blocker",
    name: "Site Blocker",
    category: "Browser Extension",
    filter: "extensions",
    desc: "A browser extension experiment for blocking selected websites.",
    tags: ["JavaScript", "Chrome API"],
    image: "assets/images/projects/site-blocker.jpg",
    link: "#"
  },
  {
    slug: "dark-mode",
    name: "Dark Mode",
    category: "Browser Extension",
    filter: "extensions",
    desc: "A browser extension that applies dark-mode styling across websites.",
    tags: ["JavaScript", "CSS", "Chrome API"],
    image: "assets/images/projects/dark-mode.jpg",
    link: "#"
  },
  {
    slug: "stardance",
    name: "Stardance",
    category: "Hack Club",
    filter: "hackclub",
    desc: "A project built through Hack Club's YSWS ecosystem, used as a way to learn and experiment.",
    tags: ["Hack Club", "YSWS"],
    image: "assets/images/projects/stardance.jpg",
    link: "#"
  },
  {
    slug: "3am",
    name: "3AM",
    category: "Hack Club",
    filter: "hackclub",
    desc: "A Hack Club project built for exploration and hands-on learning.",
    tags: ["Hack Club", "YSWS"],
    image: "assets/images/projects/3am.jpg",
    link: "#"
  },
  {
    slug: "beest",
    name: "Beest",
    category: "Hack Club",
    filter: "hackclub",
    desc: "A Hack Club project built for exploration and hands-on learning.",
    tags: ["Hack Club", "YSWS"],
    image: "assets/images/projects/beest.jpg",
    link: "#"
  }
];

(function () {
  "use strict";

  var grid = document.getElementById("project-grid");
  if (!grid) return;

  var filterBar = document.querySelector(".filter-bar");
  var limit = grid.getAttribute("data-limit");
  var data = limit ? PROJECTS.slice(0, parseInt(limit, 10)) : PROJECTS;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function cardHTML(project, index) {
    return (
      '<article class="project-card" data-filter="' + project.filter + '">' +
        '<a class="project-thumb" href="' + project.link + '" aria-label="View ' + project.name + '">' +
          '<img src="' + project.image + '" alt="' + project.name + '" loading="lazy" width="800" height="600">' +
        '</a>' +
        '<div class="project-body">' +
          '<div class="project-top">' +
            '<span class="project-num">' + pad(index + 1) + '</span>' +
            '<span class="project-cat">' + project.category + '</span>' +
          '</div>' +
          '<h3 class="project-name">' + project.name + '</h3>' +
          '<p class="project-desc">' + project.desc + '</p>' +
          '<div class="project-tags">' +
            project.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join("") +
          '</div>' +
          '<a class="project-link" href="' + project.link + '">View project <span class="arrow">&rarr;</span></a>' +
        '</div>' +
      '</article>'
    );
  }

  function render(list) {
    if (!list.length) {
      grid.innerHTML = '<p class="section-sub">No projects in this category yet — check back soon.</p>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join("");
  }

  render(data);

  if (filterBar && !limit) {
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;

      filterBar.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");

      var value = btn.getAttribute("data-filter");
      var filtered = value === "all" ? data : data.filter(function (p) { return p.filter === value; });
      render(filtered);
    });
  }
})();
