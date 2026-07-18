// ============================================================
// SnakeVerse — shared site script
// Handles: nav, review form, timeline reveal, game bg particles,
// generated snake portrait icons, species card grids, and the
// species detail modal used on home / families / endangered / pets.
// ============================================================

// ---------------------------------------------------------------
// Deterministic seeded random (same snake id -> same icon, always)
// ---------------------------------------------------------------
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------
// Generated snake portrait — a coiled body drawn from a seeded
// sine curve, decorated with a pattern matching the species data.
// Fully local, no image files, no network requests.
// ---------------------------------------------------------------
function snakeIconSVG(snake, opts) {
  opts = opts || {};
  const W = 200, H = 220;
  const rnd = mulberry32(hashStr(snake.id));
  const amp = 32 + rnd() * 20;
  const freq = 1.5 + rnd() * 1.0;
  const phase = rnd() * Math.PI * 2;
  const cx = W / 2;
  const yTop = 26, yBot = H - 22;

  const N = 70;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = yTop + t * (yBot - yTop);
    const x = cx + amp * Math.sin(freq * t * Math.PI * 2 + phase) * (0.55 + 0.45 * Math.sin(t * Math.PI));
    pts.push({ x, y, t });
  }

  function tangentAt(i) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  const bodyW = 24;
  const pathD = "M " + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");

  const primary = snake.palette.primary, secondary = snake.palette.secondary, belly = snake.palette.belly;

  // ---- belly shadow (offset duplicate, peeks out from under the body) ----
  let markup = `<path d="${pathD}" transform="translate(0,5)" fill="none" stroke="${belly}" stroke-width="${bodyW - 6}" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>`;

  // ---- main body ----
  markup += `<path d="${pathD}" fill="none" stroke="${primary}" stroke-width="${bodyW}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // ---- pattern overlay ----
  const pattern = snake.pattern || "plain";
  function sampleIdx(count, padStart, padEnd) {
    const arr = [];
    for (let k = 0; k < count; k++) {
      const t = padStart + (padEnd - padStart) * (k / (count - 1));
      arr.push(Math.round(t * N));
    }
    return arr;
  }

  if (pattern === "blotch" || pattern === "saddle") {
    const idxs = sampleIdx(9, 0.1, 0.92);
    idxs.forEach((i) => {
      const p = pts[i]; const ang = tangentAt(i);
      const rx = pattern === "saddle" ? bodyW * 0.62 : bodyW * 0.4;
      const ry = bodyW * 0.34;
      markup += `<ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${(ang * 180 / Math.PI).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})" fill="${secondary}" opacity="0.88"/>`;
    });
  } else if (pattern === "diamond") {
    const idxs = sampleIdx(10, 0.08, 0.94);
    idxs.forEach(i => {
      const p = pts[i]; const ang = tangentAt(i);
      const s = bodyW * 0.62;
      markup += `<rect x="${(p.x - s / 2).toFixed(1)}" y="${(p.y - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" transform="rotate(${45 + (ang * 180 / Math.PI)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})" fill="${secondary}" opacity="0.85"/>`;
    });
  } else if (pattern === "band") {
    const idxs = sampleIdx(8, 0.06, 0.95);
    idxs.forEach((i) => {
      const p = pts[i]; const ang = tangentAt(i);
      markup += `<rect x="${(p.x - bodyW / 2).toFixed(1)}" y="${(p.y - 5).toFixed(1)}" width="${bodyW.toFixed(1)}" height="10" transform="rotate(${(ang * 180 / Math.PI + 90).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})" fill="${secondary}" opacity="0.85"/>`;
    });
  } else if (pattern === "stripe") {
    function offsetPath(dist) {
      const op = pts.map((p, i) => {
        const ang = tangentAt(i) + Math.PI / 2;
        return { x: p.x + Math.cos(ang) * dist, y: p.y + Math.sin(ang) * dist };
      });
      return "M " + op.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
    }
    markup += `<path d="${offsetPath(bodyW * 0.27)}" fill="none" stroke="${secondary}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`;
    markup += `<path d="${offsetPath(-bodyW * 0.27)}" fill="none" stroke="${secondary}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`;
  } else if (pattern === "speckle") {
    const idxs = sampleIdx(22, 0.06, 0.95);
    idxs.forEach((i) => {
      const p = pts[i];
      const jitter = (rnd() - 0.5) * bodyW * 0.7;
      const ang = tangentAt(i) + Math.PI / 2;
      const jx = p.x + Math.cos(ang) * jitter, jy = p.y + Math.sin(ang) * jitter;
      const r = 2.5 + rnd() * 2.5;
      markup += `<circle cx="${jx.toFixed(1)}" cy="${jy.toFixed(1)}" r="${r.toFixed(1)}" fill="${secondary}" opacity="0.75"/>`;
    });
  }
  // "plain" => body color only, no overlay

  // ---- head ----
  const headP = pts[0];
  const headAng = tangentAt(0);
  const hx = headP.x - Math.cos(headAng) * 6, hy = headP.y - Math.sin(headAng) * 6;
  markup += `<ellipse cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" rx="17" ry="15" transform="rotate(${(headAng * 180 / Math.PI).toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)})" fill="${primary}"/>`;
  const eyeAng = headAng + Math.PI / 2;
  const ex = hx + Math.cos(eyeAng) * 7, ey = hy + Math.sin(eyeAng) * 7;
  const ex2 = hx - Math.cos(eyeAng) * 7, ey2 = hy - Math.sin(eyeAng) * 7;
  const fx = hx + Math.cos(headAng) * 5, fy = hy + Math.sin(headAng) * 5;
  markup += `<circle cx="${(ex * 0.35 + fx * 0.65).toFixed(1)}" cy="${(ey * 0.35 + fy * 0.65).toFixed(1)}" r="3.4" fill="#151912"/>`;
  markup += `<circle cx="${(ex2 * 0.35 + fx * 0.65).toFixed(1)}" cy="${(ey2 * 0.35 + fy * 0.65).toFixed(1)}" r="3.4" fill="#151912"/>`;
  if (snake.venomous) {
    const tx = hx + Math.cos(headAng) * 20, ty = hy + Math.sin(headAng) * 20;
    const flAng = headAng - 0.3, frAng = headAng + 0.3;
    const flx = tx + Math.cos(flAng) * 7, fly = ty + Math.sin(flAng) * 7;
    const frx = tx + Math.cos(frAng) * 7, fry = ty + Math.sin(frAng) * 7;
    markup += `<path d="M ${hx.toFixed(1)},${hy.toFixed(1)} L ${tx.toFixed(1)},${ty.toFixed(1)} L ${flx.toFixed(1)},${fly.toFixed(1)} M ${tx.toFixed(1)},${ty.toFixed(1)} L ${frx.toFixed(1)},${fry.toFixed(1)}" fill="none" stroke="#c93a3a" stroke-width="1.6" stroke-linecap="round"/>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="snake-icon-svg" role="img" aria-label="${snake.name} illustration">${markup}</svg>`;
}

