// content.js
// Combined robust chip detection + 3-mode filtering + safe-mode hide (default)

let filterMode = "none"; // "none" | "removeNoPic" | "removeWithPic"
let safeMode = true;     // true => hide chips (safe). false => hard remove.
let scheduled = null;
let idCounter = 0;

// store removed nodes so we can restore them if needed
const removedNodes = new Map(); // id -> { node, parent, nextSibling }

function getImgSrc(img) {
  if (!img) return "";
  return img.src || img.getAttribute("data-src") || img.getAttribute("data-preload-src") || img.getAttribute("data-backup-src") || "";
}

function isDefaultAvatar(src) {
  if (!src) return true;
  return /default-user/i.test(src);
}

function findChipNode(img) {
  if (!img) return null;

  // try role=listitem (common)
  let node = img.closest("div[role='listitem']");
  if (node) return node;

  // climb ancestors and look for delete control or name span (best-effort)
  let ancestor = img.parentElement;
  for (let i = 0; i < 8 && ancestor; i++, ancestor = ancestor.parentElement) {
    if (ancestor.querySelector("[aria-label*='Press delete'], svg.afY, .akl, .afX, .af6")) {
      return ancestor;
    }
  }

  // fallback: go a few levels up
  ancestor = img;
  for (let j = 0; j < 4; j++) ancestor = ancestor.parentElement || ancestor;
  return ancestor || null;
}

function ensureChipId(chip) {
  if (!chip) return null;
  if (!chip.dataset.gpcId) chip.dataset.gpcId = `gpc-${++idCounter}`;
  return chip.dataset.gpcId;
}

function removeNode(node) {
  if (!node) return;
  if (node.remove) node.remove();
  else if (node.parentNode) node.parentNode.removeChild(node);
}

// Hide (safe) - keep node in DOM but hidden
function hideChip(chip) {
  if (!chip || chip.dataset.gpcHidden === "1") return;
  chip.dataset.gpcHidden = "1";
  chip.style.display = "none";
  console.log("[GPC] HIDED chip:", chip.innerText?.trim?.() || "<no text>");
}

// Hard remove (store so we can restore later)
function hardRemoveChip(chip) {
  if (!chip) return;
  const id = ensureChipId(chip);
  if (!id) return;
  if (removedNodes.has(id)) return; // already removed

  const parent = chip.parentElement;
  const nextSibling = chip.nextSibling;
  // store the node reference BEFORE removal
  removedNodes.set(id, { node: chip, parent, nextSibling });
  removeNode(chip);
  console.log("[GPC] REMOVED chip (hard):", id);
}

// Attempt to restore a previously removed chip (hard remove case)
function restoreRemovedChipById(id) {
  if (!removedNodes.has(id)) return false;
  const { node, parent, nextSibling } = removedNodes.get(id);

  // prefer original parent if it still exists in DOM
  if (parent && document.body.contains(parent)) {
    try {
      parent.insertBefore(node, nextSibling && parent.contains(nextSibling) ? nextSibling : null);
      console.log("[GPC] Restored removed chip into original parent:", id);
    } catch (e) {
      // fallback to appending to a discovered container
      const fallback = document.querySelector("div[role='list']") || document.body;
      fallback.appendChild(node);
      console.log("[GPC] Restored removed chip into fallback container:", id);
    }
  } else {
    const fallback = document.querySelector("div[role='list']") || document.body;
    fallback.appendChild(node);
    console.log("[GPC] Restored removed chip into fallback container:", id);
  }

  removedNodes.delete(id);
  return true;
}

// Show (unhide) previously hidden chips
function showHiddenChip(chip) {
  if (!chip) return;
  if (chip.dataset.gpcHidden === "1") {
    chip.style.display = "";
    delete chip.dataset.gpcHidden;
    console.log("[GPC] Restored hidden chip:", chip.innerText?.trim?.() || "<no text>");
  }
}

// Restore all hidden & removed chips (used when filterMode -> "none")
function restoreAllChips() {
  // 1) Restore hidden ones (still in DOM)
  const hidden = document.querySelectorAll("[data-gpc-hidden='1']");
  hidden.forEach(el => {
    try { showHiddenChip(el); } catch (e) { /* ignore */ }
  });

  // 2) Restore hard-removed ones
  for (const id of Array.from(removedNodes.keys())) {
    restoreRemovedChipById(id);
  }
}

// Core processing: scans avatar images and hides/removes chips according to mode
function processChips() {
  try {
    // If in "none" mode just restore everything and exit
    if (filterMode === "none") {
      restoreAllChips();
      return;
    }

    // select likely avatar images (covers lazy attributes & Gmail classes)
    const imgs = document.querySelectorAll('img[src*="lh3.googleusercontent.com"], img.afH');

    imgs.forEach(img => {
      // find chip node
      const chip = findChipNode(img);
      if (!chip) return;

      const id = ensureChipId(chip);
      const src = getImgSrc(img);
      const hasPic = !isDefaultAvatar(src);

      // Decide action based on current mode
      if (filterMode === "removeNoPic" && !hasPic) {
        if (safeMode) hideChip(chip);
        else hardRemoveChip(chip);
      } else if (filterMode === "removeWithPic" && hasPic) {
        if (safeMode) hideChip(chip);
        else hardRemoveChip(chip);
      } else {
        // This chip should be visible — make sure it's restored if previously hidden or removed
        // 1) If hidden in DOM, show it
        if (chip.dataset.gpcHidden === "1") {
          showHiddenChip(chip);
        }
        // 2) If previously hard-removed, try to restore it
        if (removedNodes.has(id)) {
          restoreRemovedChipById(id);
        }
      }
    });
  } catch (err) {
    console.error("[GPC] processChips error:", err);
  }
}

function scheduleProcess() {
  if (scheduled) clearTimeout(scheduled);
  scheduled = setTimeout(() => {
    scheduled = null;
    processChips();
  }, 180); // small debounce
}

// Observe DOM changes (Gmail renders dynamically)
const observer = new MutationObserver(() => scheduleProcess());
observer.observe(document.body, { childList: true, subtree: true });

// Keep filterMode (and safeMode if present) in sync with storage
chrome.storage.sync.get(["filterMode", "safeMode"], (res) => {
  filterMode = res.filterMode || "none";
  // if popup later provides safeMode it will be used; otherwise default true
  if (typeof res.safeMode !== "undefined") safeMode = !!res.safeMode;
  scheduleProcess();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.filterMode) {
    const newMode = changes.filterMode.newValue;
    console.log("[GPC] filterMode changed ->", newMode);
    filterMode = newMode || "none";

    // If switching to 'none' restore everything first
    if (filterMode === "none") {
      restoreAllChips();
      scheduleProcess();
      return;
    }

    // otherwise ensure removed/hidden nodes are restored and re-evaluated
    restoreAllChips();
    scheduleProcess();
  }
  if (changes.safeMode) {
    safeMode = !!changes.safeMode.newValue;
    console.log("[GPC] safeMode changed ->", safeMode);
    // if safeMode changed we should restore and re-apply
    restoreAllChips();
    scheduleProcess();
  }
});

// Extra triggers to catch user input events
document.addEventListener("input", scheduleProcess, true);
document.addEventListener("paste", scheduleProcess, true);
document.addEventListener("click", scheduleProcess, true);

// initial run
scheduleProcess();
