/* Contact page: reveals the form/links that have details in js/config.js */
(function () {
  "use strict";
  var site = window.SITE || {};
  var form = document.getElementById("contact-form");
  var fallback = document.getElementById("contact-fallback");
  var status = document.getElementById("form-status");

  function show(id, href, label) {
    var el = document.getElementById(id);
    if (!el || !href) return;
    el.href = href;
    el.hidden = false;
    var val = el.querySelector(".contact-link-value");
    if (val) val.textContent = label;
  }

  function pretty(url) {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }

  if (site.email) {
    show("link-email", "mailto:" + site.email, site.email);
    if (form && fallback) {
      form.hidden = false;
      fallback.hidden = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        var name = form.elements.name.value.trim();
        var from = form.elements.email.value.trim();
        var msg = form.elements.message.value.trim();
        var subject = "Message from " + name + " (portfolio)";
        var body = msg + "\n\n— " + name + "\n" + from;
        window.location.href =
          "mailto:" + site.email +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);
        if (status) status.textContent = "Your email app should open now. If it doesn't, write to " + site.email + ".";
      });
    }
  }
  if (site.instagram) show("link-instagram", site.instagram, pretty(site.instagram));
  if (site.facebook) show("link-facebook", site.facebook, pretty(site.facebook));
  if (site.linkedin) show("link-linkedin", site.linkedin, pretty(site.linkedin));
})();