// ---------------------------------------------------------------
// Card + grid builders (used by home / families / endangered / pets)
// ---------------------------------------------------------------
function conservationClass(code) {
  return { CR: "cr", EN: "en", VU: "vu", NT: "nt", LC: "lc" }[code] || "lc";
}

function snakePhotoHTML(snake, className) {
  return `<img src="images/${snake.id}.jpg" srcset="images/${snake.id}-sm.jpg 480w, images/${snake.id}.jpg 1024w" sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px" alt="${snake.name}" class="${className}" loading="lazy" decoding="async"
    onerror="this.outerHTML = snakeIconSVG(SNAKE_BY_ID['${snake.id}']);" />`;
}

function buildSnakeCard(snake) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "snake-card";
  card.setAttribute("data-id", snake.id);
  card.setAttribute("aria-haspopup", "dialog");

  const tagHTML = snake.isEndangered
    ? `<span class="status-tag ${conservationClass(snake.conservation)}">${CONSERVATION_LABEL[snake.conservation]}</span>`
    : `<span class="status-tag ${snake.venomous ? "venomous" : "safe"}">${snake.venomous ? "Venomous" : "Non-venomous"}</span>`;

  card.innerHTML = `
    <div class="snake-card-media">${snakePhotoHTML(snake, "snake-photo")}${tagHTML}</div>
    <div class="snake-card-body">
      <h3 class="snake-card-name">${snake.name}</h3>
      <div class="snake-card-latin">${snake.latin}</div>
      <p class="snake-card-desc">${snake.short}</p>
      <div class="snake-card-foot">
        <span class="fact-chip">${snake.length}</span>
        <span class="fact-chip">${snake.family}</span>
        <span class="snake-card-more">Details →</span>
      </div>
    </div>`;

  card.addEventListener("click", () => openSnakeModal(snake.id));
  return card;
}

