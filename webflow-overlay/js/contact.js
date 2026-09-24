(function () {
  var hook = document.querySelector("[data-contact-fx]");
  var form = hook && hook.tagName === "FORM" ? hook : hook && hook.querySelector("form");
  if (!form) form = document.querySelector("form.contact-form, .w-form form, form");
  if (!form) return;

  function enhance(form) {
    form.classList.add("contact-form");
    var wrap = form.closest(".split-right-1, .w-form, .contact-card") || form.parentElement;
    if (wrap) {
      wrap.classList.add("contact-card");
      wrap.classList.add("contact-card-face");
      if (!wrap.querySelector(":scope > .contact-card-glow")) {
        var glow = document.createElement("div");
        glow.className = "contact-card-glow";
        glow.setAttribute("aria-hidden", "true");
        wrap.insertBefore(glow, wrap.firstChild);
      }
      if (!wrap.querySelector(".contact-progress")) {
        var progress = document.createElement("div");
        progress.className = "contact-progress";
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", "100");
        progress.setAttribute("aria-valuenow", "0");
        progress.innerHTML = '<span class="contact-progress-bar"></span>';
        wrap.insertBefore(progress, form);
      }
      if (!wrap.querySelector(".contact-burst")) {
        var burstLayer = document.createElement("div");
        burstLayer.className = "contact-burst";
        burstLayer.setAttribute("aria-hidden", "true");
        wrap.appendChild(burstLayer);
      }
    }

    var tick = '<span class="contact-tick" aria-hidden="true"><svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.4"/><path d="M6.5 11.5 9.5 14.5 15.5 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="contact-line" aria-hidden="true"></span>';
    Array.prototype.forEach.call(form.querySelectorAll("input, textarea, select"), function (input) {
      if (input.type === "submit" || input.type === "hidden" || input.type === "checkbox") return;
      var field = input.closest(".form-field, .contact-field, fieldset") || input.parentElement;
      if (!field || field === form) return;
      field.classList.add("contact-field");
      if (input.tagName === "TEXTAREA") input.classList.add("contact-area", "contact-input");
      else if (input.tagName !== "SELECT") input.classList.add("contact-input");
      if (input.tagName !== "SELECT" && !field.querySelector(".contact-tick")) {
        input.insertAdjacentHTML("afterend", tick);
      }
    });

    var submitBtn = form.querySelector('[type="submit"], .form-submit, .w-button');
    if (submitBtn) {
      submitBtn.classList.add("contact-submit", "form-submit");
      if (submitBtn.tagName !== "INPUT" && !submitBtn.querySelector(".contact-submit-text")) {
        var label = (submitBtn.textContent || "Start the conversation").trim();
        submitBtn.innerHTML =
          '<span class="contact-submit-text"></span><span class="contact-submit-wait"><span class="contact-drops" aria-hidden="true"><i></i><i></i><i></i></span> Sending</span>';
        submitBtn.querySelector(".contact-submit-text").textContent = label;
      }
    }

    var needSelect =
      form.querySelector("#contact-need, [name='Looking-For'], [data-name='Looking-For']") ||
      form.querySelector("select");
    if (needSelect && !form.querySelector(".contact-chips")) {
      var group = needSelect.closest("fieldset, .form-field, .contact-field") || needSelect.parentElement;
      var chips = document.createElement("div");
      chips.className = "contact-chips";
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-label", "Project type");
      chips.innerHTML = '<span class="contact-chip-pill" aria-hidden="true"></span>';
      Array.prototype.forEach.call(needSelect.options, function (opt) {
        if (!opt.value) return;
        var chip = document.createElement("button");
        chip.className = "contact-chip";
        chip.type = "button";
        chip.setAttribute("data-need", opt.value);
        chip.setAttribute("aria-pressed", "false");
        chip.textContent = opt.textContent;
        chips.appendChild(chip);
      });
      group.appendChild(chips);
      needSelect.classList.add("looking-for-select");
    }

    if (!form.querySelector(".contact-status")) {
      var status = document.createElement("p");
      status.className = "contact-status";
      status.innerHTML = '<span class="contact-status-dot" aria-hidden="true"></span><span class="contact-status-text">Awaiting your note.</span>';
      if (submitBtn) form.insertBefore(status, submitBtn);
      else form.appendChild(status);
    }
  }

  enhance(form);

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function pick(names) {
    for (var i = 0; i < names.length; i += 1) {
      var el = form.querySelector('[name="' + names[i] + '"]');
      if (el) return el;
    }
    return null;
  }

  var card = document.querySelector(".contact-card") || form.closest(".split-right-1, .w-form");
  var face = document.querySelector(".contact-card-face") || card;
  var bar = document.querySelector(".contact-progress");
  var chipsWrap = document.querySelector(".contact-chips");
  var pill = document.querySelector(".contact-chip-pill");
  var chips = document.querySelectorAll(".contact-chip");
  var need = document.getElementById("contact-need") || pick(["Looking-For", "need"]);
  var statusEl = document.querySelector(".contact-status");
  var statusText = document.querySelector(".contact-status-text");
  var submit = form.querySelector(".contact-submit, .form-submit, [type='submit']");
  var countEl = document.querySelector(".contact-count");
  var message = pick(["message", "Project-Overview"]);
  var fields = form.querySelectorAll(".contact-field, .form-field");

  function setProgress() {
    var name = pick(["name", "Full-Name"]);
    var email = pick(["email", "Email"]);
    var filled = 0;
    if (name && name.value.trim()) filled += 1;
    if (email && email.checkValidity() && email.value.trim()) filled += 1;
    if (need && need.value) filled += 1;
    if (message && message.value.trim().length > 8) filled += 1;
    var pct = Math.round((filled / 4) * 100);
    if (bar) {
      bar.style.setProperty("--progress", String(pct));
      bar.setAttribute("aria-valuenow", String(pct));
    }
    if (statusEl && statusText) {
      statusEl.classList.toggle("is-ready", pct === 100);
      statusText.textContent =
        pct === 100 ? "Looks sharp. Send it." : pct >= 50 ? "Coming together." : "Awaiting your note.";
    }
  }

  function markField(field, force) {
    var input = field.querySelector("input, textarea");
    if (!input) return;
    var filled = input.value.trim().length > 0;
    field.classList.toggle("is-filled", filled);
    var valid = input.checkValidity();
    if ((input.name === "url" || input.name === "Phone") && !filled) valid = true;
    if (input === message) valid = valid && input.value.trim().length > 8;
    field.classList.toggle("is-valid", Boolean(valid && filled));
    if (input === document.activeElement && !force) {
      field.classList.remove("is-invalid");
      return;
    }
    var invalid = !valid;
    if (!filled && !force) invalid = false;
    if ((input.name === "url" || input.name === "Phone") && !filled) invalid = false;
    field.classList.toggle("is-invalid", invalid);
  }

  fields.forEach(function (field) {
    var input = field.querySelector("input, textarea");
    if (!input) return;
    input.addEventListener("focus", function () {
      field.classList.add("is-focus");
      field.classList.remove("is-invalid");
    });
    input.addEventListener("blur", function () {
      field.classList.remove("is-focus");
      markField(field);
      setProgress();
    });
    input.addEventListener("input", function () {
      markField(field);
      setProgress();
      if (input === message && countEl) {
        countEl.textContent = String(message.value.length);
      }
    });
  });

  function armFields() {
    fields.forEach(function (field, i) {
      field.style.setProperty("--reveal-delay", i * 70 + "ms");
      field.classList.add("is-in");
    });
  }

  if (reduce || !card || !card.hasAttribute("data-reveal")) {
    armFields();
  } else {
    var tryArm = function () {
      if (card.classList.contains("is-in")) armFields();
    };
    tryArm();
    var fieldWatch = new MutationObserver(function () {
      tryArm();
      if (card.classList.contains("is-in")) fieldWatch.disconnect();
    });
    fieldWatch.observe(card, { attributes: true, attributeFilter: ["class"] });
    window.requestAnimationFrame(tryArm);
    window.setTimeout(armFields, 500);
  }

  function placePill(chip) {
    if (!pill || !chipsWrap || !chip) return;
    var wrap = chipsWrap.getBoundingClientRect();
    var r = chip.getBoundingClientRect();
    pill.style.width = r.width + "px";
    pill.style.height = r.height + "px";
    pill.style.transform =
      "translate(" + (r.left - wrap.left) + "px," + (r.top - wrap.top) + "px)";
    pill.classList.add("is-ready");
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (need) need.value = chip.getAttribute("data-need") || "";
      placePill(chip);
      if (chipsWrap) chipsWrap.classList.remove("is-nudge");
      setProgress();
    });
  });

  window.addEventListener("resize", function () {
    var on = document.querySelector(".contact-chip.is-on");
    if (on) placePill(on);
  });

  if (face && fine && !reduce) {
    face.addEventListener("pointermove", function (event) {
      var r = face.getBoundingClientRect();
      var px = (event.clientX - r.left) / r.width;
      var py = (event.clientY - r.top) / r.height;
      face.style.setProperty("--spot-x", px * 100 + "%");
      face.style.setProperty("--spot-y", py * 100 + "%");
      card.classList.add("is-hot");
      if (window.matchMedia("(min-width: 992px)").matches) {
        face.style.setProperty("--tilt-x", ((0.5 - py) * 3.5).toFixed(2) + "deg");
        face.style.setProperty("--tilt-y", ((px - 0.5) * 4.5).toFixed(2) + "deg");
      }
    });
    face.addEventListener("pointerleave", function () {
      card.classList.remove("is-hot");
      face.style.setProperty("--tilt-x", "0deg");
      face.style.setProperty("--tilt-y", "0deg");
    });
  }

  if (submit && fine && !reduce) {
    submit.addEventListener("pointermove", function (event) {
      if (submit.classList.contains("is-sending")) return;
      var r = submit.getBoundingClientRect();
      var x = event.clientX - r.left - r.width / 2;
      var y = event.clientY - r.top - r.height / 2;
      submit.style.setProperty("--mx", x * 0.22 + "px");
      submit.style.setProperty("--my", y * 0.28 + "px");
    });
    submit.addEventListener("pointerleave", function () {
      submit.style.setProperty("--mx", "0px");
      submit.style.setProperty("--my", "0px");
    });
    submit.addEventListener("pointerdown", function (event) {
      var r = submit.getBoundingClientRect();
      var ripple = document.createElement("span");
      ripple.className = "contact-ripple";
      var size = 18;
      ripple.style.width = size + "px";
      ripple.style.height = size + "px";
      ripple.style.left = event.clientX - r.left - size / 2 + "px";
      ripple.style.top = event.clientY - r.top - size / 2 + "px";
      submit.appendChild(ripple);
      window.setTimeout(function () {
        ripple.remove();
      }, 700);
    });
  }

  function burst() {
    if (reduce) return;
    var layer = document.querySelector(".contact-burst");
    if (!layer) return;
    var colours = ["#2563eb", "#93c5fd", "#f0ab9a", "#14b8a6", "#fde68a"];
    for (var i = 0; i < 28; i += 1) {
      var spark = document.createElement("span");
      spark.className = "contact-spark";
      var angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4;
      var dist = 90 + Math.random() * 140;
      spark.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      spark.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      spark.style.setProperty("--size", 6 + Math.random() * 8 + "px");
      spark.style.setProperty("--spark", colours[i % colours.length]);
      spark.style.animationDelay = Math.random() * 0.08 + "s";
      layer.appendChild(spark);
    }
    window.setTimeout(function () {
      layer.innerHTML = "";
    }, 1400);
  }

  function shake() {
    form.classList.remove("is-shaking");
    void form.offsetWidth;
    form.classList.add("is-shaking");
    window.setTimeout(function () {
      form.classList.remove("is-shaking");
    }, 500);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var ok = form.checkValidity();
    fields.forEach(function (field) { markField(field, true); });
    if (message && message.value.trim().length <= 8) ok = false;
    if (need && !need.value) {
      ok = false;
      if (chipsWrap) {
        chipsWrap.classList.remove("is-nudge");
        void chipsWrap.offsetWidth;
        chipsWrap.classList.add("is-nudge");
      }
    }
    if (!ok) {
      shake();
      if (need && !need.value && chips[0]) chips[0].focus();
      else {
        var firstBad = form.querySelector(".contact-field.is-invalid input, .contact-field.is-invalid textarea, .form-field.is-invalid input, .form-field.is-invalid textarea");
        if (firstBad) firstBad.focus();
      }
      return;
    }

    if (submit) {
      submit.classList.add("is-sending");
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
    }
    var wait = reduce ? 0 : 1100;
    window.setTimeout(function () {
      form.classList.add("is-leaving");
      form.setAttribute("aria-hidden", "true");
      window.setTimeout(function () {
        if (card) card.classList.add("is-success");
        var done = document.querySelector(".contact-done");
        if (done) {
          done.hidden = false;
          done.removeAttribute("hidden");
        }
        burst();
      }, reduce ? 0 : 280);
    }, wait);
  });

  document.querySelectorAll(".contact-stat[data-count], .stat-cell[data-count]").forEach(function (stat) {
    var target = Number(stat.getAttribute("data-count") || 0);
    var valueEl = stat.querySelector(".contact-stat-value, .stat-num");
    if (!valueEl) return;
    var prefix = stat.getAttribute("data-prefix") || "";
    var suffix = stat.getAttribute("data-suffix") || "";
    if (reduce) {
      valueEl.textContent = prefix + target + suffix;
      return;
    }
    var started = false;
    function run() {
      if (started) return;
      started = true;
      var start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / 900);
        var eased = 1 - Math.pow(1 - t, 3);
        valueEl.textContent = prefix + Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    var rect = stat.getBoundingClientRect();
    var onScreen = rect.top < window.innerHeight && rect.bottom > 0;
    if (onScreen) {
      run();
    } else if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run();
          io.disconnect();
        });
      }, { threshold: 0.4 });
      io.observe(stat);
    } else {
      run();
    }
  });

  setProgress();
})();
