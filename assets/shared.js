/* 12the — shared scripts */

/* Scroll reveal */
(function () {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  const observe = () => document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
  if (document.readyState !== "loading") observe();
  else document.addEventListener("DOMContentLoaded", observe);
})();

/* Active nav link */
(function () {
  const run = () => {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
    });
  };
  if (document.readyState !== "loading") run();
  else document.addEventListener("DOMContentLoaded", run);
})();

/* Theme + page-visibility application (reads from sessionStorage + tweak defaults).
   This runs immediately on script load so that the events/lineup hide classes
   are set BEFORE the nav paints, preventing a flash of hidden links. */
(function () {
  // Apply page-visibility flags ASAP (before DOMContentLoaded)
  const applyVisibility = () => {
    let t = {};
    try {
      const saved = sessionStorage.getItem("12the-tweaks");
      if (saved) t = JSON.parse(saved);
    } catch {}
    // Defaults — events + lineup currently hidden
    const showEvents = t.showEvents === true;
    const showLineup = t.showLineup === true;
    if (document.body) {
      document.body.classList.toggle("hide-events", !showEvents);
      document.body.classList.toggle("hide-lineup", !showLineup);
    } else {
      // body not yet parsed — set on documentElement; copy to body when ready
      document.documentElement.classList.toggle("hide-events", !showEvents);
      document.documentElement.classList.toggle("hide-lineup", !showLineup);
      document.addEventListener("DOMContentLoaded", () => {
        document.body.classList.toggle("hide-events", !showEvents);
        document.body.classList.toggle("hide-lineup", !showLineup);
      });
    }
  };
  applyVisibility();

  const apply = () => {
    const saved = sessionStorage.getItem("12the-tweaks");
    if (!saved) return;
    try {
      const t = JSON.parse(saved);
      if (t.theme === "midnight") document.body.classList.add("theme-midnight");
      if (t.typography === "modern") document.body.classList.add("type-modern");
      if (t.typography === "elegant") document.body.classList.add("type-elegant");
      if (t.cards === "minimal") document.body.classList.add("cards-minimal");
      if (t.cards === "immersive") document.body.classList.add("cards-immersive");
    } catch {}
  };
  if (document.readyState !== "loading") apply();
  else document.addEventListener("DOMContentLoaded", apply);
})();

/* Tweaks panel — edit-mode protocol */
(function () {
  let panel, defaults;
  const init = () => {
    // Default tweaks (these are what Tweaks persists to disk)
    defaults = /*EDITMODE-BEGIN*/ {
      "theme": "beach",
      "typography": "magazine",
      "cards": "magazine",
      "showEvents": false,
      "showLineup": false
    } /*EDITMODE-END*/;

    const saved = sessionStorage.getItem("12the-tweaks");
    const current = saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults };

    // Build panel
    panel = document.createElement("div");
    panel.className = "tweaks-panel";
    panel.innerHTML = `
      <h4>Tweaks <button class="tweak-close">✕</button></h4>
      <div class="tweak-group">
        <label>色彩主題 / Theme</label>
        <div class="tweak-options" data-key="theme">
          <button class="tweak-opt" data-val="beach">南島亮色</button>
          <button class="tweak-opt" data-val="midnight">午夜藍</button>
        </div>
      </div>
      <div class="tweak-group">
        <label>字型 / Typography</label>
        <div class="tweak-options" data-key="typography">
          <button class="tweak-opt" data-val="magazine">日系雜誌</button>
          <button class="tweak-opt" data-val="modern">現代俐落</button>
          <button class="tweak-opt" data-val="elegant">精品雜誌</button>
        </div>
      </div>
      <div class="tweak-group">
        <label>卡片風格 / Cards</label>
        <div class="tweak-options" data-key="cards">
          <button class="tweak-opt" data-val="magazine">雜誌感</button>
          <button class="tweak-opt" data-val="minimal">極簡</button>
          <button class="tweak-opt" data-val="immersive">沉浸式</button>
        </div>
      </div>
      <div class="tweak-group">
        <label>分頁顯示 / Page visibility</label>
        <div class="tweak-options" data-key="showEvents">
          <button class="tweak-opt" data-val="true">顯示 活動 Events</button>
          <button class="tweak-opt" data-val="false">隱藏 活動 Events</button>
        </div>
        <div class="tweak-options" data-key="showLineup" style="margin-top: 8px;">
          <button class="tweak-opt" data-val="true">顯示 女神 Lineup</button>
          <button class="tweak-opt" data-val="false">隱藏 女神 Lineup</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Reflect current state
    const syncButtons = () => {
      panel.querySelectorAll(".tweak-options").forEach((g) => {
        const key = g.dataset.key;
        g.querySelectorAll(".tweak-opt").forEach((b) => {
          const v = (key === "showEvents" || key === "showLineup")
            ? (b.dataset.val === "true")
            : b.dataset.val;
          b.classList.toggle("active", v === current[key]);
        });
      });
    };
    syncButtons();

    panel.querySelectorAll(".tweak-opt").forEach((b) => {
      b.addEventListener("click", () => {
        const key = b.parentElement.dataset.key;
        let val = b.dataset.val;
        // Boolean keys: stored as real booleans
        if (key === "showEvents" || key === "showLineup") {
          val = val === "true";
        }
        current[key] = val;
        sessionStorage.setItem("12the-tweaks", JSON.stringify(current));
        syncButtons();
        applyLive(current);
        try {
          window.parent.postMessage(
            { type: "__edit_mode_set_keys", edits: current },
            "*"
          );
        } catch {}
      });
    });
    panel.querySelector(".tweak-close").addEventListener("click", () => {
      panel.classList.remove("open");
    });

    // Listen first, then announce
    window.addEventListener("message", (ev) => {
      const m = ev.data;
      if (!m || typeof m !== "object") return;
      if (m.type === "__activate_edit_mode") panel.classList.add("open");
      if (m.type === "__deactivate_edit_mode") panel.classList.remove("open");
    });
    try {
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    } catch {}
  };

  const applyLive = (t) => {
    document.body.classList.toggle("theme-midnight", t.theme === "midnight");
    document.body.classList.toggle("type-modern", t.typography === "modern");
    document.body.classList.toggle("type-elegant", t.typography === "elegant");
    document.body.classList.toggle("cards-minimal", t.cards === "minimal");
    document.body.classList.toggle("cards-immersive", t.cards === "immersive");
    document.body.classList.toggle("hide-events", t.showEvents === false);
    document.body.classList.toggle("hide-lineup", t.showLineup === false);
  };

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
