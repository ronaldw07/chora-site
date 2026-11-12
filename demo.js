// The interactive notch on the landing page (desktop only), copied from the
// app's own views. Everything here is pretend: nothing is sent anywhere and
// nothing is saved.

const SCENE_COUNT = 7;
const NAV_HEIGHT = 72;
/// ⌥1–⌥5 pick the app's five tabs: Home, Shelf, Clipboard, Timer, Calendar.
const TAB_SCENES = [0, 3, 4, 5, 6];

// Calendar: the app's timeline is 96pt per hour with 24pt rows.
const CAL_START = 12 * 60;   // the track begins at noon
const CAL_SPAN = 10 * 60;    // and runs ten hours
const CAL_NOW = 16 * 60 + 12 - CAL_START; // the menu bar says 4:12 PM
const HOUR_PT = 96;
const HOUR_ROW = 14;
const LANE_H = 24;
const LANE_GAP = 3;
const LANES = 3;
const SNAP = 15;
const MIN_LEN = 15;
const EDGE_GRAB = 12;
const DRAG_THRESHOLD = 4;

const TIMER_UNDO_MS = 8000;
const DELETE_CONFIRM_MS = 3000;
const SONG_SECONDS = 192;
const LYRIC_SECONDS = 5;
const LYRICS = [
  "The harbor lights are folding down",
  "Every window learns your name",
  "I kept the quiet, you kept the time",
  "Neither one of us to blame",
  "Carry me back to the low tide hours",
  "Where the evening hums in blue",
  "Say it slow and say it twice",
  "I'll be the light that finds you",
];

const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
const snap = (minutes) => Math.round(minutes / SNAP) * SNAP;

