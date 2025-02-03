document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleDarkMode');
  console.log("Popup loaded, initializing toggle button...");

  // Retrieve dark mode state from local storage
  chrome.storage.local.get(['darkModeEnabled'], (result) => {
    console.log("Current dark mode state:", result.darkModeEnabled);
    toggleButton.textContent = result.darkModeEnabled ? 'Disable Dark Mode' : 'Enable Dark Mode';
  });

  toggleButton.addEventListener('click', () => {
    console.log("Toggle button clicked");
    chrome.storage.local.get(['darkModeEnabled'], (result) => {
      const darkModeEnabled = !result.darkModeEnabled;
      console.log("New dark mode state:", darkModeEnabled);
      toggleButton.textContent = darkModeEnabled ? 'Disable Dark Mode' : 'Enable Dark Mode';
      chrome.storage.local.set({ darkModeEnabled }, () => {
        console.log("Dark mode state saved:", darkModeEnabled);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
            console.error("No active tab found.");
            return;
          }

          const tabId = tabs[0].id;
          console.log("Sending message to content.js for tab ID:", tabId);

          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              files: ['content.js']
            },
            () => {
              chrome.tabs.sendMessage(tabId, { darkModeEnabled }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error("Error sending message:", chrome.runtime.lastError.message);
                } else {
                  console.log("Message sent, response:", response);
                }
              });
            }
          );
        });
      });
    });
  });
});