function renderSnakeGrid(containerId, snakes) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
  if (!snakes.length) {
    el.innerHTML = `<p class="empty-note">No snakes match those filters — try clearing one.</p>`;
    return;
  }
  const frag = document.createDocumentFragment();
  snakes.forEach(s => frag.appendChild(buildSnakeCard(s)));
  el.appendChild(frag);
}

// ---------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------
let lastFocusedEl = null;

function buildModalMarkup(snake) {
  const tagHTML = `<span class="status-tag ${snake.venomous ? "venomous" : "safe"}">${snake.venomous ? "Venomous" : "Non-venomous"}</span>`;
  const consHTML = `<span class="status-tag ${conservationClass(snake.conservation)}">${CONSERVATION_LABEL[snake.conservation]}</span>`;

  let dietBlock = `
    <div class="modal-diet">
      <h4>Diet in the wild</h4>
      <p>${snake.diet}</p>
    </div>`;

  if (snake.isPet && snake.petDiet) {
    const d = snake.petDiet;
    dietBlock += `
      <div class="modal-diet modal-diet-plan">
        <h4>🍽 Pet care — feeding plan</h4>
        <div class="diet-plan-grid">
          <div><span class="diet-label">Staple food</span><span>${d.staple}</span></div>
          <div><span class="diet-label">Feeding schedule</span><span>${d.freq}</span></div>
          <div><span class="diet-label">Portion size</span><span>${d.size}</span></div>
        </div>
        <p class="diet-tip"><strong>Keeper tip:</strong> ${d.tip}</p>
      </div>`;
  }

  return `
    <div class="modal-bg" id="modalBg"></div>
    <div class="modal-bg-overlay"></div>
    <div class="modal-content">
      <div class="modal-tags">${tagHTML}${snake.isEndangered ? consHTML : ""}</div>
      <h2 class="modal-name">${snake.name}</h2>
      <div class="modal-latin">${snake.latin} &nbsp;·&nbsp; ${snake.familyLatin}</div>
      <p class="modal-long">${snake.long}</p>
      <div class="modal-meta-grid">
        <div><span class="meta-label">Family</span><span class="meta-value">${snake.family}</span></div>
        <div><span class="meta-label">Region</span><span class="meta-value">${snake.region}</span></div>
        <div><span class="meta-label">Length</span><span class="meta-value">${snake.length}</span></div>
        <div><span class="meta-label">Lifespan</span><span class="meta-value">${snake.lifespan}</span></div>
        <div><span class="meta-label">IUCN status</span><span class="meta-value">${CONSERVATION_LABEL[snake.conservation]}</span></div>
        <div><span class="meta-label">Venom</span><span class="meta-value">${snake.venomous ? "Venomous" : "Non-venomous"}</span></div>
      </div>
      ${dietBlock}
      <div class="modal-fact"><strong>Did you know?</strong> ${snake.fact}</div>
    </div>`;
}

