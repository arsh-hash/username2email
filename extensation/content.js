// content.js
let filterMode = "none"; 
let safeMode = true;     
let scheduled = null;
let idCounter = 0;

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
  let node = img.closest("div[role='listitem']");
  if (node) return node;
  let ancestor = img.parentElement;
  for (let i = 0; i < 8 && ancestor; i++, ancestor = ancestor.parentElement) {
    if (ancestor.querySelector("[aria-label*='Press delete'], svg.afY, .akl, .afX, .af6")) {
      return ancestor;
    }
  }
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

function hideChip(chip) {
  if (!chip || chip.dataset.gpcHidden === "1") return;
  chip.dataset.gpcHidden = "1";
  chip.style.display = "none";
}

function hardRemoveChip(chip) {
  if (!chip) return;
  const id = ensureChipId(chip);
  if (!id) return;
  if (removedNodes.has(id)) return;
  const parent = chip.parentElement;
  const nextSibling = chip.nextSibling;
  removedNodes.set(id, { node: chip, parent, nextSibling });
  removeNode(chip);
}

function restoreRemovedChipById(id) {
  if (!removedNodes.has(id)) return false;
  const { node, parent, nextSibling } = removedNodes.get(id);
  if (parent && document.body.contains(parent)) {
    try {
      parent.insertBefore(node, nextSibling && parent.contains(nextSibling) ? nextSibling : null);
    } catch (e) {
      const fallback = document.querySelector("div[role='list']") || document.body;
      fallback.appendChild(node);
    }
  } else {
    const fallback = document.querySelector("div[role='list']") || document.body;
    fallback.appendChild(node);
  }
  removedNodes.delete(id);
  return true;
}

function showHiddenChip(chip) {
  if (!chip) return;
  if (chip.dataset.gpcHidden === "1") {
    chip.style.display = "";
    delete chip.dataset.gpcHidden;
  }
}

function restoreAllChips() {
  const hidden = document.querySelectorAll("[data-gpc-hidden='1']");
  hidden.forEach(el => { try { showHiddenChip(el); } catch (e) {} });
  for (const id of Array.from(removedNodes.keys())) {
    restoreRemovedChipById(id);
  }
}

function processChips() {
  try {
    if (filterMode === "none") {
      restoreAllChips();
      return;
    }
    const imgs = document.querySelectorAll('img[src*="lh3.googleusercontent.com"], img.afH');
    imgs.forEach(img => {
      const chip = findChipNode(img);
      if (!chip) return;
      const id = ensureChipId(chip);
      const src = getImgSrc(img);
      const hasPic = !isDefaultAvatar(src);

      if (filterMode === "removeNoPic" && !hasPic) {
        if (safeMode) hideChip(chip); else hardRemoveChip(chip);
      } else if (filterMode === "removeWithPic" && hasPic) {
        if (safeMode) hideChip(chip); else hardRemoveChip(chip);
      } else {
        if (chip.dataset.gpcHidden === "1") showHiddenChip(chip);
        if (removedNodes.has(id)) restoreRemovedChipById(id);
      }
    });
  } catch (err) { console.error("[GPC] Error:", err); }
}

// Message Listener for Copying Filtered Emails
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFilteredEmails") {
    let filteredEmails = [];

    // Helper function to extract email from a chip
    function extractEmailFromChip(chip) {
      const selectors = [
        '[email]',
        '[data-hovercard-id]',
        '[title*="@"]',
        'span[email]',
        'div[email]',
        '[aria-label*="@"]'
      ];

      for (const selector of selectors) {
        const el = chip.querySelector(selector);
        if (el) {
          const email = el.getAttribute('email') || 
                       el.getAttribute('data-hovercard-id') || 
                       el.getAttribute('title') ||
                       el.getAttribute('aria-label');
          if (email && email.includes('@')) {
            return email;
          }
        }
      }

      const allText = chip.innerText || chip.textContent || '';
      const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      return emailMatch ? emailMatch[0] : null;
    }

    // Get ALL chips with our tracking ID
    const allTrackedChips = document.querySelectorAll('[data-gpc-id]');
    
    allTrackedChips.forEach(chip => {
      // Only include chips that are VISIBLE (not hidden and not removed)
      const isHidden = chip.dataset.gpcHidden === "1";
      const isRemoved = removedNodes.has(chip.dataset.gpcId);
      
      // Skip if hidden or removed - these are filtered OUT
      if (isHidden || isRemoved) return;
      
      // This chip is visible, so extract its email
      const email = extractEmailFromChip(chip);
      if (email) filteredEmails.push(email);
    });

    // Clean and deduplicate emails
    const cleanedEmails = filteredEmails
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e));

    sendResponse({ emails: [...new Set(cleanedEmails)] });
  }
  return true; 
});

function scheduleProcess() {
  if (scheduled) clearTimeout(scheduled);
  scheduled = setTimeout(() => { scheduled = null; processChips(); }, 180);
}

const observer = new MutationObserver(() => scheduleProcess());
observer.observe(document.body, { childList: true, subtree: true });

chrome.storage.sync.get(["filterMode", "safeMode"], (res) => {
  filterMode = res.filterMode || "none";
  if (typeof res.safeMode !== "undefined") safeMode = !!res.safeMode;
  scheduleProcess();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.filterMode) {
    filterMode = changes.filterMode.newValue || "none";
    restoreAllChips();
    scheduleProcess();
  }
  if (changes.safeMode) {
    safeMode = !!changes.safeMode.newValue;
    restoreAllChips();
    scheduleProcess();
  }
});

document.addEventListener("input", scheduleProcess, true);
document.addEventListener("paste", scheduleProcess, true);
document.addEventListener("click", scheduleProcess, true);
scheduleProcess();