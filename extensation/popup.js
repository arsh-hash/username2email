const select = document.getElementById("filterMode");
const copyBtn = document.getElementById("copyBtn");
const status = document.getElementById("status");

// Load saved mode
chrome.storage.sync.get(["filterMode"], (res) => {
  select.value = res.filterMode || "none";
});

// Save mode on change
select.addEventListener("change", () => {
  chrome.storage.sync.set({ filterMode: select.value });
});

// Copy Feature logic
copyBtn.addEventListener("click", async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    // Check if tab exists and has a URL
    if (!tab || !tab.url || !tab.url.includes("mail.google.com")) {
      status.style.color = "red";
      status.innerText = "Please use on Gmail page.";
      return;
    }

    // Request filtered emails from content.js
    chrome.tabs.sendMessage(tab.id, { action: "getFilteredEmails" }, (response) => {
      // Handle potential runtime errors (like content script not loaded)
      if (chrome.runtime.lastError) {
        status.style.color = "red";
        status.innerText = "Error: Refresh Gmail and try again.";
        return;
      }

      if (response && response.emails && response.emails.length > 0) {
        const emailList = response.emails.join(", ");
        navigator.clipboard.writeText(emailList).then(() => {
          status.style.color = "green";
          status.innerText = `Copied ${response.emails.length} emails!`;
          setTimeout(() => { status.innerText = ""; }, 3000);
        });
      } else {
        status.style.color = "orange";
        status.innerText = "No filtered emails found.";
      }
    });
  } catch (err) {
    console.error(err);
    status.innerText = "An error occurred.";
  }
});