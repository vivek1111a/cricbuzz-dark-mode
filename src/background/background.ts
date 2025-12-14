// Function to escape HTML to prevent XSS
function escapeHtmlForPopup(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Function to create picture-in-picture popup using Chrome Windows API
function createPipPopup(matchData: {
  matchTitle: string;
  team1Info: string;
  team1Score: string;
  team2Info: string;
  team2Score: string;
  matchStatus: string;
  matchUrl: string;
}): void {
  // Create HTML content for the popup
  const htmlContent = `
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
    <div class="title">${escapeHtmlForPopup(matchData.matchTitle)}</div>
    <button class="close-btn" onclick="window.close()">×</button>
  </div>
  <div class="content">
    <div class="team-row">
      <span>${escapeHtmlForPopup(matchData.team1Info)}</span>
      <span class="score">${escapeHtmlForPopup(matchData.team1Score)}</span>
    </div>
    <div class="team-row">
      <span>${escapeHtmlForPopup(matchData.team2Info)}</span>
      <span class="score">${escapeHtmlForPopup(matchData.team2Score)}</span>
    </div>
    <div class="status">${escapeHtmlForPopup(matchData.matchStatus)}</div>
    <a href="${escapeHtmlForPopup(matchData.matchUrl)}" target="_blank" class="view-match-btn">View Full Match →</a>
  </div>
</body>
</html>
  `;
  
  // Create data URL
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
  
  // Get current window to position popup in bottom-right
  chrome.windows.getCurrent((currentWindow) => {
    const width = 320;
    const height = 250;
    const left = (currentWindow.width || 1920) - width - 20;
    const top = (currentWindow.height || 1080) - height - 20;
    
    // Create popup window using Chrome Windows API
    // Type 'popup' creates a minimal chrome window
    chrome.windows.create({
      url: dataUrl,
      type: 'popup',
      width: width,
      height: height,
      left: left,
      top: top,
      focused: true,
      state: 'normal'
    }, (window) => {
      // Make window non-resizable by updating it
      if (window?.id) {
        chrome.windows.update(window.id, {
          width: width,
          height: height
        });
      }
    });
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createPipPopup') {
    createPipPopup(request.matchData);
    sendResponse({ status: 'success' });
  }
  return true;
});

