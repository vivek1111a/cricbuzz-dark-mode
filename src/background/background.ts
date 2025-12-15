chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    // Replace this URL with your actual Google Form URL
    // Format: https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?usp=pp_url&entry.XXXXXXX=uninstall
    const feedbackFormUrl = 'https://forms.gle/AzNusBzfSDD4pmFm6';
    
    chrome.runtime.setUninstallURL(feedbackFormUrl, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting uninstall URL:', chrome.runtime.lastError);
      } else {
        console.log('Uninstall feedback URL set successfully');
      }
    });
  }
});



// find all tabs with cricbuzz.com in the url
const getTabIds = (): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ url: "https://www.cricbuzz.com/*" }, (tabs) => {
      resolve(tabs.map((tab) => tab.id));
    });
  });
}

// inject dark mode css into the tabs
const injectDarkModeCSS = (tabId: number) => {
  // Load CSS content and inject as a style tag we can easily remove
  fetch(chrome.runtime.getURL('darkmode.css'))
    .then(response => response.text())
    .then(cssContent => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (css: string) => {
          // Remove existing dark mode style if present
          const existing = document.getElementById('cricbuzz-dark-mode-style');
          if (existing) {
            existing.remove();
          }
          // Inject new style tag
          const style = document.createElement('style');
          style.id = 'cricbuzz-dark-mode-style';
          style.textContent = css;
          document.head.appendChild(style);
        },
        args: [cssContent]
      } as any);
    })
    .catch(error => {
      console.error('Failed to load darkmode.css:', error);
      // Fallback to insertCSS if fetch fails
      chrome.scripting.insertCSS({ target: { tabId: tabId }, files: ["darkmode.css"] });
    });
};

const removeDarkModeCSS = (tabId: number) => {
  // Remove the style tag by ID - this is more reliable than removeCSS
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      const styleElement = document.getElementById('cricbuzz-dark-mode-style');
      if (styleElement) {
        styleElement.remove();
      }
    }
  } as any);
};




chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'injectDarkModeCSS') {
    injectDarkModeCSS(request.tabId);
    sendResponse({ status: 'success' });
  }
  return true;
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'removeDarkModeCSS') {
    removeDarkModeCSS(request.tabId);
    sendResponse({ status: 'success' });
  }
  return true;
});
//look for changes in local storage for darkModeEnabled
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.darkModeEnabled) {
    const darkModeEnabled = changes.darkModeEnabled.newValue;
    if (darkModeEnabled) {
      const tabIds = await getTabIds();
      tabIds.forEach((tabId) => {
        injectDarkModeCSS(tabId);
      });
    } else {
      const tabIds = await getTabIds();
      tabIds.forEach((tabId) => {
        removeDarkModeCSS(tabId);
      });
    }
  }
});

const getDarkModeEnabled = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("darkModeEnabled", (result) => {
      resolve(result.darkModeEnabled ?? false);
    });
  });
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'urlchanged') {
    if (await getDarkModeEnabled()) {
    const tabIds = await getTabIds();
    tabIds.forEach((tabId) => {
      injectDarkModeCSS(tabId);
    });
  }
  }
  return true;
});

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

