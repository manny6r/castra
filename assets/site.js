/* Castra website: the desk scene, the app up close and the tour video. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const root = document.documentElement;

  /* the desk takes what the title leaves of the first screen; widths without the scrollbar */
  const title = $(".title");
  const measure = () => {
    root.style.setProperty("--sbw", innerWidth - root.clientWidth + "px");
    if (title) root.style.setProperty("--title-h", title.offsetHeight + "px");
  };
  measure();
  addEventListener("resize", measure);
  if (title) new ResizeObserver(measure).observe(title);

  /* the tour: "Watch the tour" opens it over the page (without <dialog> the link opens the video file) */
  const tour = $("#tour");
  if (tour && typeof tour.showModal === "function") {
    const v = $("video", tour);
    $$("a.watch").forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      if (!v.poster) v.poster = v.dataset.poster;   // fetched only by those who open the tour
      tour.showModal();
      v.play().catch(() => {});
    }));
    $(".x", tour).addEventListener("click", () => tour.close());
    tour.addEventListener("click", e => { if (e.target === tour) tour.close(); });   // a click on the dark backdrop
    tour.addEventListener("close", () => v.pause());                              // Esc, the button or the backdrop
  }

  $$(".year").forEach(e => { e.textContent = new Date().getFullYear(); });

  /* the app up close: point at a part (or a line in the legend) and it is lit and named, as in the manual.
     Nothing is lit until you point: the whole window stays visible when you arrive */
  const shot = $("#appShot"), focus = $("#appFocus"), ftag = $("#appTag"), legend = $("#appLegend");
  const SPOT = { profiles: { l: 16.77, t: 2.69, w: 21.61, h: 4.87 }, map: { l: 1.2, t: 10.8, w: 45.8, h: 75.7 },
                 list: { l: 48.1, t: 10.8, w: 50.75, h: 75.7 }, back: { l: 48.1, t: 90.3, w: 20.8, h: 5.7 },
                 "launch-all": { l: 82.66, t: 90, w: 14.92, h: 6.41 } };       // % of the screenshot, as measured on it
  if (shot && legend) {
    const items = $$("button", legend);
    const SPOTS = items.map(b => [b.dataset.spot, $("b", b).textContent]);
    let cur = -1, parked = true;                               // a pointer that hasn't moved since the last scroll doesn't count
    addEventListener("scroll", () => { parked = true; }, { passive: true });
    const hover = (el, i) => el.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;                   // touch: a tap toggles (click below)
      if (e.movementX || e.movementY) parked = false;
      if (!parked && cur !== i) show(i);
    });
    if (matchMedia("(hover: none)").matches) { const h = $(".app-close .hint"); if (h) h.textContent = "Tap any part of the window to see what it is."; }
    const PAD = 0.9;                                           // % around the control
    const area = k => { const r = SPOT[k]; return { l: r.l - PAD, t: r.t - PAD * 1.6, w: r.w + PAD * 2, h: r.h + PAD * 3.2 }; };
    // zones over the real controls: bigger areas first, so smaller ones inside them stay on top
    SPOTS.map((x, i) => [x, i]).sort(([[a]], [[b]]) => SPOT[b].w * SPOT[b].h - SPOT[a].w * SPOT[a].h).forEach(([[k, t], i]) => {
      const z = document.createElement("button"), r = area(k);
      z.type = "button"; z.className = "zone"; z.tabIndex = -1; z.setAttribute("aria-label", t);
      Object.assign(z.style, { left: r.l + "%", top: r.t + "%", width: r.w + "%", height: r.h + "%" });
      hover(z, i);
      z.onclick = () => toggle(i);
      shot.appendChild(z);
    });
    items.forEach((b, i) => {                                 // keyboard focus lights it; a tap or click toggles it
      hover(b, i);
      b.onfocus = () => { if (b.matches(":focus-visible")) show(i); };
      b.onclick = () => toggle(i);
      b.onblur = hide;
    });
    function show(i) {
      cur = i;
      const r = area(SPOTS[i][0]), first = !focus.classList.contains("on");
      if (first) { focus.classList.add("jump"); ftag.classList.add("jump"); }     // appear in place, then glide between parts
      Object.assign(focus.style, { left: r.l + "%", top: r.t + "%", width: r.w + "%", height: r.h + "%" });
      $("b", ftag).textContent = i + 1;
      $("span", ftag).textContent = SPOTS[i][1];
      // the label: inside a tall region's lower corner; otherwise above the highlight, else below, else beside it
      const W = shot.clientWidth, Hh = shot.clientHeight, tw = ftag.offsetWidth, th = ftag.offsetHeight, gap = 8, m = 6;
      const x = r.l / 100 * W, y = r.t / 100 * Hh, right = (r.l + r.w) / 100 * W, bottom = (r.t + r.h) / 100 * Hh;
      const clampX = v => Math.max(m, Math.min(v, W - tw - m)), clampY = v => Math.max(m, Math.min(v, Hh - th - m));
      let left, top;
      if (r.h > 30) { left = r.l + r.w / 2 < 50 ? x + 10 : right - tw - 10; top = bottom - th - 10; }
      else if (y - th - gap >= m) { left = clampX(x); top = y - th - gap; }
      else if (bottom + gap + th <= Hh - m) { left = clampX(x); top = bottom + gap; }
      else if (x - gap - tw >= m) { left = x - gap - tw; top = clampY(y); }
      else if (right + gap + tw <= W - m) { left = right + gap; top = clampY(y); }
      else { left = clampX(x + gap); top = clampY(y + gap); }
      ftag.style.left = left + "px"; ftag.style.top = top + "px";
      if (first) { void focus.offsetWidth; focus.classList.remove("jump"); ftag.classList.remove("jump"); }
      focus.classList.add("on"); ftag.classList.add("on");
      items.forEach((d, k) => d.classList.toggle("on", k === i));
    }
    function hide() { cur = -1; focus.classList.remove("on"); ftag.classList.remove("on"); items.forEach(x => x.classList.remove("on")); }
    function toggle(i) { if (cur === i && focus.classList.contains("on") && !matchMedia("(hover: hover)").matches) hide(); else show(i); }   // a second tap puts it out
    [shot, legend].forEach(el => el.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hide(); }));
    addEventListener("resize", () => { if (cur >= 0 && focus.classList.contains("on")) show(cur); });
  }

  const rig = $("#rig");
  if (rig) desk(rig);

  /* ── the desk: Castra on 01 presses LAUNCH ALL; five windows land one by one,
        each display wakes and lights its patch of desk ─────────────────────── */
  function desk(rig) {
    const W = 160, H = 66, DESK = 47, FLOOR = 48.6;              // rig units (aspect 160/66); the desk meets the wall at 47
    const MONS = [{ id: "02", x: 20, y: 18.5, w: 40, h: 22.5, c: "#5b9dff" },
                  { id: "01", x: 63, y: 10.6, w: 54, h: 30.4, c: "#a78bfa" },
                  { id: "03", x: 121, y: 7.2, w: 19, h: 33.8, c: "#4ade80", chipRight: true }];
    const WINS = [{ mon: "01", r: [0, 0, .664, 1], kind: "obs", t: "OBS Studio", tag: { x: 80.9, y: 5.4 } },
                  { mon: "01", r: [.664, 0, .336, 1], kind: "chat", t: "Stream chat", tag: { x: 107.9, y: 5.4 } },
                  { mon: "02", r: [0, 0, 1, 1], kind: "stats", t: "Stats dashboard", tag: { x: 40, y: 13.2 } },
                  { mon: "03", r: [0, 0, 1, .5], kind: "yt", t: "YouTube live", tag: { x: 142.6, y: 15.6, side: true } },
                  { mon: "03", r: [0, .5, 1, .5], kind: "disc", t: "Discord", tag: { x: 142.6, y: 32.5, side: true } }];
    const px = (v, of) => v / of * 100 + "%";
    const add = (cls, css = {}, parent = rig, tag = "div") => {
      const e = document.createElement(tag);
      e.className = cls;
      for (const [k, v] of Object.entries(css)) k.startsWith("--") ? e.style.setProperty(k, v) : (e.style[k] = v);
      if (!["mon", "scr", "app"].includes(cls)) e.setAttribute("aria-hidden", "true");   // decoration; the app holds a real button
      parent.appendChild(e);
      return e;
    };

    // the keyboard's keys
    const keys = $(".kbd .keys", rig);
    if (keys) {
      let k = "";
      for (let r = 0; r < 4; r++) for (let i = 0; i < 14; i++) k += `<rect x="${12 + r * 3 + i * 26.6}" y="${12 + r * 21}" width="23" height="17" rx="3"/>`;
      [[12, 30], [46, 30], [80, 30], [114, 172], [290, 30], [324, 30], [358, 30]].forEach(([x, w]) => { k += `<rect x="${x}" y="96" width="${w}" height="17" rx="3"/>`; });
      keys.innerHTML = k;
    }

    // the displays, their stands, the light they cast
    const mons = {};
    MONS.forEach(m => {
      const cx = m.x + m.w / 2, bottom = m.y + m.h;
      const wash = add("wash", { left: px(cx - m.w * .85, W), top: px(m.y + m.h / 2 - m.h * .95, H), width: px(m.w * 1.7, W), height: px(m.h * 1.9, H), "--c": m.c });
      const pool = add("pool", { left: px(cx - m.w * .8, W), top: px(DESK, H), width: px(m.w * 1.6, W), height: px(14, H), "--c": m.c });
      add("neck", { left: px(cx, W), top: px(bottom - .4, H), height: px(FLOOR - bottom + .4, H) });
      add("base", { left: px(cx, W), top: px(FLOOR - .5, H), width: px(Math.max(9, m.w * .3), W) });
      const mon = add("mon", { left: px(m.x, W), top: px(m.y, H), width: px(m.w, W), height: px(m.h, H), "--c": m.c });
      const scr = add("scr", {}, mon);
      const chip = add("chip", { left: px(m.chipRight ? cx + 2.2 : m.x + .3, W), top: px(bottom + 1.3, H), "--c": m.c });
      chip.innerHTML = `<b>${m.id}</b>`;
      mons[m.id] = { mon, scr, wash, pool };
    });

    // Castra itself on 01: the real app; the pointer presses its LAUNCH ALL
    const app = add("app", {}, mons["01"].scr);
    app.innerHTML = `<img src="assets/castra-app.webp" width="2480" height="1560" alt="" decoding="async"><span class="hit" aria-hidden="true"></span>`;
    const hit = $(".hit", app);

    // the windows, each in its fixed slot, with a numbered tag on the wall
    const wins = WINS.map((w, i) => {
      const m = mons[w.mon], [l, t, ww, hh] = w.r;
      const el = add("win", { left: `calc(${l * 100}% + 2px)`, top: `calc(${t * 100}% + 2px)`, width: `calc(${ww * 100}% - 4px)`, height: `calc(${hh * 100}% - 4px)`, "--c": MONS.find(x => x.id === w.mon).c }, m.scr);
      el.innerHTML = `<div class="tb"><i></i><span>${w.t}</span><svg viewBox="0 0 36 9"><path d="M2 4.5h6M15 1.5h6v6h-6zM28 1.5l6 6M34 1.5l-6 6"/></svg></div><div class="bd">${mock(w.kind)}</div>`;
      const c = MONS.find(x => x.id === w.mon).c;
      const tag = add("tag", { left: px(w.tag.x, W), top: px(w.tag.y, H), "--c": c, transform: w.tag.side ? "translateY(-50%)" : "translate(-50%,-50%)" });
      tag.innerHTML = `<b>${i + 1}</b><span>${w.t}</span>`;
      const mon = MONS.find(x => x.id === w.mon);
      const line = w.tag.side
        ? add("lead-line", { left: px(mon.x + mon.w, W), top: px(w.tag.y, H), width: px(w.tag.x - mon.x - mon.w, W), height: "1px" })
        : add("lead-line", { left: px(w.tag.x, W), top: px(w.tag.y + 1.4, H), width: "1px", height: px(mon.y - w.tag.y - 1.2, H) });
      return { el, tag, line, m };
    });

    const cur = $("#cur");
    const unit = () => rig.style.setProperty("--u", rig.clientWidth / W + "px");
    unit(); new ResizeObserver(unit).observe(rig);
    const light = (m, on) => { m.mon.classList.toggle("on", on); m.wash.classList.toggle("lit", on); m.pool.classList.toggle("lit", on); };
    const label = (w, on) => { w.tag.classList.toggle("show", on); w.line.classList.toggle("show", on); };
    light(mons["01"], true);                                     // only Castra's display is on before the launch

    if (still) {                                                 // reduced motion: the setup, already in place
      wins.forEach(w => { w.el.classList.add("on"); label(w, true); light(w.m, true); });
      return;
    }

    // runs only while the desk is on screen and the tab is visible
    let visible = false, waiting = [], started = false;
    const wake = () => { if (visible && !document.hidden) { waiting.forEach(f => f()); waiting = []; } };
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting; wake();
      if (visible && !started) { started = true; setTimeout(loop, 900); }
    }, { threshold: .3 }).observe(rig);
    document.addEventListener("visibilitychange", wake);
    const whenVisible = () => (visible && !document.hidden ? Promise.resolve() : new Promise(r => waiting.push(r)));

    const at = el => {
      const s = rig.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, w: r.width, h: r.height };
    };
    const out = "cubic-bezier(.16,1,.3,1)";

    function press(p) {
      hit.classList.remove("pressed"); void hit.offsetWidth; hit.classList.add("pressed");
      const r = document.createElement("i"); r.className = "rip"; r.setAttribute("aria-hidden", "true");
      r.style.left = p.x + "px"; r.style.top = p.y + "px";
      rig.appendChild(r); setTimeout(() => r.remove(), 800);
    }
    function land(w, from) {
      w.el.getAnimations().forEach(a => a.cancel());
      const to = at(w.el);
      w.el.classList.add("on", "fresh");
      w.el.animate([
        { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(.06)`, opacity: 0 },
        { opacity: 1, offset: .25 },
        { transform: "none", opacity: 1 }], { duration: 760, easing: out });
      setTimeout(() => {                                         // landed: its display wakes, its tag appears
        if (!w.m.mon.classList.contains("on") || !w.m.wash.classList.contains("lit")) light(w.m, true);
        label(w, true);
      }, 560);
      setTimeout(() => w.el.classList.remove("fresh"), 900);     // the newest window is the brightest, then settles
    }
    async function clear() {
      for (let i = wins.length - 1; i >= 0; i--) {
        wins[i].el.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.97)" }], { duration: 260, easing: "ease-in", fill: "forwards" });
        label(wins[i], false);
        await sleep(70);
      }
      await sleep(260);
      wins.forEach(w => { w.el.classList.remove("on"); w.el.getAnimations().forEach(a => a.cancel()); });
      light(mons["02"], false); light(mons["03"], false);
      await sleep(650);
    }
    async function run() {
      if (wins.some(w => w.el.classList.contains("on"))) await clear();
      await whenVisible();
      const b = at(hit);
      const d3 = at(mons["03"].mon);                            // the pointer comes from display 03
      const p0 = { x: d3.x, y: d3.y + d3.h * .25 }, p1 = { x: b.x + b.w * .3, y: b.y + b.h * .35 };
      cur.animate([{ opacity: 0, transform: `translate(${p0.x}px, ${p0.y}px)` }, { opacity: 1, offset: .2 },   // the pointer comes in
                   { opacity: 1, transform: `translate(${p1.x}px, ${p1.y}px)` }], { duration: 1100, easing: out, fill: "forwards" });
      await sleep(1150);
      press(p1);                                                 // and presses LAUNCH ALL
      await sleep(240);
      for (const w of wins) {                                    // one by one, each to its place
        await whenVisible();
        land(w, b);
        await sleep(520);
      }
      await sleep(600);
      cur.animate([{ opacity: 1, transform: `translate(${p1.x}px, ${p1.y}px)` },
                   { opacity: 0, transform: `translate(${p1.x + 40}px, ${p1.y + 60}px)` }], { duration: 600, easing: "ease-in", fill: "forwards" });
    }
    async function loop() {                                      // the setup holds for 3 s, closes and launches again
      for (;;) {
        await run();
        await sleep(3000);
      }
    }
  }

  /* what the windows show: simple shapes, lit like real screens, only in the brand's own colours */
  function mock(kind) {
    const VIOLET = "#a78bfa", MINT = "#3ee89b", BLUE = "#5b9dff", AMBER = "#ffb224", GREEN = "#4ade80", TEAL = "#14b8a6";
    let seed = { obs: 3, chat: 5, stats: 7, yt: 11, disc: 13 }[kind] || 1;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const B = (l, t, w, h, bg, x = "") => `<i class="bk" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%;background:${bg};${x}"></i>`;
    const L = (l, t, w, c = "rgba(255,255,255,.2)") => `<i class="ln" style="left:${l}%;top:${t}%;width:${w}%;background:${c}"></i>`;
    let h = "";
    if (kind === "obs") {                                       // the program preview is the brightest thing on the desk
      h += B(2, 3, 96, 56, `linear-gradient(135deg,#3a5ea8,#6b4bc4 60%,${VIOLET})`) + B(6, 9, 28, 24, "rgba(255,255,255,.22)", "box-shadow:inset 0 0 0 1px rgba(255,255,255,.4)");
      h += B(60, 42, 34, 12, "rgba(62,232,155,.7)") + B(38, 12, 30, 3, "rgba(255,255,255,.55)");
      for (let c = 0; c < 4; c++) {
        const l = 2 + c * 24.5; h += B(l, 63, 23, 34, "#23262f");
        for (let r = 0; r < 4; r++) h += c === 2 ? B(l + 2, 68 + r * 7, 6 + 12 * rnd(), 2.6, `linear-gradient(90deg,${MINT},${AMBER})`) : L(l + 2, 68 + r * 7, 9 + 9 * rnd());
      }
    } else if (kind === "chat") {
      const cols = [VIOLET, MINT, BLUE, AMBER, GREEN, TEAL];
      for (let r = 0; r < 14; r++) h += L(6, 4 + r * 6.6, 14 + 10 * rnd(), cols[r % 6]) + L(36, 4 + r * 6.6, 25 + 35 * rnd());
    } else if (kind === "stats") {
      for (let c = 0; c < 4; c++) h += B(3 + c * 24.2, 6, 22, 18, "#252a36") + L(5 + c * 24.2, 10, 10) + B(5 + c * 24.2, 16, 7, 3.5, MINT);
      h += B(3, 28, 60, 66, "#252a36") + B(65, 28, 32, 66, "#252a36");
      h += `<svg style="position:absolute;left:5%;top:36%;width:56%;height:52%" viewBox="0 0 100 50" preserveAspectRatio="none"><polyline fill="none" stroke="${BLUE}" stroke-width="2" vector-effect="non-scaling-stroke" points="0,40 10,34 20,37 30,25 40,29 50,18 60,22 70,12 80,16 90,7 100,10"/><polyline fill="none" stroke="${MINT}" stroke-width="2" vector-effect="non-scaling-stroke" points="0,45 10,42 20,44 30,36 40,38 50,33 60,35 70,27 80,30 90,24 100,22"/></svg>`;
      for (let r = 0; r < 6; r++) h += B(68, 34 + r * 9.5, 26 * (.3 + .7 * rnd()), 3.4, r % 2 ? BLUE : MINT);
    } else if (kind === "yt") {                                 // a lit video frame with an amber LIVE badge
      h += B(3, 5, 94, 52, `linear-gradient(135deg,#2f5d9c,#5a43a8 55%,${GREEN})`) + B(6, 9, 14, 6, AMBER);
      h += `<i class="bk" style="left:46%;top:24%;width:0;height:0;border-radius:0;border-left:calc(var(--u)*1.6) solid rgba(255,255,255,.85);border-top:calc(var(--u)*1) solid transparent;border-bottom:calc(var(--u)*1) solid transparent"></i>`;
      h += L(3, 62, 70, "rgba(255,255,255,.4)") + L(3, 69, 40);
      for (let r = 0; r < 2; r++) h += B(3, 76 + r * 11, 22, 9, "#2a2e38") + L(28, 78 + r * 11, 40);
    } else if (kind === "disc") {
      h += B(0, 0, 9, 100, "#14161b", "border-radius:0") + B(9, 0, 24, 100, "#1c1f26", "border-radius:0");
      const cols = [BLUE, MINT, VIOLET, AMBER, TEAL];
      for (let r = 0; r < 5; r++) h += `<i class="bk" style="left:1.5%;top:${5 + r * 14}%;width:6%;aspect-ratio:1;border-radius:50%;background:${cols[r]}"></i>`;
      for (let r = 0; r < 7; r++) h += L(12, 6 + r * 9, 12 + 8 * rnd());
      for (let r = 0; r < 5; r++) h += `<i class="bk" style="left:37%;top:${8 + r * 17}%;width:6%;aspect-ratio:1;border-radius:50%;background:#353945"></i>` + L(45, 9 + r * 17, 14, "rgba(255,255,255,.45)") + L(45, 14 + r * 17, 30 + 20 * rnd());
    }
    return h;
  }
})();
