/* ==========================================================================
   GAURAB PANTHA — PORTFOLIO
   Core site behaviour: navigation, scroll effects, reveal, lightbox
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Sticky header ---------------- */
  var header = document.querySelector(".site-header");

  function onScrollHeader() {
    if (!header) return;
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle("is-scrolled", y > 8);
  }

  /* ---------------- Scroll progress bar ---------------- */
  var progress = document.querySelector(".scroll-progress");

  function onScrollProgress() {
    if (!progress) return;
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    progress.style.width = pct + "%";
  }

  function onScroll() {
    onScrollHeader();
    onScrollProgress();
    toggleBackToTop();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Footer social links from js/config.js ---------------- */
  var site = window.SITE || {};
  var social = document.querySelector(".footer-social");
  if (social) {
    [["instagram", "Instagram"], ["facebook", "Facebook"], ["linkedin", "LinkedIn"], ["email", "Email"]].forEach(function (item) {
      if (!site[item[0]]) return;
      var isMail = item[0] === "email";
      var a = document.createElement("a");
      a.href = isMail ? "mailto:" + site.email : site[item[0]];
      if (!isMail) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.setAttribute("aria-label", isMail ? "Email me" : item[1] + " (opens in a new tab)");
      var img = document.createElement("img");
      img.src = "assets/icons/" + (isMail ? "mail" : item[0]) + ".svg";
      img.alt = "";
      img.width = 18;
      img.height = 18;
      a.appendChild(img);
      social.appendChild(a);
    });
  }

  /* ---------------- Mobile menu ---------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");

  function closeMenu() {
    if (!mobileMenu || !navToggle) return;
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function openMenu() {
    if (!mobileMenu || !navToggle) return;
    mobileMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) closeMenu();
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------- Back to top ---------------- */
  var backToTop = document.querySelector(".back-to-top");

  function toggleBackToTop() {
    if (!backToTop) return;
    var y = window.scrollY || window.pageYOffset;
    backToTop.style.opacity = y > 600 ? "1" : "0.4";
  }

  if (backToTop) {
    backToTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- Lightbox (gallery) ---------------- */
  var lightbox = document.querySelector(".lightbox");
  var lightboxInner = lightbox ? lightbox.querySelector(".lightbox-inner") : null;
  var lightboxImg = lightbox ? lightbox.querySelector("img") : null;
  var lightboxCap = lightbox ? lightbox.querySelector(".lightbox-cap") : null;
  var lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var current = -1;
  var lastFocused = null;
  var lightboxCount = null;
  var prevBtn = null;
  var nextBtn = null;

  if (lightboxInner && items.length > 1) {
    prevBtn = document.createElement("button");
    prevBtn.className = "lightbox-nav lightbox-nav--prev";
    prevBtn.setAttribute("aria-label", "Previous image");
    prevBtn.innerHTML = "&#8592;";
    nextBtn = document.createElement("button");
    nextBtn.className = "lightbox-nav lightbox-nav--next";
    nextBtn.setAttribute("aria-label", "Next image");
    nextBtn.innerHTML = "&#8594;";
    lightboxCount = document.createElement("p");
    lightboxCount.className = "lightbox-count";
    lightboxCount.setAttribute("aria-live", "polite");
    lightboxInner.appendChild(prevBtn);
    lightboxInner.appendChild(nextBtn);
    lightboxInner.appendChild(lightboxCount);
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () { show(current + 1); });
  }

  function show(index) {
    if (!lightbox || !lightboxImg || !items.length) return;
    current = (index + items.length) % items.length;
    var img = items[current].querySelector("img");
    var capEl = items[current].querySelector(".gallery-cap");
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "";
    if (lightboxCap) lightboxCap.textContent = capEl ? capEl.textContent : img.alt;
    if (lightboxCount) lightboxCount.textContent = (current + 1) + " / " + items.length;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    show(index);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  items.forEach(function (item, i) {
    item.addEventListener("click", function () { openLightbox(i); });
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);

  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });

    // Swipe left/right on touch screens
    var startX = null;
    lightbox.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
})();
