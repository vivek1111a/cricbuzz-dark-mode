let darkModeCSSContent: string | null = null;
let cssLoadPromise: Promise<string> | null = null;

// Function to load dark mode CSS content (with caching and promise reuse)
async function loadDarkModeCSS(): Promise<string> {
  if (darkModeCSSContent) {
    return darkModeCSSContent;
  }

  // If already loading, return the existing promise
  if (cssLoadPromise) {
    return cssLoadPromise;
  }

  cssLoadPromise = (async () => {
    try {
      const cssUrl = chrome.runtime.getURL("darkmode.css");
      const response = await fetch(cssUrl);
      const content = await response.text();
      darkModeCSSContent = content;
      return content;
    } catch (error) {
      console.error("Error loading darkmode.css:", error);
      return "";
    } finally {
      cssLoadPromise = null;
    }
  })();

  return cssLoadPromise;
}

// Function to inject dark mode CSS
async function injectDarkModeCSS() {
  if (!document.getElementById("darkModeStyles")) {
    const cssContent = await loadDarkModeCSS();
    
    if (cssContent) {
      const style = document.createElement("style");
      style.id = "darkModeStyles";
      style.textContent = cssContent;
      document.head.appendChild(style);
    }
  }
}

// Function to remove dark mode CSS
function removeDarkModeCSS() {
  const darkStyles = document.getElementById("darkModeStyles");
  if (darkStyles) {
    darkStyles.remove();
  }
}

// Optimize: Start loading CSS immediately while checking storage in parallel
// This reduces the delay when dark mode is enabled
const storageCheck = new Promise<boolean>((resolve) => {
  chrome.storage.local.get("darkModeEnabled", (data) => {
    resolve(data.darkModeEnabled ?? false);
  });
});

// Pre-load CSS in parallel with storage check
const cssPreload = loadDarkModeCSS();

// Apply dark mode based on storage, but CSS is already loading
Promise.all([storageCheck, cssPreload]).then(([isEnabled]) => {
  if (isEnabled) {
    // CSS is already loaded, inject immediately
    injectDarkModeCSS();
  } else {
    removeDarkModeCSS();
  }
});

// Listen for messages to toggle dark mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.darkModeEnabled) {
    injectDarkModeCSS().then(() => {
      sendResponse({ status: "done" });
    });
  } else {
    removeDarkModeCSS();
    sendResponse({ status: "done" });
  }

  return true; // Keep the message channel open for async response
});

// Listen for changes in local storage
chrome.storage.onChanged.addListener((changes, areaName) => {
  // Only listen to local storage changes
  if (areaName === "local" && changes.darkModeEnabled) {
    const darkModeEnabled = changes.darkModeEnabled.newValue;
    if (darkModeEnabled) {
      injectDarkModeCSS();
    } else {
      removeDarkModeCSS();
    }
  }
});