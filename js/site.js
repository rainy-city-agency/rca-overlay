(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var header = document.querySelector(".nav-fixed");
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.querySelector(".nav-drawer");
  if (header && toggle && drawer) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      drawer.hidden = !open;
    });
    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        drawer.hidden = true;
      });
    });
  }

  document.querySelectorAll(".footer-acc-summary").forEach(function (summary) {
    summary.addEventListener("click", function () {
      if (window.matchMedia("(min-width: 992px)").matches) return;
      var item = summary.closest(".footer-acc");
      var open = item.classList.contains("is-open");
      var group = summary.closest(".footer-nav") || summary.closest(".footer-top") || summary.closest(".footer");
      if (!group) return;
      group.querySelectorAll(".footer-acc").forEach(function (acc) {
        acc.classList.remove("is-open");
      });
      if (!open) item.classList.add("is-open");
    });
  });

  function armReveal(el, delay) {
    if (delay) el.style.setProperty("--reveal-delay", delay);
    el.classList.add("is-in");
  }

  function skipReveal(el) {
    return !!(el.closest(".footer, .nav-fixed, .nav-bar, .w-nav, .splt-pane-hidden, .w-dyn-empty, .card-stack"));
  }

  var extraReveal = [
    ".hero-content",
    ".hero-content-1",
    ".contact-hero-content",
    ".quarter-header",
    ".quarter-card",
    ".process-heading",
    ".process-intro",
    ".process-steps .process-step",
    ".why-wrap > .h2",
    ".why-wrap > .p",
    ".includes-wrap > .h2",
    ".includes-wrap > .p",
    ".includes-col",
    ".inc-tag",
    ".faq-wrap > .h2",
    ".faq-wrap > .p",
    ".platforms-wrap > .h2",
    ".platforms-wrap > .p",
    ".trust-wrap",
    ".trust-logo",
    ".cta-wrap",
    ".benefit-item",
    ".hero .image-7",
    ".hero-visual-1",
    ".splt-header",
    ".splt-card",
    ".build-header",
    ".process-header",
    ".about-accred-head",
    ".about-platinum-head",
    ".team-header",
    ".location-card",
    ".story-stat",
    ".mcta-card",
    ".rail-card",
    ".case-study-card",
    ".collection-item-5",
    ".collection-item-7",
    ".collection-item-2",
    ".insights-hero-title-block",
    ".insights-filter-wrap",
    ".yellow-card",
    ".white-card",
    ".platform-card",
    ".faq-item",
    ".case-section",
    ".case-callout",
    ".work-card"
  ];

  extraReveal.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (skipReveal(el) || el.hasAttribute("data-reveal")) return;
      el.setAttribute("data-reveal", "");
    });
  });

  var textReveal = [
    "h1",
    "h2",
    "h3",
    ".heading-1",
    ".heading-2",
    ".heading-3",
    ".h2",
    ".h3",
    ".h4",
    ".p",
    ".p-center",
    ".paragraph-3",
    ".paragraph-medium",
    ".paragraph-large",
    ".paragraph-center",
    ".paragraph-10",
    ".paragraph-11",
    ".paragraph-12",
    ".paragraph-13",
    ".paragraph-14",
    ".paragraph-15",
    ".paragraph-16",
    ".paragraph-17",
    ".hero-sub",
    ".hero-sub-1",
    ".hero-proof",
    ".hero-proof-1",
    ".process-intro",
    ".process-intro-1",
    ".quarter-sub",
    ".cta-heading",
    ".cta-body",
    ".case-study-title",
    ".case-eyebrow",
    ".testimonial-quote",
    ".contact-hero-title",
    ".insights-hero-title",
    ".insights-hero-intro",
    ".inner-title",
    ".inner-lede",
    ".inner-kicker",
    ".faq-q-text"
  ];

  function skipTextReveal(el) {
    if (skipReveal(el) || el.hasAttribute("data-reveal")) return true;
    if (el.closest(".faq-item, .platform-card, .yellow-card, .quarter-card, .inc-tag, .benefit-item, .work-card, .process-step, .form-field, .contact-field, .contact-need, label, .form-label, .button, .nav-link, .stat-cell, .story-stat, .hero-content, .hero-content-1, .contact-hero-content, .insights-hero-title-block, .inner-hero-copy")) {
      return true;
    }
    return false;
  }

  textReveal.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (skipTextReveal(el)) return;
      el.setAttribute("data-reveal", "copy");
    });
  });

  function siblingRevealIndex(el) {
    var i = 0;
    var prev = el.previousElementSibling;
    while (prev) {
      if (prev.hasAttribute("data-reveal")) i += 1;
      prev = prev.previousElementSibling;
    }
    return i;
  }

  function revealAll(selector) {
    var nodes = document.querySelectorAll(selector);
    if (reduce) {
      nodes.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        armReveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (el) {
      el.style.setProperty("--reveal-delay", (siblingRevealIndex(el) % 8) * 70 + "ms");
      io.observe(el);
    });
  }

  revealAll("[data-reveal]");

  var chips = document.querySelectorAll(".insights-chip");
  var featured = document.querySelector(".insights-featured");
  var cards = document.querySelectorAll(".insights-grid .work-card");
  var page = document.querySelector(".page-insights");

  function applyFilter(filter) {
    var visible = 0;
    function show(el, index) {
      var on = filter === "all" || el.getAttribute("data-category") === filter;
      el.classList.toggle("is-hidden", !on);
      if (on) {
        visible += 1;
        el.classList.remove("is-in");
        void el.offsetWidth;
        armReveal(el, index * 70 + "ms");
      }
    }
    if (featured) show(featured, 0);
    cards.forEach(function (card, i) { show(card, i + 1); });
    if (page) page.classList.toggle("is-empty", visible === 0);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var filter = chip.getAttribute("data-filter") || "all";
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      applyFilter(filter);
    });
  });

  var form = document.querySelector(".contact-form");
  if (form && !form.hasAttribute("data-contact-fx")) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      form.hidden = true;
      var done = document.querySelector(".contact-done");
      if (done) done.hidden = false;
    });
  }

  var splt = document.querySelector(".splt-section");
  if (splt) {
    var wrap = splt.querySelector(".splt-tabs");
    var pillTab = splt.querySelector(".splt-tab-pill");
    if (wrap && !pillTab) {
      pillTab = document.createElement("div");
      pillTab.className = "splt-tab-pill";
      wrap.insertBefore(pillTab, wrap.firstChild);
    }
    var tabs = Array.prototype.slice.call(splt.querySelectorAll(".splt-tab"));
    var panes = splt.querySelectorAll(".splt-pane");
    if (panes[0]) panes[0].classList.add("is-active");
    var select = splt.querySelector(".splt-select");
    var card = splt.querySelector(".splt-card");
    var current = 0;
    var switchTimer;

    function layoutPill(instant) {
      if (!wrap || !pillTab || !tabs.length) return;
      if (window.getComputedStyle(wrap).display === "none") return;
      var active = tabs[current] || tabs[0];
      var wr = wrap.getBoundingClientRect();
      var tr = active.getBoundingClientRect();
      if (instant) pillTab.classList.add("is-instant");
      pillTab.style.width = tr.width + "px";
      pillTab.style.height = tr.height + "px";
      pillTab.style.transform = "translate(" + (tr.left - wr.left + wrap.scrollLeft) + "px," + (tr.top - wr.top + wrap.scrollTop) + "px)";
      pillTab.classList.add("is-ready");
      wrap.classList.add("is-armed");
      if (instant) {
        pillTab.offsetHeight;
        requestAnimationFrame(function () { pillTab.classList.remove("is-instant"); });
      }
    }

    function ripple(tab, event) {
      if (reduce) return;
      var drop = document.createElement("span");
      drop.className = "splt-tab-ripple";
      var rect = tab.getBoundingClientRect();
      var x = event && event.clientX ? event.clientX - rect.left : rect.width / 2;
      var y = event && event.clientY ? event.clientY - rect.top : rect.height / 2;
      drop.style.left = x + "px";
      drop.style.top = y + "px";
      tab.appendChild(drop);
      drop.addEventListener("animationend", function () { drop.remove(); });
    }

    function show(i, event) {
      if (i === current && event && event.type === "click") {
        ripple(tabs[i], event);
        return;
      }
      current = i;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panes.forEach(function (p, j) {
        var on = j === i;
        p.classList.toggle("is-active", on);
        p.classList.toggle("splt-pane-hidden", !on);
        p.setAttribute("aria-hidden", on ? "false" : "true");
      });
      if (select) select.selectedIndex = i;
      layoutPill(false);
      if (event && event.type === "click") ripple(tabs[i], event);
      if (card) {
        card.classList.remove("is-switching");
        void card.offsetWidth;
        card.classList.add("is-switching");
        clearTimeout(switchTimer);
        switchTimer = setTimeout(function () { card.classList.remove("is-switching"); }, 700);
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function (event) { show(i, event); });
    });
    if (select) select.addEventListener("change", function () { show(select.selectedIndex); });
    layoutPill(true);
    window.addEventListener("resize", function () { layoutPill(true); });
  }

  var statements = document.querySelectorAll(".hp-statement-item");
  if (statements.length > 1 && !reduce) {
    var index = 1;
    function paint(i) {
      statements.forEach(function (el, j) {
        el.classList.toggle("is-active", j === i);
      });
    }
    paint(index);
    setInterval(function () {
      index = (index + 1) % statements.length;
      paint(index);
    }, 7000);
  }

  function countUp(el) {
    var raw = (el.textContent || "").trim();
    var match = raw.match(/^([^\d]*)(\d+)(.*)$/);
    if (!match) return;
    var prefix = match[1];
    var end = parseInt(match[2], 10);
    var suffix = match[3];
    if (!end) return;
    var start = performance.now();
    var duration = 900;
    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(end * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll(".story-stat[data-reveal] .story-stat-num").forEach(function (num) {
    var card = num.closest("[data-reveal]");
    if (!card) return;
    if (card.classList.contains("is-in")) {
      if (!reduce) countUp(num);
      return;
    }
    var watch = new MutationObserver(function () {
      if (!card.classList.contains("is-in")) return;
      watch.disconnect();
      if (!reduce) countUp(num);
    });
    watch.observe(card, { attributes: true, attributeFilter: ["class"] });
  });

  function splitHeroBlurTitle(title) {
    if (title.getAttribute("data-hero-blur") === "1") return;
    title.setAttribute("data-hero-blur", "1");
    title.classList.add("hero-blur-title");
    var walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var index = 0;
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      if (!text || !text.trim()) return;
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) {
          frag.appendChild(document.createTextNode(chunk));
          return;
        }
        var outer = document.createElement("span");
        outer.className = "hero-blur-word";
        outer.style.setProperty("--blur-i", String(index));
        index += 1;
        var inner = document.createElement("span");
        inner.className = "hero-blur-word-inner";
        inner.textContent = chunk;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  document.querySelectorAll(
    ".hero-content[data-reveal], .hero-content-1[data-reveal], .contact-hero-content[data-reveal], .insights-hero-title-block[data-reveal], .inner-hero-copy"
  ).forEach(function (el) {
    el.classList.add("is-in");
  });

  if (!reduce) {
    document.querySelectorAll(
      ".hero .heading-1, .hero-h1-1, .contact-hero-title, .insights-hero-title, .inner-title"
    ).forEach(splitHeroBlurTitle);
  }
})();
