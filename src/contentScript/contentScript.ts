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

// Function to create picture-in-picture icon SVG
function createPipIcon(): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "pip-icon");
  icon.setAttribute("width", "14");
  icon.setAttribute("height", "14");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.style.display = "inline-block";
  icon.style.verticalAlign = "middle";
  icon.style.opacity = "0.8";
  
  // Create the picture-in-picture icon paths (two overlapping rectangles)
  const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect1.setAttribute("x", "2");
  rect1.setAttribute("y", "6");
  rect1.setAttribute("width", "14");
  rect1.setAttribute("height", "12");
  rect1.setAttribute("rx", "2");
  
  const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect2.setAttribute("x", "10");
  rect2.setAttribute("y", "2");
  rect2.setAttribute("width", "12");
  rect2.setAttribute("height", "10");
  rect2.setAttribute("rx", "2");
  
  icon.appendChild(rect1);
  icon.appendChild(rect2);
  
  return icon;
}

// Function to add picture-in-picture icon to all match cards
function addPointsTableIcon() {
  // Find all match cards (shadow rounded-md divs containing match links)
  const matchCards = document.querySelectorAll('div.shadow.rounded-md');
  
  matchCards.forEach((matchCard) => {
    // Find the match link (the main <a> tag with live-cricket-scores or similar)
    const matchLink = matchCard.querySelector('a[href*="/live-cricket-scores/"], a[href*="/cricket-scores/"]') as HTMLAnchorElement;
    if (!matchLink) return;
    
    const matchUrl = matchLink.href;
    
    // Find the bottom div with links (bg-neutral-300 or similar)
    let bottomDiv = matchCard.querySelector('div.bg-neutral-300, div[class*="bg-neutral"]') as HTMLElement;
    
    // If bottom div doesn't exist, create it
    if (!bottomDiv) {
      bottomDiv = document.createElement('div');
      bottomDiv.className = 'bg-neutral-300 rounded-b-md overflow-hidden dark:bg-cbHdrBkgDark dark:text-cbTxtSec flex justify-end gap-2 p-2 wb:py-1 wb:px-2 uppercase text-xxs';
      matchCard.appendChild(bottomDiv);
    }
    
    // Check if icon already exists
    if (bottomDiv.querySelector('.pip-icon-link')) return;
    
    // Create clickable link with icon
    const iconLink = document.createElement('a');
    iconLink.href = matchUrl;
    iconLink.className = 'cursor-pointer hover:underline pip-icon-link';
    iconLink.title = 'View Match';
    iconLink.style.display = 'inline-flex';
    iconLink.style.alignItems = 'center';
    iconLink.style.gap = '6px';
    
    const icon = createPipIcon();
    iconLink.appendChild(icon);
    
    // Insert icon link at the beginning of the bottom div
    bottomDiv.insertBefore(iconLink, bottomDiv.firstChild);
  });
}

// Function to observe DOM changes and add icon when Points Table link appears
function observeAndAddIcon() {
  // Try to add icon immediately if link already exists
  addPointsTableIcon();
  
  // Observe for new links being added (for dynamic content)
  const observer = new MutationObserver(() => {
    addPointsTableIcon();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Add picture-in-picture icon to Points Table link
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeAndAddIcon);
} else {
  observeAndAddIcon();
}