function openSnakeModal(id) {
  const snake = SNAKE_BY_ID[id];
  if (!snake) return;
  const overlay = document.getElementById("snakeModalOverlay");
  const dialog = document.getElementById("snakeModalDialog");
  if (!overlay || !dialog) return;

  lastFocusedEl = document.activeElement;
  dialog.innerHTML = buildModalMarkup(snake);
  dialog.classList.remove("has-bg");
  overlay.classList.add("open");
  document.body.classList.add("modal-lock");
  const closeBtn = document.getElementById("snakeModalClose");
  if (closeBtn) closeBtn.focus();
  history.replaceState(null, "", "#" + id);

  // Load the snake's photo as a full-bleed modal background; if it fails
  // to load, quietly keep the existing solid/gradient fallback background.
  const bgEl = document.getElementById("modalBg");
  const imgUrl = `images/${snake.id}.jpg`;
  const bgLoader = new Image();
  bgLoader.onload = () => {
    if (!bgEl || document.getElementById("snakeModalDialog") !== dialog) return;
    bgEl.style.backgroundImage = `url('${imgUrl}')`;
    dialog.classList.add("has-bg");
  };
  bgLoader.onerror = () => {
    dialog.classList.remove("has-bg");
  };
  bgLoader.src = imgUrl;
}

function closeSnakeModal() {
  const overlay = document.getElementById("snakeModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.classList.remove("modal-lock");
  if (lastFocusedEl) lastFocusedEl.focus();
  history.replaceState(null, "", location.pathname);
}

function injectModalShell() {
  if (document.getElementById("snakeModalOverlay")) return;
  const div = document.createElement("div");
  div.className = "modal-overlay";
  div.id = "snakeModalOverlay";
  div.innerHTML = `
    <div class="modal-dialog" id="snakeModalDialog" role="dialog" aria-modal="true" tabindex="-1"></div>
    <button class="modal-close" id="snakeModalClose" aria-label="Close">✕</button>`;
  document.body.appendChild(div);

  div.addEventListener("click", (e) => { if (e.target === div) closeSnakeModal(); });
  document.getElementById("snakeModalClose").addEventListener("click", closeSnakeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && div.classList.contains("open")) closeSnakeModal();
  });
}

// ---------------------------------------------------------------
// Filter bar (families.html) — family chips + venom toggle + search
// ---------------------------------------------------------------
function initFilterBar(list) {
  const chipsWrap = document.getElementById("familyChips");
  const search = document.getElementById("snakeSearch");
  const venomToggle = document.getElementById("venomFilter");
  if (!chipsWrap) return;

  const families = ["All", ...Array.from(new Set(list.map(s => s.family)))];
  let activeFamily = "All";
  let activeVenom = "all";
  let query = "";

  chipsWrap.innerHTML = families.map((f, i) =>
    `<button type="button" class="filter-chip${i === 0 ? " active" : ""}" data-fam="${f}">${f}</button>`
  ).join("");

  function apply() {
    const filtered = list.filter(s => {
      const famOk = activeFamily === "All" || s.family === activeFamily;
      const venomOk = activeVenom === "all" || (activeVenom === "venomous" && s.venomous) || (activeVenom === "safe" && !s.venomous);
      const q = query.trim().toLowerCase();
      const searchOk = !q || s.name.toLowerCase().includes(q) || s.latin.toLowerCase().includes(q);
      return famOk && venomOk && searchOk;
    });
    renderSnakeGrid("snakeGrid", filtered);
    const countEl = document.getElementById("resultCount");
    if (countEl) countEl.textContent = `${filtered.length} of ${list.length} species`;
  }

  chipsWrap.querySelectorAll(".filter-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      chipsWrap.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFamily = btn.getAttribute("data-fam");
      apply();
    });
  });
  if (search) search.addEventListener("input", () => { query = search.value; apply(); });
  if (venomToggle) venomToggle.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      venomToggle.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeVenom = btn.getAttribute("data-venom");
      apply();
    });
  });

  apply();
}

