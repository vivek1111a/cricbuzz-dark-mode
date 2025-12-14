// let darkModeCSSContent: string | null = null;
// let cssLoadPromise: Promise<string> | null = null;

// // Function to load dark mode CSS content (with caching and promise reuse)
// async function loadDarkModeCSS(): Promise<string> {
//   if (darkModeCSSContent) {
//     return darkModeCSSContent;
//   }

//   // If already loading, return the existing promise
//   if (cssLoadPromise) {
//     return cssLoadPromise;
//   }

//   cssLoadPromise = (async () => {
//     try {
//       const cssUrl = chrome.runtime.getURL("darkmode.css");
//       const response = await fetch(cssUrl);
//       const content = await response.text();
//       darkModeCSSContent = content;
//       return content;
//     } catch (error) {
//       console.error("Error loading darkmode.css:", error);
//       return "";
//     } finally {
//       cssLoadPromise = null;
//     }
//   })();

//   return cssLoadPromise;
// }

// // Function to inject dark mode CSS
// async function injectDarkModeCSS() {
//   if (!document.getElementById("darkModeStyles")) {
//     const cssContent = await loadDarkModeCSS();

//     if (cssContent) {
//       const style = document.createElement("style");
//       style.id = "darkModeStyles";
//       style.textContent = cssContent;
//       document.head.appendChild(style);
//     }
//   }
// }

// // Function to remove dark mode CSS
// function removeDarkModeCSS() {
//   const darkStyles = document.getElementById("darkModeStyles");
//   if (darkStyles) {
//     darkStyles.remove();
//   }
// }

// // Optimize: Start loading CSS immediately while checking storage in parallel
// // This reduces the delay when dark mode is enabled
// const storageCheck = new Promise<boolean>((resolve) => {
//   chrome.storage.local.get("darkModeEnabled", (data) => {
//     resolve(data.darkModeEnabled ?? false);
//   });
// });

// // Pre-load CSS in parallel with storage check
// const cssPreload = loadDarkModeCSS();

// // Apply dark mode based on storage, but CSS is already loading
// Promise.all([storageCheck, cssPreload]).then(([isEnabled]) => {
//   if (isEnabled) {
//     // CSS is already loaded, inject immediately
//     injectDarkModeCSS();
//   } else {
//     removeDarkModeCSS();
//   }
// });