/// Minutes after noon as a clock time: 255 → "4:15 PM".
function formatTime(minutes) {
  const total = CAL_START + minutes;
  const hour = Math.floor(total / 60) % 24;
  return `${hour % 12 || 12}:${String(total % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

/// The timer's readout: "5:00", "1:00:00".
function formatClock(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = String(whole % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/// Each event takes the first row that's free, so overlapping events stack.
function assignLanes(events) {
  const laneEnds = [];
  const lanes = new Map();
  [...events].sort((a, b) => a.start - b.start || b.len - a.len).forEach((event) => {
    let lane = laneEnds.findIndex((end) => end <= event.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = event.start + event.len;
    lanes.set(event.id, lane);
  });
  return lanes;
}

/// What a drag does, as in the app: "move" shifts the event, "start" and
/// "end" move one edge. Edges land on 15 minutes; nothing gets shorter than
/// 15 minutes or leaves the timeline.
function dragged(event, mode, deltaMinutes) {
  const end = event.start + event.len;
  if (mode === "end") {
    const newEnd = clamp(snap(end + deltaMinutes), event.start + MIN_LEN, CAL_SPAN);
    return { ...event, len: newEnd - event.start };
  }
  if (mode === "start") {
    const newStart = clamp(snap(event.start + deltaMinutes), 0, end - MIN_LEN);
    return { ...event, start: newStart, len: end - newStart };
  }
  return { ...event, start: clamp(snap(event.start + deltaMinutes), 0, CAL_SPAN - event.len) };
}

if (typeof module !== "undefined") module.exports = { snap, formatTime, formatClock, assignLanes, dragged };

// SF Symbols-style icons, drawn on a 24-point grid.
const S = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  house: `<path fill="currentColor" d="M12 2.8 1.9 11.4a1 1 0 0 0 1.3 1.5l.8-.7V20a1.5 1.5 0 0 0 1.5 1.5h4.1v-6h4.8v6h4.1A1.5 1.5 0 0 0 20 20v-7.8l.8.7a1 1 0 0 0 1.3-1.5Z"/>`,
  tray: `<path fill="currentColor" fill-rule="evenodd" d="M6.4 4.5h11.2c.8 0 1.5.5 1.8 1.2l2.6 5.8V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.5l2.6-5.8c.3-.7 1-1.2 1.8-1.2Zm-1.8 7H9a3 3 0 0 0 6 0h4.4l-2.1-5H6.7Z"/>`,
  clipboard: `<path fill="currentColor" d="M7 4h1.3a1 1 0 0 0 1 .9h5.4a1 1 0 0 0 1-.9H17a2.5 2.5 0 0 1 2.5 2.5v13A2.5 2.5 0 0 1 17 22H7a2.5 2.5 0 0 1-2.5-2.5v-13A2.5 2.5 0 0 1 7 4Zm2.5-2h5a1 1 0 0 1 1 1v.9a.5.5 0 0 1-.5.5H9a.5.5 0 0 1-.5-.5V3a1 1 0 0 1 1-1Z"/>`,
  timer: `<g ${S} stroke-width="2"><path d="M12 4.5A8.5 8.5 0 1 1 6 7"/><path d="M12 13 8.2 9.2"/><path d="M12 4.5v2.5"/></g>`,
  calendar: `<g ${S} stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="16" rx="3.5"/><path d="M3.5 9.5h17"/></g><g fill="currentColor"><circle cx="8" cy="13" r="1.1"/><circle cx="12" cy="13" r="1.1"/><circle cx="16" cy="13" r="1.1"/><circle cx="8" cy="16.8" r="1.1"/><circle cx="12" cy="16.8" r="1.1"/></g>`,
  speaker: `<g ${S} stroke-width="1.8"><path d="M3.5 9.2h3L11 5.3v13.4l-4.5-3.9h-3a1 1 0 0 1-1-1V10.2a1 1 0 0 1 1-1Z"/><path d="M15 9a4.2 4.2 0 0 1 0 6"/><path d="M17.8 6.5a7.8 7.8 0 0 1 0 11"/></g>`,
  speakerFill: `<path fill="currentColor" d="M3.5 9.2h3L11 5.3v13.4l-4.5-3.9h-3a1 1 0 0 1-1-1V10.2a1 1 0 0 1 1-1Z"/><g ${S} stroke-width="1.8"><path d="M15 9a4.2 4.2 0 0 1 0 6"/><path d="M17.8 6.5a7.8 7.8 0 0 1 0 11"/></g>`,
  quote: `<path ${S} stroke-width="1.8" d="M5.5 3.5h13A2.5 2.5 0 0 1 21 6v8.5a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4h-.5A2.5 2.5 0 0 1 3 14.5V6a2.5 2.5 0 0 1 2.5-2.5Z"/><g fill="currentColor"><circle cx="9.3" cy="9.6" r="1.5"/><circle cx="14.7" cy="9.6" r="1.5"/><path d="M8.6 10.3c.9.4 1.6 1.4.9 2.9h-1c.5-.9.3-1.6-.2-2Zm5.4 0c.9.4 1.6 1.4.9 2.9h-1c.5-.9.3-1.6-.2-2Z"/></g>`,
  quoteFill: `<path fill="currentColor" d="M5.5 3.5h13A2.5 2.5 0 0 1 21 6v8.5a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4h-.5A2.5 2.5 0 0 1 3 14.5V6a2.5 2.5 0 0 1 2.5-2.5Z"/><g fill="#000"><circle cx="9.3" cy="9.6" r="1.5"/><circle cx="14.7" cy="9.6" r="1.5"/></g>`,
  gear: `<g ${S} stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></g>`,
  play: `<path fill="currentColor" d="M7 4.6v14.8a1 1 0 0 0 1.5.9l12-7.4a1 1 0 0 0 0-1.8l-12-7.4A1 1 0 0 0 7 4.6Z"/>`,
  pause: `<g fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></g>`,
  stop: `<rect fill="currentColor" x="5.5" y="5.5" width="13" height="13" rx="2.5"/>`,
  back: `<path fill="currentColor" d="M11 6.3v11.4a.8.8 0 0 1-1.3.6L2.6 12.6a.8.8 0 0 1 0-1.2l7.1-5.7a.8.8 0 0 1 1.3.6Zm10 0v11.4a.8.8 0 0 1-1.3.6l-7.1-5.7a.8.8 0 0 1 0-1.2l7.1-5.7a.8.8 0 0 1 1.3.6Z"/>`,
  forward: `<path fill="currentColor" transform="matrix(-1 0 0 1 24 0)" d="M11 6.3v11.4a.8.8 0 0 1-1.3.6L2.6 12.6a.8.8 0 0 1 0-1.2l7.1-5.7a.8.8 0 0 1 1.3.6Zm10 0v11.4a.8.8 0 0 1-1.3.6l-7.1-5.7a.8.8 0 0 1 0-1.2l7.1-5.7a.8.8 0 0 1 1.3.6Z"/>`,
  shuffle: `<g ${S} stroke-width="2"><path d="M3 7h3.5c4.5 0 6.5 10 11 10H21"/><path d="M3 17h3.5c1.8 0 3-1.5 4.2-3.5"/><path d="M13.3 10.5C14.5 8.5 15.7 7 17.5 7H21"/><path d="M18.5 4.5 21 7l-2.5 2.5"/><path d="M18.5 14.5 21 17l-2.5 2.5"/></g>`,
  repeat: `<g ${S} stroke-width="2"><path d="M4 11V9.5A2.5 2.5 0 0 1 6.5 7H20"/><path d="M17 4l3 3-3 3"/><path d="M20 13v1.5a2.5 2.5 0 0 1-2.5 2.5H4"/><path d="M7 20l-3-3 3-3"/></g>`,
  reset: `<g ${S} stroke-width="2.6"><path d="M5 12.5A7 7 0 1 0 7.2 7.3"/><path d="M4.6 4.2v3.9h3.9"/></g>`,
  undo: `<g ${S} stroke-width="2.6"><path d="M9 5 4.5 9.5 9 14"/><path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3"/></g>`,
  history: `<g ${S} stroke-width="2.2"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v3.8h3.8"/><path d="M12 8v4.3l2.8 1.7"/></g>`,
  chevL: `<path ${S} stroke-width="3" d="M15 5l-7 7 7 7"/>`,
  chevR: `<path ${S} stroke-width="3" d="M9 5l7 7-7 7"/>`,
  expand: `<g ${S} stroke-width="2.8"><path d="M14 4h6v6"/><path d="M20 4l-6 6"/><path d="M10 20H4v-6"/><path d="M4 20l6-6"/></g>`,
  x: `<path ${S} stroke-width="3.2" d="M6 6l12 12M18 6 6 18"/>`,
  trash: `<path fill="currentColor" d="M9 3h6l.8 1.5H20v2H4v-2h4.2Zm-3.5 5h13l-1 12a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8Z"/>`,
  check: `<path ${S} stroke-width="3.4" d="M5 12.5l4.5 4.5L19 7.5"/>`,
  calSmall: `<g ${S} stroke-width="2.2"><rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17"/></g>`,
  openApp: `<g ${S} stroke-width="2.4"><path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v10A2.5 2.5 0 0 0 6.5 20h10a2.5 2.5 0 0 0 2.5-2.5V14"/><path d="M13 4h7v7"/><path d="M20 4l-9 9"/></g>`,
  docText: `<g ${S} stroke-width="2"><path d="M14 2.8H6.8A1.8 1.8 0 0 0 5 4.6v14.8a1.8 1.8 0 0 0 1.8 1.8h10.4a1.8 1.8 0 0 0 1.8-1.8V7.8Z"/><path d="M14 2.8v5h5"/><path d="M8.5 13h7M8.5 16.5h5"/></g>`,
  link: `<g ${S} stroke-width="2.2"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></g>`,
  photoLine: `<g ${S} stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="10" r="1.6"/><path d="M4 17.5l5-5 3.5 3.5 2.5-2.5 5 5"/></g>`,
  note: `<g fill="currentColor"><path d="M9 6.2 19.5 3.8v11.4h-2.2V7.1L11.2 8.5v9.2H9Z"/><ellipse cx="6.8" cy="17.8" rx="3" ry="2.4"/><ellipse cx="17.1" cy="15.4" rx="3" ry="2.4"/></g>`,
  bubble: `<path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>`,
  video: `<g fill="currentColor"><rect x="2" y="6.5" width="13.5" height="11" rx="2.5"/><path d="M16.5 10.5 22 7.2v9.6l-5.5-3.3Z"/></g>`,
  globe: `<g ${S} stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.6 5.6 3.6 9s-1.1 6.5-3.6 9c-2.5-2.5-3.6-5.6-3.6-9S9.5 5.5 12 3Z"/></g>`,
  richtext: `<rect fill="currentColor" x="3.5" y="1.5" width="17" height="21" rx="3"/><g fill="#000" opacity="0.55"><path d="M7 5.5h3.4l1.7 5.5h-1.6l-.4-1.3H8.3l-.4 1.3H6.3Zm1.7 3h1.5L9.5 6.3Z"/><rect x="13.2" y="5.8" width="4" height="1.5" rx=".75"/><rect x="13.2" y="8.8" width="4" height="1.5" rx=".75"/><path d="M6.5 13.5h11v6h-11Zm1.5 4.5 2.8-2.8 2 2 1.5-1.5 2.2 2.3Z"/></g>`,
  photo: `<rect fill="currentColor" x="1.5" y="4" width="21" height="16" rx="3.5"/><g fill="#000" opacity="0.5"><circle cx="7.8" cy="9.3" r="2.1"/><path d="M3.5 18l5.5-5.5 3.5 3.5 3-3 5 5Z"/></g>`,
  film: `<rect fill="currentColor" x="1.5" y="4" width="21" height="16" rx="2.5"/><g fill="#000" opacity="0.55"><rect x="6.5" y="11" width="11" height="2" rx="1"/><rect x="3" y="6" width="2" height="2" rx=".5"/><rect x="3" y="11" width="2" height="2" rx=".5"/><rect x="3" y="16" width="2" height="2" rx=".5"/><rect x="19" y="6" width="2" height="2" rx=".5"/><rect x="19" y="11" width="2" height="2" rx=".5"/><rect x="19" y="16" width="2" height="2" rx=".5"/></g>`,
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

function paintIcons(root) {
  root.querySelectorAll("[data-i]").forEach((node) => { node.innerHTML = icon(node.dataset.i); });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function iconEl(name, className = "") {
  const node = el("i", className);
  node.dataset.i = name;
  node.innerHTML = icon(name);
  return node;
}

if (typeof document !== "undefined") {
  const story = document.querySelector("[data-story]");
  if (story) startDemo(story);
}

function startDemo(story) {
  paintIcons(story);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = matchMedia("(min-width: 900px)");
  const pin = story.querySelector(".story-pin");
  const notch = story.querySelector("[data-notch]");
  const views = [...story.querySelectorAll("[data-view]")];
  const captions = [...story.querySelectorAll(".caption")];
  const dots = [...story.querySelectorAll(".dots [data-go]")];
  const tabs = [...story.querySelectorAll("[data-tab]")];
  const toggles = [...story.querySelectorAll("[data-toggle]")];
  const pill = el("span", "tab-pill");
  tabs[0].parentElement.prepend(pill);

  const volume = setUpVolume(story.querySelector("[data-volume]"));
  const frameHooks = [
    setUpMusic(story, volume, reducedMotion),
    setUpTimer(story.querySelector("[data-timer]")),
  ];
  setUpCalendar(story);
  setUpShelf(story, notch);
  setUpClipboard(story.querySelector("[data-clipboard]"));

  let current = -1;
  function showScene(index) {
    if (index === current) return;
    current = index;
    story.dataset.scene = index;
    const view = index <= 2 ? 0 : index;
    views.forEach((v) => v.classList.toggle("on", Number(v.dataset.view) === view));
    tabs.forEach((t) => t.classList.toggle("on", Number(t.dataset.tab) === view));
    const activeTab = tabs.find((t) => Number(t.dataset.tab) === view);
    pill.style.width = `${activeTab.offsetWidth}px`;
    pill.style.left = `${activeTab.offsetLeft}px`;
    toggles.forEach((t) => {
      const on = Number(t.dataset.toggle) === index;
      const name = t.dataset.toggle === "1" ? "speaker" : "quote";
      t.querySelector("[data-i]").innerHTML = icon(on ? `${name}Fill` : name);
    });
    captions.forEach((caption, i) => {
      caption.classList.toggle("on", i === index);
      caption.classList.toggle("past", i < index);
      caption.classList.toggle("future", i > index);
    });
    dots.forEach((dot) => dot.classList.toggle("on", Number(dot.dataset.go) === index));
  }

  const scrollRange = () => story.getBoundingClientRect().height - pin.offsetHeight;

  function update() {
    if (!desktop.matches) return;
    const rect = story.getBoundingClientRect();
    notch.classList.toggle("open", rect.top < innerHeight * 0.75 && rect.bottom > innerHeight * 0.25);
    const progress = clamp((NAV_HEIGHT - rect.top) / scrollRange(), 0, 0.9999);
    showScene(Math.floor(progress * SCENE_COUNT));
  }

  /// The page always jumps straight to the scene. The screen is pinned, so
  /// the jump can't be seen; the scene change animates on its own. A smooth
  /// scroll here dragged the pinned screen through ~60vh of page per click,
  /// faster than Chrome could repaint it, which flashed black.
  function goTo(index, fromKeyboard) {
    if (fromKeyboard) {
      // Keyboard shortcuts switch at once, never animated.
      story.classList.add("instant");
      requestAnimationFrame(() => requestAnimationFrame(() => story.classList.remove("instant")));
    }
    showScene(index);
    const top = scrollY + story.getBoundingClientRect().top - NAV_HEIGHT + (scrollRange() * (index + 0.5)) / SCENE_COUNT;
    scrollTo({ top, behavior: "instant" });
  }

  let scheduled = false;
  addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  }, { passive: true });
  addEventListener("resize", update);
  story.querySelectorAll("[data-go]").forEach((button) =>
    button.addEventListener("click", () => goTo(Number(button.dataset.go))));
  // The speaker and lyrics buttons open their panel beside the player, or close it.
  toggles.forEach((button) => button.addEventListener("click", () => {
    const target = Number(button.dataset.toggle);
    goTo(current === target ? 0 : target);
  }));

  // ⌥1–⌥5, the same shortcuts as the app. Instant, never animated.
  addEventListener("keydown", (event) => {
    const match = event.altKey && /^Digit([1-5])$/.exec(event.code);
    const rect = story.getBoundingClientRect();
    if (!match || !desktop.matches || rect.bottom < 0 || rect.top > innerHeight) return;
    event.preventDefault();
    goTo(TAB_SCENES[Number(match[1]) - 1], true);
  });

  let visible = false;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(story);
  let last = performance.now();
  (function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (visible) frameHooks.forEach((hook) => hook(now, dt, current));
    requestAnimationFrame(frame);
  })(last);

  update();
  const deepLink = /^#scene-([1-7])$/.exec(location.hash);
  if (deepLink) addEventListener("load", () => goTo(Number(deepLink[1]) - 1, true));
}