// ---------------------------------------------------------------
// Page bootstrap
// ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  // ---------- Mobile nav toggle ----------
  const burger = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const closeNav = () => {
    burger.classList.remove("open");
    navLinks.classList.remove("open");
    burger.setAttribute('aria-expanded', 'false');
    navLinks.setAttribute('aria-hidden', 'true');
  };

  if (burger && navLinks) {
    burger.setAttribute('aria-expanded', 'false');
    navLinks.setAttribute('aria-hidden', 'true');

    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      const opened = burger.classList.toggle("open");
      navLinks.classList.toggle("open");
      burger.setAttribute('aria-expanded', opened ? 'true' : 'false');
      navLinks.setAttribute('aria-hidden', opened ? 'false' : 'true');
    });

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeNav);
    });

    // Close on outside click / tap
    document.addEventListener("click", (e) => {
      if (burger.classList.contains("open") && !navLinks.contains(e.target) && !burger.contains(e.target)) {
        closeNav();
      }
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.classList.contains("open")) {
        closeNav();
        burger.focus();
      }
    });

    // Reset state if the viewport crosses back to desktop while open
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) closeNav();
    });
  }

  // ---------- Active nav link ----------
  const current = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    const target = (href.split("#")[0] || "index.html").split("/").pop().replace(/\.html$/, "");
    if (target === current || (target === "index" && current === "")) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  // ---------- Header elevation on scroll ----------
  const header = document.querySelector(".top-header");
  if (header) {
    let ticking = false;
    const applyScrollState = () => {
      header.classList.toggle("scrolled", window.scrollY > 8);
      ticking = false;
    };
    applyScrollState();
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(applyScrollState);
        ticking = true;
      }
    }, { passive: true });
  }

  // ---------- Review form (footer, present on every page) ----------
  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = this.querySelector('[name="reviewName"]');
      const msg = this.querySelector('[name="reviewText"]');
      let valid = true;
      if (!name.value.trim()) { valid = false; name.classList.add("invalid"); }
      else name.classList.remove("invalid");
      if (!msg.value.trim()) { valid = false; msg.classList.add("invalid"); }
      else msg.classList.remove("invalid");
      if (!valid) return;
      document.getElementById("reviewMsg").textContent = "✅ Thank you for your review!";
      this.reset();
    });
  }

  // ---------- Timeline scroll reveal (history.html) ----------
  const tlItems = document.querySelectorAll(".tl-item");
  if (tlItems.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.2 });
    tlItems.forEach(item => io.observe(item));
  }

  // ---------- Decorative rising particles (game.html hero bg) ----------
  const bgAnim = document.getElementById("gameBgAnim");
  if (bgAnim) {
    const count = 26;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.style.left = (Math.random() * 100) + "%";
      s.style.height = (40 + Math.random() * 120) + "px";
      s.style.animationDuration = (6 + Math.random() * 10) + "s";
      s.style.animationDelay = (Math.random() * 10) + "s";
      bgAnim.appendChild(s);
    }
  }

  // ---------- Species grids (only run where SNAKES data + target grid exist) ----------
  if (typeof SNAKES !== "undefined") {
    injectModalShell();

    const homeGrid = document.getElementById("homeSnakeGrid");
    if (homeGrid) renderSnakeGrid("homeSnakeGrid", SNAKES.filter(s => s.homeFeatured));

    const petsGrid = document.getElementById("petsSnakeGrid");
    if (petsGrid) renderSnakeGrid("petsSnakeGrid", SNAKES.filter(s => s.isPet));

    const endangeredGrid = document.getElementById("endangeredSnakeGrid");
    if (endangeredGrid) renderSnakeGrid("endangeredSnakeGrid", SNAKES.filter(s => s.isEndangered));

    const familiesGrid = document.getElementById("snakeGrid");
    if (familiesGrid) initFilterBar(SNAKES);

    // deep-link support: /families.html#king-cobra opens straight to that snake
    if (location.hash) {
      const id = location.hash.slice(1);
      if (SNAKE_BY_ID[id]) setTimeout(() => openSnakeModal(id), 80);
    }
  }
});