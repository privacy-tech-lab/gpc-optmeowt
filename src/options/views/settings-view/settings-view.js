/*
settings-view script
*/

import { renderParse, fetchParse } from "../../components/util.js";

const headings = {
  title: "Settings",
  subtitle: "Adjust extension settings",
};

function eventListeners() {
    document.getElementById("settings-view-radio0").addEventListener('click', () => {
        chrome.runtime.sendMessage({ ENABLED: true });
        chrome.storage.local.set({ ENABLED: true });
    })
    document.getElementById("settings-view-radio1").addEventListener('click', () => {
        chrome.runtime.sendMessage({ ENABLED: false });
        chrome.storage.local.set({ ENABLED: false });
    })
    document.getElementById("settings-view-radio2").addEventListener('click', () => {
        chrome.runtime.sendMessage({ ENABLED: true });
        chrome.storage.local.set({ ENABLED: true });
    })
}

export async function settingsView(scaffoldTemplate) {
  const body = renderParse(scaffoldTemplate, headings, "scaffold-component");
  let content = await fetchParse(
    "./views/settings-view/settings-view.html",
    "settings-view"
  );

  document.getElementById("content").innerHTML = body.innerHTML;
  document.getElementById("scaffold-component-body").innerHTML =
    content.innerHTML;

  chrome.storage.local.get(["ENABLED"], function (result) {
      console.log(result.ENABLED)
    if (result.ENABLED == undefined) {
      chrome.storage.local.set({ ENABLED: true });
      document.getElementById("settings-view-radio0").checked = true;
    } else if (result.ENABLED) {
      document.getElementById("settings-view-radio0").checked = true;
    } else {
      document.getElementById("settings-view-radio1").checked = true;
    }
  });

  eventListeners();
}
