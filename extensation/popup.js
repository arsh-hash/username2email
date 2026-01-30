const select = document.getElementById("filterMode");

// Load saved mode
chrome.storage.sync.get(["filterMode"], (res) => {
  select.value = res.filterMode || "none";
});

// Save mode on change
select.addEventListener("change", () => {
  chrome.storage.sync.set({ filterMode: select.value });
});