// ---------- Volume ----------

function setUpVolume(root) {
  const levels = { master: 0.62, spotify: 0.8, discord: 0.35, zoom: 1, safari: 0.6 };
  const masterIcon = root.querySelector("[data-master-icon]");
  const ARCS = ["M14.8 9.6a3.4 3.4 0 0 1 0 4.8", "M17.3 7.4a6.6 6.6 0 0 1 0 9.2", "M19.8 5.2a9.8 9.8 0 0 1 0 13.6"];

  function paint(key) {
    const slider = root.querySelector(`.vs[data-key="${key}"]`);
    const value = Math.round(levels[key] * 100);
    slider.style.setProperty("--v", levels[key]);
    slider.setAttribute("aria-valuenow", value);
    root.querySelector(`[data-value-for="${key}"]`).textContent = value;
    if (key !== "master") return;
    // The speaker shows one, two or three waves, or a slash when muted.
    const waves = levels.master <= 0 ? 0 : levels.master < 0.34 ? 1 : levels.master < 0.67 ? 2 : 3;
    const extra = waves
      ? `<g ${S} stroke-width="2">${ARCS.slice(0, waves).map((d) => `<path d="${d}"/>`).join("")}</g>`
      : `<path ${S} stroke-width="2" d="M14 9.5l5 5M19 9.5l-5 5"/>`;
    masterIcon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2.5 9.2h3L10 5.3v13.4l-4.5-3.9h-3a1 1 0 0 1-1-1V10.2a1 1 0 0 1 1-1Z"/>${extra}</svg>`;
  }

  root.querySelectorAll(".vs").forEach((slider) => {
    const key = slider.dataset.key;
    const set = (clientX) => {
      const rect = slider.getBoundingClientRect();
      const knob = slider.querySelector(".vs-knob").getBoundingClientRect().width;
      levels[key] = clamp((clientX - rect.left - knob / 2) / Math.max(1, rect.width - knob), 0, 1);
      paint(key);
    };
    slider.addEventListener("pointerdown", (down) => {
      slider.setPointerCapture(down.pointerId);
      slider.classList.add("held");
      set(down.clientX);
      const move = (e) => set(e.clientX);
      const end = () => {
        slider.classList.remove("held");
        slider.removeEventListener("pointermove", move);
        slider.removeEventListener("pointerup", end);
        slider.removeEventListener("pointercancel", end);
      };
      slider.addEventListener("pointermove", move);
      slider.addEventListener("pointerup", end);
      slider.addEventListener("pointercancel", end);
    });
    slider.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }[event.key];
      if (step === undefined) return;
      event.preventDefault();
      levels[key] = clamp(levels[key] + step, 0, 1);
      paint(key);
    });
    paint(key);
  });

  return { levels };
}

