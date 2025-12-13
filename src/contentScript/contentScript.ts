console.log("content.js is running");

let darkModeCSSContent: string | null = null;

// Function to load dark mode CSS content
async function loadDarkModeCSS(): Promise<string> {
  if (darkModeCSSContent) {
    return darkModeCSSContent;
  }

  try {
    const cssUrl = chrome.runtime.getURL("darkmode.css");
    const response = await fetch(cssUrl);
    darkModeCSSContent = await response.text();
    console.log("Dark mode CSS loaded from file.");
    return darkModeCSSContent;
  } catch (error) {
    console.error("Error loading darkmode.css:", error);
    // Fallback: return empty string or basic styles
    return "";
  }
}

// Function to inject dark mode CSS
async function injectDarkModeCSS() {
  if (!document.getElementById("darkModeStyles")) {
    console.log("Injecting dark mode CSS...");
    const cssContent = await loadDarkModeCSS();
    
    if (cssContent) {
      const style = document.createElement("style");
      style.id = "darkModeStyles";
      style.textContent = cssContent;
      document.head.appendChild(style);
      console.log("Dark mode CSS injected.");
    }
  }
}

// Function to remove dark mode CSS
function removeDarkModeCSS() {
  const darkStyles = document.getElementById("darkModeStyles");
  if (darkStyles) {
    console.log("Removing dark mode CSS...");
    darkStyles.remove();
    console.log("Dark mode CSS removed.");
  }
}

// Check the current dark mode status on script load
chrome.storage.local.get("darkModeEnabled", (data) => {
  if (data.darkModeEnabled) {
    injectDarkModeCSS();
  } else {
    removeDarkModeCSS();
  }
});

// Listen for messages to toggle dark mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content.js:", request);

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
