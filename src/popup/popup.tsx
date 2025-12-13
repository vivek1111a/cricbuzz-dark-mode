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
      console.log("Current dark mode state:", darkModeEnabled);
      setState({
        darkModeEnabled,
        isLoading: false,
      });
    });
  }, []);

  const handleToggleDarkMode = () => {
    const newDarkModeState = !state.darkModeEnabled;
    console.log("Toggling dark mode to:", newDarkModeState);

    // Update local state immediately for better UX
    setState((prev) => ({
      ...prev,
      darkModeEnabled: newDarkModeState,
    }));

    // Save to storage
    chrome.storage.local.set({ darkModeEnabled: newDarkModeState }, () => {
      console.log("Dark mode state saved:", newDarkModeState);

      // Get active tab and apply dark mode
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0 || !tabs[0].id) {
          console.error("No active tab found.");
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
              chrome.tabs.sendMessage(
                tabId,
                { darkModeEnabled: newDarkModeState },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      "Error sending message:",
                      chrome.runtime.lastError.message
                    );
                  } else {
                    console.log("Message sent, response:", response);
                  }
                }
              );
            }
          );
        } else {
          console.log("Not a Cricbuzz page, skipping dark mode toggle");
        }
      });
    });
  };

  return (
    <div className="popup_body">
      <div className="popup_header">
        <h1>Cricbuzz Dark Mode</h1>
      </div>
      <div className="popup_content">
        <button
          id="toggleDarkMode"
          className="toggle-button"
          onClick={handleToggleDarkMode}
          disabled={state.isLoading}
        >
          {state.isLoading
            ? "Loading..."
            : state.darkModeEnabled
            ? "Disable Dark Mode"
            : "Enable Dark Mode"}
        </button>
      </div>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(<App />, root);