// ---------- Music and lyrics ----------

function setUpMusic(story, volume, reducedMotion) {
  const playButton = story.querySelector("[data-music-play]");
  const progress = story.querySelector("[data-progress]");
  const clock = story.querySelector("[data-music-time]");
  const bars = [...story.querySelectorAll(".viz i")];
  const lyricsBox = story.querySelector("[data-lyrics]");
  const list = el("div", "lyrics-list");
  const rows = LYRICS.map((line, index) => {
    const row = el("div", "lyric", line);
    row.addEventListener("click", () => { time = index * LYRIC_SECONDS; paint(); });
    list.appendChild(row);
    return row;
  });
  lyricsBox.appendChild(list);

  story.querySelectorAll("[data-music-restart]").forEach((b) => b.addEventListener("click", () => { time = 0; paint(); }));
  story.querySelectorAll("[data-music-shuffle], [data-music-repeat]").forEach((b) =>
    b.addEventListener("click", () => b.classList.toggle("lit")));

  let playing = true;
  let time = 0;

  function paint() {
    const active = Math.floor(time / LYRIC_SECONDS) % LYRICS.length;
    rows.forEach((row, i) => {
      row.classList.toggle("on", i === active);
      row.style.opacity = [1, 0.45, 0.25][Math.abs(i - active)] ?? 0.12;
    });
    // Center the current line in the 130pt panel.
    const rowStep = rows[0].offsetHeight || 42;
    list.style.transform = `translateY(${65 - rowStep / 2 - active * rowStep}px)`;
    progress.style.transform = `scaleX(${time / SONG_SECONDS})`;
    clock.textContent = formatClock(time);
    playButton.querySelector("[data-i]").innerHTML = icon(playing ? "pause" : "play");
  }

  playButton.addEventListener("click", () => { playing = !playing; paint(); });
  paint();

  return function frame(now, dt) {
    if (playing) {
      const before = Math.floor(time / LYRIC_SECONDS);
      time = time + dt >= SONG_SECONDS ? 0 : time + dt;
      progress.style.transform = `scaleX(${time / SONG_SECONDS})`;
      clock.textContent = formatClock(time);
      if (Math.floor(time / LYRIC_SECONDS) !== before) paint();
    }
    // Louder when Spotify and the master are up, flat when muted.
    const loudness = volume.levels.master * volume.levels.spotify;
    bars.forEach((bar, i) => {
      const wave = 0.35 + 0.65 * Math.abs(Math.sin((now / 1000) * (2.4 + i * 0.8) + i));
      const height = playing && !reducedMotion ? 0.15 + 0.85 * wave * loudness : 0.25;
      bar.style.transform = `scaleY(${height})`;
    });
  };
}

