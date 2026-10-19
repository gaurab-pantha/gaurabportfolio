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

  /* ---------------- Lightbox (gallery, rendered dynamically) ---------------- */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var lightboxInner = lightbox.querySelector(".lightbox-inner");
    var lightboxImg = lightbox.querySelector("img");
    var lightboxCap = lightbox.querySelector(".lightbox-cap");
    var lightboxClose = lightbox.querySelector(".lightbox-close");
    var current = -1, lastFocused = null, items = [];

    var prevBtn = document.createElement("button");
    prevBtn.className = "lightbox-nav lightbox-nav--prev";
    prevBtn.setAttribute("aria-label", "Previous image");
    prevBtn.innerHTML = "&#8592;";
    var nextBtn = document.createElement("button");
    nextBtn.className = "lightbox-nav lightbox-nav--next";
    nextBtn.setAttribute("aria-label", "Next image");
    nextBtn.innerHTML = "&#8594;";
    var lightboxCount = document.createElement("p");
    lightboxCount.className = "lightbox-count";
    lightboxCount.setAttribute("aria-live", "polite");
    lightboxInner.appendChild(prevBtn);
    lightboxInner.appendChild(nextBtn);
    lightboxInner.appendChild(lightboxCount);
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () { show(current + 1); });

    var show = function (index) {
      current = (index + items.length) % items.length;
      var img = items[current].querySelector("img");
      var capEl = items[current].querySelector(".gallery-cap");
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      lightboxCap.textContent = capEl ? capEl.textContent : img.alt;
      lightboxCount.textContent = (current + 1) + " / " + items.length;
      prevBtn.hidden = nextBtn.hidden = lightboxCount.hidden = items.length < 2;
    };
    var openLightbox = function (list, index) {
      items = list;
      lastFocused = document.activeElement;
      show(index);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lightboxClose.focus();
    };
    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    function itemFrom(target) {
      var el = target.closest(".gallery-item");
      if (!el) return null;
      var scope = el.parentElement;
      var list = Array.prototype.slice.call(scope.querySelectorAll(".gallery-item"));
      return { list: list, index: list.indexOf(el) };
    }
    document.addEventListener("click", function (e) {
      var hit = itemFrom(e.target);
      if (hit) openLightbox(hit.list, hit.index);
    });
    document.addEventListener("keydown", function (e) {
      if (lightbox.classList.contains("is-open")) {
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") show(current - 1);
        else if (e.key === "ArrowRight") show(current + 1);
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("gallery-item")) {
        e.preventDefault();
        e.target.click();
      }
    });
    // make dynamically added gallery items keyboard-focusable
    new MutationObserver(function () {
      document.querySelectorAll(".gallery-item:not([tabindex])").forEach(function (el) {
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
      });
    }).observe(document.body, { childList: true, subtree: true });

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });

    var startX = null;
    lightbox.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50 && items.length > 1) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
})();
