/* Contact page: wires the message form (opens the visitor's email app) once content loads */
(function () {
  "use strict";
  document.addEventListener("site:ready", function (ev) {
    var links = (ev.detail.profile || {}).links || {};
    var form = document.getElementById("contact-form");
    var fallback = document.getElementById("contact-fallback");
    var status = document.getElementById("form-status");
    if (!links.email || !form || !fallback) return;
    form.hidden = false;
    fallback.hidden = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var name = form.elements.name.value.trim();
      var from = form.elements.email.value.trim();
      var msg = form.elements.message.value.trim();
      var subject = "Message from " + name + " (portfolio)";
      var body = msg + "\n\n— " + name + "\n" + from;
      window.location.href = "mailto:" + links.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      if (status) status.textContent = "Your email app should open now. If it doesn't, write to " + links.email + ".";
    });
  });
})();