// ---------- Timer and stopwatch ----------

function setUpTimer(root) {
  const readout = root.querySelector("[data-readout]");
  const centis = root.querySelector("[data-cs]");
  const ring = root.querySelector(".ring-fill");
  const chips = [...root.querySelectorAll("[data-secs]")];
  const modeButtons = [...root.querySelectorAll("[data-mode]")];
  const play = root.querySelector("[data-timer-play]");
  const stop = root.querySelector("[data-timer-stop]");
  const reset = root.querySelector("[data-timer-reset]");
  const undoButton = root.querySelector("[data-timer-undo]");
  const CIRCUMFERENCE = 257.6;

  let mode = "timer";
  let target = 300;
  let remaining = target;
  let elapsed = 0;
  let running = false;
  let undo = null; // { remaining, elapsed, running, until }

  const canReset = () => running || (mode === "timer" ? remaining !== target : elapsed > 0);

  function paint() {
    root.classList.toggle("stopwatch", mode === "stopwatch");
    root.classList.toggle("done", mode === "timer" && remaining <= 0);
    if (mode === "timer") {
      readout.textContent = formatClock(Math.ceil(remaining));
      centis.textContent = "";
      ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - remaining / target));
    } else {
      readout.textContent = formatClock(elapsed);
      centis.textContent = `.${String(Math.floor((elapsed % 1) * 100)).padStart(2, "0")}`;
    }
    play.classList.toggle("dim", running);
    stop.classList.toggle("dim", !running);
    reset.classList.toggle("dim", !canReset());
  }

  function pick(seconds) {
    target = remaining = seconds;
    running = false;
    undo = null;
    chips.forEach((chip) => chip.classList.toggle("on", Number(chip.dataset.secs) === seconds));
    paint();
  }

  chips.forEach((chip) => chip.addEventListener("click", () => {
    const seconds = Number(chip.dataset.secs);
    // Picking the selected length again starts it over.
    if (seconds === target) { remaining = target; running = true; paint(); return; }
    pick(seconds);
  }));
  modeButtons.forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.mode;
    running = false;
    undo = null;
    modeButtons.forEach((b) => b.classList.toggle("on", b === button));
    paint();
  }));
  play.addEventListener("click", () => {
    if (mode === "timer" && remaining <= 0) remaining = target;
    running = true;
    paint();
  });
  stop.addEventListener("click", () => { running = false; paint(); });
  reset.addEventListener("click", () => {
    if (!canReset()) return;
    undo = { remaining, elapsed, running, until: performance.now() + TIMER_UNDO_MS };
    remaining = target;
    elapsed = 0;
    running = false;
    paint();
  });
  undoButton.addEventListener("click", () => {
    if (!undo) return;
    ({ remaining, elapsed, running } = undo);
    undo = null;
    paint();
  });

  paint();
  return function frame(now, dt) {
    if (running) {
      if (mode === "timer") {
        remaining = Math.max(0, remaining - dt);
        if (remaining === 0) running = false;
      } else {
        elapsed += dt;
      }
      paint();
    }
    if (undo && now > undo.until) undo = null;
    undoButton.classList.toggle("gone", !undo);
  };
}

