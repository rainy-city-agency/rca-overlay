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

  (function paintOrganicGradients() {
    var SKIP = ".footer, .nav-fixed, .nav-bar, .w-nav, .button, .btn, .hero-gradient-bottom, .hero-gradient-top, .insights-fade, .insights-filter-fade, .mproc-tabs-fade, .staff-photo-grad, .grain-overlay, .rain-canvas, .contact-card-glow, .contact-progress, .hp-organic";
    var FALLBACK = [
      ".platforms-section",
      ".hero-section",
      ".ships-section",
      ".insights-hero",
      ".post-hero",
      ".contact-hero",
      ".cs-hero",
      ".cs-stats",
      ".cs-solution",
      ".about-hero",
      ".about-platinum",
      ".quarter-section",
      ".process-section-1",
      ".mproc-section",
      ".story-section",
      ".location-section",
      ".background-animation"
    ].join(", ");
    var DEFAULTS = ["#dbeafe", "#eff6ff", "#f5d6cf"];

    function skip(el) {
      return !el || el.nodeType !== 1 || el.matches(SKIP) || el.closest(SKIP);
    }

    function gradientImage(el) {
      if (!el) return "";
      var img = window.getComputedStyle(el).backgroundImage || "";
      return /gradient/i.test(img) && img !== "none" ? img : "";
    }

    function extractColors(image) {
      var found = image.match(/#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g) || [];
      var colors = [];
      found.forEach(function (color) {
        if (/rgba?\([^)]*,\s*0(?:\.0+)?\s*\)/.test(color)) return;
        if (/#(?:[0-9a-fA-F]{3,6})00\b/.test(color)) return;
        if (colors.indexOf(color) === -1) colors.push(color);
      });
      return colors;
    }

    function applyColors(layer, colors, index) {
      var c1 = colors[0] || DEFAULTS[0];
      var c2 = colors[1] || colors[0] || DEFAULTS[1];
      var c3 = colors[2] || colors[0] || DEFAULTS[2];
      layer.style.setProperty("--organic-c1", c1);
      layer.style.setProperty("--organic-c2", c2);
      layer.style.setProperty("--organic-c3", c3);
      layer.style.setProperty("--organic-d1", (index % 5) * -1.4 + "s");
      layer.style.setProperty("--organic-d2", ((index + 2) % 7) * -1.6 + "s");
      layer.style.setProperty("--organic-d3", ((index + 4) % 9) * -1.8 + "s");
    }

    function isVisibleBox(el) {
      if (!el) return false;
      var style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      var box = el.getBoundingClientRect();
      return box.width >= 180 && box.height >= 90;
    }

    function pickHost(root) {
      if (skip(root)) return null;
      if (root.matches("[class$='-bg']") && root.parentElement) {
        root = root.parentElement;
        if (skip(root)) return null;
      }
      if (root.querySelector(":scope > .hp-organic")) return root;

      var kids = root.querySelectorAll(":scope > [class$='-bg'], :scope > .process-panel, :scope > .mproc-panel, :scope > .quarter-bg");
      for (var i = 0; i < kids.length; i += 1) {
        if (!skip(kids[i]) && gradientImage(kids[i])) return root;
      }

      if (gradientImage(root) || root.matches(FALLBACK)) return root;

      var nested = root.querySelector(".process-panel, .mproc-panel, .quarter-bg, .story-bg, .location-bg, .stats-bg, .about-platinum-bg, .cs-hero-bg, .cs-stats-panel");
      if (nested && !skip(nested) && gradientImage(nested)) {
        return isVisibleBox(nested) ? nested : root;
      }

      return null;
    }

    function mount(host, colors, index) {
      if (!host) return;
      var existing = host.querySelector(":scope > .hp-organic");
      if (existing) {
        host.setAttribute("data-organic-host", "");
        applyColors(existing, colors, index);
        return;
      }
      if (!isVisibleBox(host) && !host.matches(FALLBACK) && !host.matches(".hero, .cs-hero, .insights-hero, .post-hero, .contact-hero")) return;

      var layer = document.createElement("div");
      layer.className = "hp-organic";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML =
        '<div class="hp-organic-blob hp-organic-blob-1"></div>' +
        '<div class="hp-organic-blob hp-organic-blob-2"></div>' +
        '<div class="hp-organic-blob hp-organic-blob-3"></div>';
      applyColors(layer, colors, index);
      host.setAttribute("data-organic-host", "");
      host.insertBefore(layer, host.firstChild);
    }

    var hosts = [];
    document.querySelectorAll("section, [class*='-section'], [class*='-hero'], .background-animation").forEach(function (root) {
      var host = pickHost(root);
      if (!host || hosts.indexOf(host) !== -1) return;
      hosts.push(host);
    });

    hosts.forEach(function (host, index) {
      var image = gradientImage(host);
      if (!image) {
        var bg = host.querySelector(":scope > [class$='-bg'], :scope > .quarter-bg, :scope > .process-panel, :scope > .mproc-panel");
        if (bg) image = gradientImage(bg);
      }
      if (!image && host.parentElement) image = gradientImage(host.parentElement);
      mount(host, extractColors(image), index);
    });

    document.querySelectorAll(".hp-organic").forEach(function (layer, index) {
      if (layer.style.getPropertyValue("--organic-c1")) return;
      var host = layer.parentElement;
      var source = host && (host.querySelector(":scope > [class$='-bg']") || host);
      applyColors(layer, extractColors(gradientImage(source) || gradientImage(host)), index);
    });
  })();

  function armReveal(el, delay) {
    if (delay) el.style.setProperty("--reveal-delay", delay);
    el.classList.add("is-in");
  }

  function skipReveal(el) {
    if (el.closest(".footer, .nav-fixed, .nav-bar, .w-nav, .splt-pane-hidden, .w-dyn-empty, .card-stack")) return true;
    if (el.closest(".post-article") && !el.matches(".post-article")) return true;
    return false;
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

  /* FADE-UP — comment back in to restore
  extraReveal.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (skipReveal(el) || el.hasAttribute("data-reveal")) return;
      el.setAttribute("data-reveal", "");
    });
  });
  */

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
    if (el.closest(".post-article, .faq-item, .platform-card, .yellow-card, .quarter-card, .inc-tag, .benefit-item, .work-card, .process-step, .form-field, .contact-field, .contact-need, label, .form-label, .button, .nav-link, .stat-cell, .story-stat, .hero-content, .hero-content-1, .contact-hero-content, .insights-hero-title-block, .inner-hero-copy")) {
      return true;
    }
    return false;
  }

  /* FADE-UP — comment back in to restore
  textReveal.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (skipTextReveal(el)) return;
      el.setAttribute("data-reveal", "copy");
    });
  });
  */

  function siblingRevealIndex(el) {
    var i = 0;
    var prev = el.previousElementSibling;
    while (prev) {
      if (prev.hasAttribute("data-reveal")) i += 1;
      prev = prev.previousElementSibling;
    }
    return i;
  }

  var revealIO = null;
  function observeReveal(el) {
    if (reduce || !("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          armReveal(entry.target);
          revealIO.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    }
    el.style.setProperty("--reveal-delay", (siblingRevealIndex(el) % 8) * 70 + "ms");
    revealIO.observe(el);
  }

  function tagArticleCopy() {
    document.querySelectorAll(".post-article").forEach(function (article) {
      if (article.hasAttribute("data-reveal")) return;
      article.setAttribute("data-reveal", "article");
      observeReveal(article);
    });
  }

  function revealAll(selector) {
    document.querySelectorAll(selector).forEach(observeReveal);
  }

  /* FADE-UP — comment back in to restore
  tagArticleCopy();
  revealAll("[data-reveal]");
  window.setTimeout(tagArticleCopy, 400);
  */

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

  /* TEXT MOTION BLUR — comment back in to restore
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
  */

  (function tickerStats() {
    function buildTicker(el) {
      var raw = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!raw || el.getAttribute("data-ticker") === "1") return false;
      el.setAttribute("data-ticker", "1");
      el.setAttribute("aria-label", raw);
      el.textContent = "";

      var wrap = document.createElement("span");
      wrap.className = "cs-ticker";
      wrap.setAttribute("aria-hidden", "true");

      raw.split("").forEach(function (ch) {
        if (/\d/.test(ch)) {
          var digit = document.createElement("span");
          digit.className = "cs-ticker-digit";
          var reel = document.createElement("span");
          reel.className = "cs-ticker-reel";
          reel.setAttribute("data-digit", ch);
          var html = "";
          var i;
          for (i = 0; i < 10; i += 1) html += "<span>" + i + "</span>";
          for (i = 0; i < 10; i += 1) html += "<span>" + i + "</span>";
          reel.innerHTML = html;
          digit.appendChild(reel);
          wrap.appendChild(digit);
          return;
        }
        var mark = document.createElement("span");
        mark.className = "cs-ticker-char";
        mark.textContent = ch;
        wrap.appendChild(mark);
      });

      el.appendChild(wrap);
      return true;
    }

    function spin(card) {
      if (!card || card.classList.contains("is-ticking")) return;
      card.classList.add("is-ticking");
      card.querySelectorAll(".cs-ticker-reel").forEach(function (reel, index) {
        var digit = parseInt(reel.getAttribute("data-digit"), 10);
        reel.style.transitionDelay = index * 70 + "ms";
        requestAnimationFrame(function () {
          reel.style.transform = "translateY(-" + (10 + digit) + "em)";
        });
      });
    }

    function enhance() {
      document.querySelectorAll(".cs-stats .cs-stat-value").forEach(buildTicker);
    }

    enhance();
    window.setTimeout(enhance, 400);

    var panels = document.querySelectorAll(".cs-stats");
    if (!panels.length) return;

    if (reduce || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".cs-stats .cs-stat-card").forEach(spin);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".cs-stat-card").forEach(function (card, index) {
          window.setTimeout(function () { spin(card); }, index * 90);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });

    panels.forEach(function (panel) { io.observe(panel); });
  })();
})();