// // Listen for messages to toggle dark mode
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.darkModeEnabled) {
//     injectDarkModeCSS().then(() => {
//       sendResponse({ status: "done" });
//     });
//   } else {
//     removeDarkModeCSS();
//     sendResponse({ status: "done" });
//   }

//   return true; // Keep the message channel open for async response
// });

// // Listen for changes in local storage
// chrome.storage.onChanged.addListener((changes, areaName) => {
//   // Only listen to local storage changes
//   if (areaName === "local" && changes.darkModeEnabled) {
//     const darkModeEnabled = changes.darkModeEnabled.newValue;
//     if (darkModeEnabled) {
//       injectDarkModeCSS();
//     } else {
//       removeDarkModeCSS();
//     }
//   }
// });

//when url changes give message to background script to inject dark mode css
chrome.runtime.sendMessage({ action: 'urlchanged' });

//styling finishes here

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

// Function to escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Function to create picture-in-picture popup using documentPictureInPicture API
async function sendPipPopupRequest(matchCard: Element): Promise<void> {
  const matchLink = matchCard.querySelector('a[href*="/live-cricket-scores/"], a[href*="/cricket-scores/"]') as HTMLAnchorElement;
  if (!matchLink) return;
  
  const matchUrl = matchLink.href;
  const matchTitle = matchLink.getAttribute('title') || 'Match Details';
  
  // Extract match information more accurately
  const teamElements = Array.from(matchCard.querySelectorAll('.flex.items-center.gap-2'));
  const scoreElements = Array.from(matchCard.querySelectorAll('.font-medium'));
  
  // Get team names (text after flag images)
  const team1Info = teamElements[0]?.textContent?.trim().replace(/\s+/g, ' ') || '';
  const team1Score = scoreElements[0]?.textContent?.trim() || '';
  const team2Info = teamElements[1]?.textContent?.trim().replace(/\s+/g, ' ') || '';
  const team2Score = scoreElements[1]?.textContent?.trim() || '';
  
  // Get match status
  const statusElement = matchCard.querySelector('.text-cbLive, .text-cbPreview, .text-cbComplete, [class*="text-cb"]');
  const matchStatus = statusElement?.textContent?.trim() || '';
  
  // Check if documentPictureInPicture API is available
  if (!('documentPictureInPicture' in window)) {
    // Fallback to background script if API not available
    chrome.runtime.sendMessage({
      action: 'createPipPopup',
      matchData: {
        matchTitle,
        team1Info,
        team1Score,
        team2Info,
        team2Score,
        matchStatus,
        matchUrl
      }
    });
    return;
  }
  
  try {
    // Request PiP window using documentPictureInPicture API
    const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
      width: 320,
      height: 250
    });
    
    // Set up the PiP window content
    pipWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 320px;
      height: 250px;
      margin: 0;
      padding: 0;
      background-color: #424242;
      font-family: Arial, sans-serif;
      overflow: hidden;
    }
    .header {
      background-color: #2a2a2a;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #555;
      border-radius: 8px 8px 0 0;
    }
    .title {
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      border-radius: 4px;
    }
    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .content {
      padding: 12px;
      color: #fff;
      font-size: 13px;
    }
    .team-row {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    .score {
      font-weight: 600;
    }
    .status {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #555;
      color: #4fc2a3;
      font-size: 11px;
    }
    .view-match-btn {
      display: block;
      margin-top: 12px;
      padding: 8px;
      background-color: #4fc2a3;
      color: #fff;
      text-align: center;
      text-decoration: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .view-match-btn:hover {
      background-color: #3fb893;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${escapeHtml(matchTitle)}</div>
    <button class="close-btn" onclick="window.close()">×</button>
  </div>
  <div class="content">
    <div class="team-row">
      <span>${escapeHtml(team1Info)}</span>
      <span class="score">${escapeHtml(team1Score)}</span>
    </div>
    <div class="team-row">
      <span>${escapeHtml(team2Info)}</span>
      <span class="score">${escapeHtml(team2Score)}</span>
    </div>
    <div class="status">${escapeHtml(matchStatus)}</div>
    <a href="${escapeHtml(matchUrl)}" target="_blank" class="view-match-btn">View Full Match →</a>
  </div>
</body>
</html>
    `);
    pipWindow.document.close();
  } catch (error) {
    console.error('Error creating PiP window:', error);
  }
}

// Function to add picture-in-picture icon to all match cards
function addPointsTableIcon() {
  // Find all match cards (shadow rounded-md divs containing match links)
  const matchCards = document.querySelectorAll('div.shadow.rounded-md');
  
  matchCards.forEach((matchCard) => {
    // Find the match link (the main <a> tag with live-cricket-scores or similar)
    const matchLink = matchCard.querySelector('a[href*="/live-cricket-scores/"], a[href*="/cricket-scores/"]') as HTMLAnchorElement;
    if (!matchLink) return;
    
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
    
    // Create clickable button with icon
    const iconButton = document.createElement('button');
    iconButton.className = 'cursor-pointer hover:underline pip-icon-link';
    iconButton.title = 'Picture in Picture';
    iconButton.style.cssText = `
      background: none;
      border: none;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    `;
    
    const icon = createPipIcon();
    iconButton.appendChild(icon);
    
    iconButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      sendPipPopupRequest(matchCard);
    };
    
    // Insert icon button at the beginning of the bottom div
    bottomDiv.insertBefore(iconButton, bottomDiv.firstChild);
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