// ---------- Calendar ----------

function setUpCalendar(story) {
  const root = story.querySelector("[data-calendar]");
  const viewport = root.querySelector("[data-cal-viewport]");
  const track = root.querySelector("[data-cal-track]");
  const overlay = root.querySelector("[data-cal-overlay]");
  const resetLink = story.querySelector("[data-cal-reset]");
  const TRACK_WIDTH = (CAL_SPAN / 60) * HOUR_PT;
  const CALENDARS = { Work: "#0a84ff", School: "#bf5af2", Study: "#40c8e0", Personal: "#30d158", Friends: "#ff9f0a" };
  const starting = () => [
    { id: "standup", title: "Standup", calendar: "Work", start: 30, len: 15 },
    { id: "review", title: "Design review", calendar: "Work", start: 90, len: 60 },
    { id: "office", title: "Office hours", calendar: "School", start: 120, len: 60 },
    { id: "study", title: "DSA study", calendar: "Study", start: 210, len: 90 },
    { id: "gym", title: "Gym", calendar: "Personal", start: 375, len: 60 },
    { id: "dinner", title: "Dinner with Sam", calendar: "Friends", start: 450, len: 60 },
  ];
  let events = starting();
  let offset = 0;
  // Undo, as in the app: a message says what the last change saved, with
  // Undo beside it. Changes come back one at a time, newest first, with no
  // time limit; the x keeps everything as it is.
  const toast = root.querySelector("[data-cal-toast]");
  const toastText = root.querySelector("[data-cal-toast-text]");
  let history = []; // { before, message }
  function showToast() {
    const latest = history[history.length - 1];
    if (latest) toastText.textContent = latest.message;
    toast.classList.toggle("on", Boolean(latest));
  }
  function remember(before, message) {
    history.push({ before, message });
    showToast();
  }
  root.querySelector("[data-cal-undo]").addEventListener("click", () => {
    if (!history.length) return;
    events = history.pop().before;
    closeDetails();
    render();
    showToast();
  });
  root.querySelector("[data-cal-dismiss]").addEventListener("click", () => {
    history = [];
    showToast();
  });
  const nodes = new Map();
  const minutesToPt = (minutes) => (minutes / 60) * HOUR_PT;

  // Hour labels and lines, the dimmed past, and the red now line.
  track.style.width = `${TRACK_WIDTH}px`;
  for (let h = 0; h < CAL_SPAN / 60; h++) {
    const hour = (12 + h) % 24;
    const label = el("span", "hour-label", `${hour % 12 || 12}${hour >= 12 ? "pm" : "am"}`);
    label.style.left = `${h * HOUR_PT + 4}px`;
    const line = el("span", "hour-line");
    line.style.left = `${h * HOUR_PT}px`;
    track.append(label, line);
  }
  const past = el("span", "past");
  past.style.width = `${minutesToPt(CAL_NOW)}px`;
  const nowLine = el("span", "now-line");
  nowLine.style.left = `${minutesToPt(CAL_NOW) - 0.75}px`;
  track.append(past, nowLine);

  function setOffset(value) {
    offset = clamp(value, 0, TRACK_WIDTH - viewport.clientWidth);
    track.style.transform = `translateX(${-offset}px)`;
  }
  // Like the app: "now" sits a third of the way across.
  requestAnimationFrame(() => setOffset(minutesToPt(CAL_NOW) - viewport.clientWidth / 3));
  // A sideways swipe scrolls the day; an up-and-down one still scrolls the page.
  viewport.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    setOffset(offset + event.deltaX);
  }, { passive: false });

  function render() {
    const lanes = assignLanes(events);
    for (const [id, node] of nodes) {
      if (!events.some((e) => e.id === id)) { node.remove(); nodes.delete(id); }
    }
    events.forEach((event) => {
      let node = nodes.get(event.id);
      if (!node) {
        node = el("div", "cev");
        node.dataset.id = event.id;
        node.style.setProperty("--c", CALENDARS[event.calendar]);
        node.append(el("span", "cev-title", event.title), el("span", "cev-time"), el("i", "grip l"), el("i", "grip r"));
        nodes.set(event.id, node);
        track.appendChild(node);
      }
      const lane = lanes.get(event.id);
      const width = Math.max(4, minutesToPt(event.len) - 2);
      node.hidden = lane >= LANES;
      node.style.left = `${minutesToPt(event.start) + 1}px`;
      node.style.width = `${width}px`;
      node.style.top = `${HOUR_ROW + lane * (LANE_H + LANE_GAP)}px`;
      node.querySelector(".cev-time").textContent = formatTime(event.start);
      node.classList.toggle("narrow", width <= 48);
      node.classList.toggle("current", event.start <= CAL_NOW && CAL_NOW < event.start + event.len);
    });
    resetLink.hidden = events.length === starting().length;
  }

  // Press, drag and release, as the app does it: within 12pt of an edge
  // resizes from that edge, anywhere else moves the whole event.
  function hit(target, clientX) {
    const node = target.closest(".cev");
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const x = (clientX - rect.left) / (rect.width / node.offsetWidth);
    const edges = node.offsetWidth > EDGE_GRAB * 3;
    const mode = edges && x <= EDGE_GRAB ? "start" : edges && x >= node.offsetWidth - EDGE_GRAB ? "end" : "move";
    return { node, id: node.dataset.id, mode };
  }

  track.addEventListener("pointermove", (event) => {
    if (track.hasPointerCapture(event.pointerId)) return;
    const found = hit(event.target, event.clientX);
    track.style.cursor = !found ? "default" : found.mode === "move" ? "grab" : "ew-resize";
  });

  track.addEventListener("pointerdown", (down) => {
    if (down.button !== 0) return;
    const found = hit(down.target, down.clientX);
    if (!found) return;
    const origin = events.find((e) => e.id === found.id);
    const before = events;
    const scale = track.getBoundingClientRect().width / TRACK_WIDTH;
    let moved = false;
    track.setPointerCapture(down.pointerId);

    const onMove = (move) => {
      const dx = move.clientX - down.clientX;
      if (!moved && Math.abs(dx) < DRAG_THRESHOLD) return;
      moved = true;
      found.node.classList.add("dragging");
      if (found.mode === "move") track.style.cursor = "grabbing";
      const minutes = (dx / scale / HOUR_PT) * 60;
      events = events.map((e) => (e.id === found.id ? dragged(origin, found.mode, minutes) : e));
      render();
    };
    const onEnd = () => {
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onEnd);
      track.removeEventListener("pointercancel", onEnd);
      found.node.classList.remove("dragging");
      if (!moved) { openDetails(found.id); return; }
      const after = events.find((e) => e.id === found.id);
      if (after.start === origin.start && after.len === origin.len) return;
      remember(before, after.len === origin.len
        ? `Moved to ${formatTime(after.start)}`
        : `Now ${formatTime(after.start)} – ${formatTime(after.start + after.len)}`);
    };
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onEnd);
    track.addEventListener("pointercancel", onEnd);
  });

  function button(className, iconName, label) {
    const node = el("button", className);
    node.type = "button";
    node.append(iconEl(iconName));
    if (label) node.append(el("span", "", label));
    return node;
  }

  function openDetails(id) {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    const card = el("div", "card");
    card.style.setProperty("--c", CALENDARS[event.calendar]);

    const titles = el("div");
    titles.append(el("div", "card-title", event.title),
      el("div", "card-time", `Wed, Nov 11 · ${formatTime(event.start)} – ${formatTime(event.start + event.len)}`));
    const close = button("card-close", "x");
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", closeDetails);
    const head = el("div", "card-head");
    head.append(el("span", "card-bar"), titles, close);

    const line = el("div", "card-line");
    line.append(iconEl("calSmall"), el("span", "", event.calendar));
    const openButton = button("pill open", "openApp", "Open in Calendar");
    openButton.title = "Opens the event in Calendar on your Mac";
    const remove = button("pill delete", "trash", "Delete");
    let confirmTimer = null;
    remove.addEventListener("click", () => {
      if (!remove.classList.contains("confirm")) {
        remove.classList.add("confirm");
        remove.lastChild.textContent = "Tap again to delete";
        confirmTimer = setTimeout(() => {
          remove.classList.remove("confirm");
          remove.lastChild.textContent = "Delete";
        }, DELETE_CONFIRM_MS);
        return;
      }
      clearTimeout(confirmTimer);
      remember(events, `Deleted ${event.title}`);
      events = events.filter((e) => e.id !== id);
      closeDetails();
      render();
    });
    const actions = el("div", "card-actions");
    actions.append(openButton, remove);
    const body = el("div", "card-body");
    body.append(line, actions);

    card.append(head, body);
    overlay.replaceChildren(card);
    overlay.hidden = false;
  }

  function closeDetails() {
    overlay.hidden = true;
    overlay.replaceChildren();
  }

  overlay.addEventListener("click", (event) => { if (event.target === overlay) closeDetails(); });
  resetLink.addEventListener("click", () => {
    events = starting();
    history = [];
    showToast();
    closeDetails();
    render();
  });
  render();
}

