import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./popup.css";

interface DarkModeState {
  darkModeEnabled: boolean;
  isLoading: boolean;
}

const App: React.FC<{}> = () => {
  const [state, setState] = useState<DarkModeState>({
    darkModeEnabled: false,
    isLoading: true,
  });

  // Load dark mode state from storage on mount
  useEffect(() => {
    chrome.storage.local.get(["darkModeEnabled"], (result) => {
      const darkModeEnabled = result.darkModeEnabled ?? false;
      setState({
        darkModeEnabled,
        isLoading: false,
      });
    });
  }, []);

  const handleToggleDarkMode = () => {
    const newDarkModeState = !state.darkModeEnabled;

    // Update local state immediately for better UX
    setState((prev) => ({
      ...prev,
      darkModeEnabled: newDarkModeState,
    }));

    // Save to storage
    chrome.storage.local.set({ darkModeEnabled: newDarkModeState }, () => {
      // Get active tab and apply dark mode
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0 || !tabs[0].id) {
          return;
        }

        const tabId = tabs[0].id;

        // Check if the tab is a cricbuzz page
        if (tabs[0].url && tabs[0].url.includes("cricbuzz.com")) {
          // Execute content script if needed
          chrome.scripting.executeScript(
            {
              target: { tabId },
              files: ["contentScript.js"],
            },
            () => {
              // Send message to content script
              chrome.tabs.sendMessage(tabId, {
                darkModeEnabled: newDarkModeState,
              });
            }
          );
        }
      });
    });
  };

  return (
    <div className={`popup_body ${state.darkModeEnabled ? "dark" : ""}`}>
      <div className="popup_header">
        <h1>Cricbuzz Dark Mode</h1>
      </div>
      <div className="popup_content">
        <button
          id="toggleDarkMode"
          className={`toggle-button ${
            state.darkModeEnabled ? "dark-mode" : "light-mode"
          }`}
          onClick={handleToggleDarkMode}
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <span>Loading...</span>
          ) : (
            <>
              <span className="icon-wrapper">
                {state.darkModeEnabled ? (
                  <svg
                    className="icon moon-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg
                    className="icon sun-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </span>
              <span className="button-text">
                {state.darkModeEnabled
                  ? "Disable Dark Mode"
                  : "Enable Dark Mode"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(<App />, root);
