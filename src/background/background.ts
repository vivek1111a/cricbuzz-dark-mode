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