// ---------- Shelf ----------

function setUpShelf(story, notch) {
  const zone = story.querySelector("[data-shelf-zone]");
  const itemsBox = story.querySelector("[data-shelf-items]");
  const files = [...story.querySelectorAll("[data-file]")];
  const shelved = [];
  let selected = null;

  files.forEach((file) => {
    file.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", file.dataset.file));
    file.addEventListener("click", () => add(file.dataset.file));
  });

  function add(id) {
    if (shelved.includes(id) || !files.some((file) => file.dataset.file === id)) return;
    shelved.push(id);
    render();
  }

  function render() {
    itemsBox.replaceChildren();
    files.forEach((file) => { file.hidden = shelved.includes(file.dataset.file); });
    shelved.forEach((id) => {
      const file = files.find((f) => f.dataset.file === id);
      const source = file.querySelector("[data-i]");
      const name = file.textContent.trim();
      const item = el("div", `shelf-item${selected === id ? " selected" : ""}`);
      const glyph = iconEl(source.dataset.i);
      glyph.style.color = source.style.color;
      const remove = el("button", "x");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${name}`);
      remove.append(iconEl("x"));
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        shelved.splice(shelved.indexOf(id), 1);
        render();
      });
      item.addEventListener("click", () => { selected = selected === id ? null : id; render(); });
      item.append(glyph, el("span", "", name), remove);
      itemsBox.appendChild(item);
    });
    zone.classList.toggle("has-items", shelved.length > 0);
  }

  notch.addEventListener("dragover", (event) => { event.preventDefault(); notch.classList.add("drop-target"); });
  notch.addEventListener("dragleave", () => notch.classList.remove("drop-target"));
  notch.addEventListener("drop", (event) => {
    event.preventDefault();
    notch.classList.remove("drop-target");
    add(event.dataTransfer.getData("text/plain"));
  });
  render();
}

// ---------- Clipboard ----------

function setUpClipboard(root) {
  const list = root.querySelector("[data-clip-list]");
  const undoButton = root.querySelector("[data-clip-undo]");
  const clearButton = root.querySelector("[data-clip-clear]");
  const KIND_ICON = { text: "docText", link: "link", file: "docText" };
  let items = [
    { id: 1, kind: "text", title: "Meet at 6 by the north entrance", sub: "Text · 2 min ago" },
    { id: 2, kind: "link", title: "ronaldw07.github.io/chora-site", sub: "Link · 9 min ago" },
    { id: 3, kind: "image", title: "Screenshot 2026-11-11 at 3.58 PM", sub: "Image · 14 min ago" },
    { id: 4, kind: "file", title: "Notes.pdf", sub: "File · 1 hr ago" },
    { id: 5, kind: "text", title: "git push fork HEAD:main", sub: "Text · 2 hr ago" },
  ];
  let previous = null;
  let copiedId = null;
  let confirmTimer = null;

  function row(item) {
    const node = el("div", `clip-row${copiedId === item.id ? " copied" : ""}`);
    const thumb = el("span", `clip-thumb${item.kind === "image" ? " image" : ""}`);
    if (item.kind !== "image") thumb.append(iconEl(KIND_ICON[item.kind]));
    const text = el("div", "clip-text");
    text.append(el("div", "clip-title", item.title), el("div", "clip-sub", item.sub));
    node.append(thumb, text);
    if (copiedId === item.id) {
      const badge = el("span", "clip-copied");
      badge.append(el("span", "", "Copied"), iconEl("check"));
      node.append(badge);
    }
    const trash = el("button", "clip-trash");
    trash.type = "button";
    trash.setAttribute("aria-label", `Delete ${item.title}`);
    trash.append(iconEl("trash"));
    trash.addEventListener("click", (event) => {
      event.stopPropagation();
      previous = items;
      items = items.filter((i) => i.id !== item.id);
      render();
    });
    node.append(trash);
    // Clicking a row copies it again, for real if it's text.
    node.addEventListener("click", () => {
      if (item.kind !== "image") navigator.clipboard?.writeText(item.title).catch(() => {});
      copiedId = item.id;
      render();
      setTimeout(() => { if (copiedId === item.id) { copiedId = null; render(); } }, 1000);
    });
    return node;
  }

  function render() {
    list.replaceChildren(...items.map(row));
    if (!items.length) {
      const empty = el("div", "clip-empty");
      empty.append(iconEl("clipboard"), el("span", "", "Nothing copied yet"));
      list.append(empty);
    }
    undoButton.classList.toggle("on", previous !== null);
  }

  undoButton.addEventListener("click", () => {
    if (!previous) return;
    items = previous;
    previous = null;
    render();
  });
  // A second tap within two seconds actually clears, like the app.
  clearButton.addEventListener("click", () => {
    if (!items.length) return;
    if (clearButton.textContent !== "Confirm") {
      clearButton.textContent = "Confirm";
      confirmTimer = setTimeout(() => { clearButton.textContent = "Delete All"; }, 2000);
      return;
    }
    clearTimeout(confirmTimer);
    clearButton.textContent = "Delete All";
    previous = items;
    items = [];
    render();
  });
  render();
}
