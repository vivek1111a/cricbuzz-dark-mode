document.getElementById("toggleDarkMode").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: toggleDarkMode,
    });
  });
});

function toggleDarkMode() {
  if (document.body.classList.contains("dark-mode")) {
    document.body.classList.remove("dark-mode");
    const darkStyles = document.querySelector("#darkModeStyles");
    if (darkStyles) darkStyles.remove();
  } else {
    document.body.classList.add("dark-mode");
    const style = document.createElement("style");
    style.id = "darkModeStyles";
    style.textContent = `
        body { background-color: #121212 !important; color: #e0e0e0 !important; }
        header, nav, footer, .cb-nav-bar { background-color: #1e1e1e !important; }
        a { color: #bb86fc !important; }
        /* Add more selectors here */
      `;
    document.head.append(style);
  }
}