// Function to create picture-in-picture popup using Chrome Windows API (fallback)
function createPipPopup(matchData: any): void {
  const batterRows = (matchData.batters || []).map((b: any) => `
    <tr>
      <td class="batter-name">${escapeHtmlForPopup(b.name || '')}</td>
      <td class="batter-runs">${escapeHtmlForPopup(b.runs || '0')}</td>
      <td class="batter-balls">${escapeHtmlForPopup(b.balls || '0')}</td>
      <td class="batter-fours">${escapeHtmlForPopup(b.fours || '0')}</td>
      <td class="batter-sixes">${escapeHtmlForPopup(b.sixes || '0')}</td>
      <td class="batter-sr">${escapeHtmlForPopup(b.sr || '0')}</td>
    </tr>
  `).join('');
  
  const bowlerRows = (matchData.bowlers || []).map((b: any) => `
    <tr>
      <td class="bowler-name">${escapeHtmlForPopup(b.name || '')}</td>
      <td class="bowler-overs">${escapeHtmlForPopup(b.overs || '0')}</td>
      <td class="bowler-runs">${escapeHtmlForPopup(b.runs || '0')}</td>
      <td class="bowler-wickets">${escapeHtmlForPopup(b.wickets || '0')}</td>
      <td class="bowler-economy">${escapeHtmlForPopup(b.economy || '0')}</td>
    </tr>
  `).join('');
  
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
      width: 420px;
      height: 500px;
      margin: 0;
      padding: 0;
      background-color: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      overflow-y: auto;
      color: #fff;
    }
    .header {
      background-color: #2a2a2a;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #444;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .title {
      color: #fff;
      font-size: 13px;
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
      margin-left: 8px;
    }
    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .content {
      padding: 12px;
    }
    .score-section {
      background-color: #2a2a2a;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #444;
    }
    .team-row:last-child {
      border-bottom: none;
    }
    .team-name {
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    }
    .team-score {
      font-size: 16px;
      font-weight: 600;
      color: #4fc2a3;
    }
    .status {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #444;
      color: #4fc2a3;
      font-size: 12px;
      font-weight: 500;
    }
    .rates {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 11px;
      color: #aaa;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #4fc2a3;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: #2a2a2a;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    thead {
      background-color: #333;
    }
    th {
      padding: 8px 6px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #aaa;
      text-transform: uppercase;
    }
    td {
      padding: 6px;
      font-size: 11px;
      border-bottom: 1px solid #333;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .batter-name, .bowler-name {
      color: #4fc2a3;
      font-weight: 500;
    }
    .batter-runs, .bowler-wickets {
      color: #fff;
      font-weight: 600;
    }
    .view-match-btn {
      display: block;
      margin-top: 12px;
      padding: 10px;
      background-color: #4fc2a3;
      color: #fff;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    .view-match-btn:hover {
      background-color: #3fb893;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${escapeHtmlForPopup(matchData.matchTitle || 'Match Details')}</div>
    <button class="close-btn" onclick="window.close()">×</button>
  </div>
  <div class="content">
    <div class="score-section">
      <div class="team-row">
        <span class="team-name">${escapeHtmlForPopup(matchData.team1Name || 'Team 1')}</span>
        <span class="team-score">${escapeHtmlForPopup(matchData.team1Score || '0')}</span>
      </div>
      <div class="team-row">
        <span class="team-name">${escapeHtmlForPopup(matchData.team2Name || 'Team 2')}</span>
        <span class="team-score">${escapeHtmlForPopup(matchData.team2Score || '0')}</span>
      </div>
      ${matchData.matchStatus ? `<div class="status">${escapeHtmlForPopup(matchData.matchStatus)}</div>` : ''}
      ${matchData.crr || matchData.req ? `
        <div class="rates">
          ${matchData.crr ? `<span>CRR: ${escapeHtmlForPopup(matchData.crr)}</span>` : ''}
          ${matchData.req ? `<span>REQ: ${escapeHtmlForPopup(matchData.req)}</span>` : ''}
        </div>
      ` : ''}
    </div>
    
    ${matchData.batters && matchData.batters.length > 0 ? `
      <div class="section-title">Batters</div>
      <table>
        <thead>
          <tr>
            <th>Batter</th>
            <th>R</th>
            <th>B</th>
            <th>4s</th>
            <th>6s</th>
            <th>SR</th>
          </tr>
        </thead>
        <tbody>
          ${batterRows}
        </tbody>
      </table>
    ` : ''}
    
    ${matchData.bowlers && matchData.bowlers.length > 0 ? `
      <div class="section-title">Bowlers</div>
      <table>
        <thead>
          <tr>
            <th>Bowler</th>
            <th>O</th>
            <th>R</th>
            <th>W</th>
            <th>Eco</th>
          </tr>
        </thead>
        <tbody>
          ${bowlerRows}
        </tbody>
      </table>
    ` : ''}
    
    <a href="${escapeHtmlForPopup(matchData.matchUrl || '')}" target="_blank" class="view-match-btn">View Full Match →</a>
  </div>
</body>
</html>
  `;
  
  // Create data URL
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
  
  // Get current window to position popup in bottom-right
  chrome.windows.getCurrent((currentWindow) => {
    const width = 420;
    const height = 500;
    const left = (currentWindow.width || 1920) - width - 20;
    const top = (currentWindow.height || 1080) - height - 20;
    
    // Create popup window using Chrome Windows API
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
  } else if (request.action === 'openMatchPageAndExtract') {
    // Open match page and extract data
    chrome.tabs.create({ url: request.matchUrl }, async (tab) => {
      if (!tab.id) {
        sendResponse({ status: 'error', message: 'Failed to open tab' });
        return;
      }
      
      // Wait for page to load
      const checkPageLoaded = () => {
        return new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            chrome.tabs.get(tab.id!, (updatedTab) => {
              if (updatedTab.status === 'complete') {
                clearInterval(checkInterval);
                resolve();
              }
            });
          }, 100);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 10000);
        });
      };
      
      await checkPageLoaded();
      
      // Extract data from the match page - define function inline
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const doc = document;
          const titleElement = doc.querySelector('h1') || doc.querySelector('title');
          const matchTitle = titleElement?.textContent?.trim() || 'Match Details';
          
          let team1Name = '';
          let team1Score = '';
          let team2Name = '';
          let team2Score = '';
          let matchStatus = '';
          let crr = '';
          let req = '';
          
          const miniscoreContainer = doc.querySelector('#miniscore-branding-container');
          if (miniscoreContainer) {
            const team1Row = miniscoreContainer.querySelector('.flex.flex-row.font-light.text-base.text-gray-600');
            if (team1Row) {
              const team1NameEl = team1Row.querySelector('div:first-child');
              const team1ScoreEl = team1Row.querySelector('div:last-child');
              team1Name = team1NameEl?.textContent?.trim() || '';
              team1Score = team1ScoreEl?.textContent?.trim().replace(/\s+/g, ' ') || '';
            }
            
            const team2Row = miniscoreContainer.querySelector('.flex.flex-row.font-bold.text-xl');
            if (team2Row) {
              const team2NameEl = team2Row.querySelector('div:first-child');
              const team2ScoreEl = team2Row.querySelector('div:nth-child(2)');
              team2Name = team2NameEl?.textContent?.trim() || '';
              team2Score = team2ScoreEl?.textContent?.trim().replace(/\s+/g, ' ') || '';
              
              const team2Text = team2Row.textContent || '';
              const crrMatch = team2Text.match(/CRR[:\s]*(\d+\.\d+)/i);
              const reqMatch = team2Text.match(/REQ[:\s]*(\d+\.\d+)/i);
              if (crrMatch) crr = `CRR: ${crrMatch[1]}`;
              if (reqMatch) req = `REQ: ${reqMatch[1]}`;
            }
            
            const statusEl = miniscoreContainer.querySelector('.text-cbTxtLive');
            if (statusEl) {
              matchStatus = statusEl.textContent?.trim() || '';
            }
          }
          
          const batters: any[] = [];
          const allGridSections = doc.querySelectorAll('.scorecard-bat-grid');
          let inBatterSection = false;
          
          allGridSections.forEach((section) => {
            const sectionText = section.textContent || '';
            if (sectionText.includes('Batter') && sectionText.includes('R') && sectionText.includes('B')) {
              inBatterSection = true;
              return;
            }
            if (sectionText.includes('Bowler')) {
              inBatterSection = false;
              return;
            }
            if (inBatterSection && section.querySelector('a[href*="/profiles/"]') && batters.length < 2) {
              const divs = Array.from(section.children);
              if (divs.length >= 6) {
                const nameEl = section.querySelector('a[href*="/profiles/"]');
                const name = nameEl?.textContent?.trim().replace(/\s*\*\s*/, '') || '';
                const runs = divs[1]?.textContent?.trim() || '0';
                const balls = divs[2]?.textContent?.trim() || '0';
                const fours = divs[3]?.textContent?.trim() || '0';
                const sixes = divs[4]?.textContent?.trim() || '0';
                const sr = divs[5]?.textContent?.trim() || '0';
                if (name && name.length > 0) {
                  batters.push({ name, runs, balls, fours, sixes, sr });
                }
              }
            }
          });
          
          const bowlers: any[] = [];
          let inBowlerSection = false;
          
          allGridSections.forEach((section) => {
            const sectionText = section.textContent || '';
            if (sectionText.includes('Bowler') && sectionText.includes('O') && sectionText.includes('M')) {
              inBowlerSection = true;
              return;
            }
            if (inBowlerSection && section.querySelector('a[href*="/profiles/"]') && bowlers.length < 2) {
              const divs = Array.from(section.children);
              if (divs.length >= 6) {
                const nameEl = section.querySelector('a[href*="/profiles/"]');
                const name = nameEl?.textContent?.trim().replace(/\s*\*\s*/, '') || '';
                const overs = divs[1]?.textContent?.trim() || '0';
                const runs = divs[3]?.textContent?.trim() || '0';
                const wickets = divs[4]?.textContent?.trim() || '0';
                const economy = divs[5]?.textContent?.trim() || '0';
                if (name && name.length > 0) {
                  bowlers.push({ name, overs, runs, wickets, economy });
                }
              }
            }
          });
          
          return {
            matchTitle,
            team1Name: team1Name || 'Team 1',
            team1Score: team1Score || '0',
            team2Name: team2Name || 'Team 2',
            team2Score: team2Score || '0',
            matchStatus: matchStatus || 'Match in progress',
            batters: batters.length > 0 ? batters : [],
            bowlers: bowlers.length > 0 ? bowlers : [],
            crr,
            req,
            matchUrl: window.location.href
          };
        }
      } as any, (results) => {
        if (results && results[0] && results[0].result) {
          const matchData = results[0].result;
          createPipPopup(matchData);
          sendResponse({ status: 'success' });
        } else {
          sendResponse({ status: 'error', message: 'Failed to extract data' });
        }
      });
    });
    return true; // Keep channel open for async response
  }
  return true;
});



