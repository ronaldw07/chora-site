// Reads CHANGELOG.md straight from the app's repo, so the site is current the
// moment a release is published. Releases are grouped by minor version
// (0.7, 0.6, …); each update is a row that opens with its +.

const CHANGELOG_URL = "https://raw.githubusercontent.com/ronaldw07/boring.notch/main/CHANGELOG.md";
const ROWS_BEFORE_SHOW_MORE = 5;

/// One line per version line. A group without one just shows its updates.
const GROUP_SUMMARIES = {
  "0.8": "The app is now Chora, with a new icon, and updates now install on their own.",
  "0.7": "A volume panel with a slider for each app, calendar events you can drag, resize and delete, and Google Tasks on the Calendar tab.",
  "0.6": "A Calendar tab with a wide day timeline, a bigger mirror, ⌥1–5 tab shortcuts, a calendar that refreshes itself, timer undo, and permissions that survive updates.",
  "0.5": "Timers down to the second with recent lengths, music and a timer together in the closed notch, lyrics that match the right song, and auto-updates.",
  "0.4": "Synced lyrics you can scrub and tap, pause on mute, and a calendar toggle beside the player.",
  "0.3": "Shelf pinning, stacks and multi-select, plus clipboard history from launch and a last tab that's actually remembered.",
  "0.2": "Shelf remove buttons, hover highlights and scrolling, and a timer laid out as a row.",
  "0.1": "A notch that animates shut instead of snapping, without flicker.",
};

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function inline(text) {
  return escapeHTML(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/// "**Timer: an undo button.** After any…" → headline "Timer: an undo button.", detail "After any…".
function splitItem(item) {
  const bold = item.match(/^\*\*(.+?)\*\*\s*(.*)$/);
  return bold ? { headline: bold[1], detail: bold[2] } : { headline: item, detail: "" };
}

function parseChangelog(md) {
  const releases = [];
  for (const block of md.split(/^## /m).slice(1)) {
    const [heading, ...lines] = block.split("\n");
    const match = heading.match(/^(\d+\.\d+)\.(\d+)\s+—\s+(\d{4}-\d{2}-\d{2})/);
    if (!match) continue; // "Unreleased" and anything else without a version

    const release = { version: `${match[1]}.${match[2]}`, minor: match[1], date: match[3], sections: [] };
    let section = null;
    for (const line of lines) {
      if (/^---\s*$/.test(line)) break;
      const sectionHeading = line.match(/^### (.+)/);
      if (sectionHeading) {
        section = { title: sectionHeading[1].trim(), items: [] };
        release.sections.push(section);
      } else if (line.startsWith("- ") && section) {
        section.items.push(line.slice(2).trim());
      } else if (/^\s{2,}\S/.test(line) && section && section.items.length) {
        section.items[section.items.length - 1] += " " + line.trim();
      }
    }
    releases.push(release);
  }
  return releases;
}

/// Consecutive releases sharing a minor version, newest group first.
function groupReleases(releases) {
  const groups = [];
  for (const release of releases) {
    const last = groups[groups.length - 1];
    if (last && last.minor === release.minor) last.releases.push(release);
    else groups.push({ minor: release.minor, releases: [release] });
  }
  return groups;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function monthYear(iso) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function renderRow(release) {
  const id = `release-${release.version.replace(/\./g, "-")}`;
  const sections = release.sections
    .filter((s) => s.items.length)
    .map((s) => `<h4>${escapeHTML(s.title)} (${s.items.length})</h4>
      <ul>${s.items.map((raw) => {
        const { headline, detail } = splitItem(raw);
        const gap = /^[,.;:]/.test(detail) ? "" : " ";
        return `<li><span class="item-head">${inline(headline)}</span>${detail ? `${gap}<span class="item-detail">${inline(detail)}</span>` : ""}</li>`;
      }).join("")}</ul>`)
    .join("");
  return `<div class="row">
    <button class="row-toggle" aria-expanded="false" aria-controls="${id}">
      <span class="plus" aria-hidden="true"></span>
      <span class="row-version">${release.version}</span>
      <span class="row-date">${shortDate(release.date)}</span>
    </button>
    <div class="row-body" id="${id}"><div class="row-inner">${sections}</div></div>
  </div>`;
}

function renderGroup(group) {
  const summary = GROUP_SUMMARIES[group.minor];
  const extra = group.releases.length > ROWS_BEFORE_SHOW_MORE;
  return `<section class="group${extra ? " is-collapsed" : ""}">
    <h2>${group.minor}</h2>
    ${summary ? `<p class="group-summary">${escapeHTML(summary)}</p>` : ""}
    <div class="rows">${group.releases.map(renderRow).join("")}</div>
    ${extra ? `<button class="show-more">Show more</button>` : ""}
  </section>`;
}

function wireUp(root) {
  root.addEventListener("click", (event) => {
    const toggle = event.target.closest(".row-toggle");
    if (toggle) {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.parentElement.classList.toggle("is-open", open);
      return;
    }
    const more = event.target.closest(".show-more");
    if (more) {
      more.closest(".group").classList.remove("is-collapsed");
      more.remove();
    }
  });
}

async function loadChangelog() {
  const list = document.querySelector("[data-changelog]");
  const latest = document.querySelector("[data-latest]");
  const badges = document.querySelectorAll("[data-version-badge]");
  try {
    const response = await fetch(CHANGELOG_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(response.status);
    const releases = parseChangelog(await response.text());
    if (!releases.length) throw new Error("empty");

    badges.forEach((b) => (b.textContent = `v${releases[0].minor}`));

    if (latest) {
      latest.querySelector("[data-latest-version]").textContent = `${releases[0].version} · ${shortDate(releases[0].date)}`;
      latest.querySelector("[data-latest-summary]").textContent = GROUP_SUMMARIES[releases[0].minor] || "";
      latest.hidden = false;
    }

    if (list) {
      document.querySelector("[data-updated]").textContent = `Updated ${monthYear(releases[0].date)}`;
      list.innerHTML = groupReleases(releases).map(renderGroup).join("");
      wireUp(list);
      // The newest update starts open.
      list.querySelector(".row-toggle")?.click();
    }
  } catch {
    if (list) list.innerHTML = `<p class="muted">Couldn't load the changelog. Try refreshing.</p>`;
  }
}

if (typeof document !== "undefined") loadChangelog();
if (typeof module !== "undefined") module.exports = { parseChangelog, groupReleases, splitItem };
