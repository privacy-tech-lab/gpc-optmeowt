/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
settings-view.js
================================================================================
settings-view.js loads settings-view.html when clicked on the options page
*/


import { renderParse, fetchParse } from "../../components/util.js";
import { handleDownload, startUpload, handleUpload } from "../../../whitelist.js";
import { darkSwitchFunction } from "../../../libs/dark-mode-switch-1.0.0/dark-mode-switch.js"
import "../../../libs/FileSaver.js-2.0.2/src/FileSaver.js"

const headings = {
  title: "Settings",
  subtitle: "Adjust extension settings",
};

function eventListeners() {
    document.getElementById("settings-view-radio0").addEventListener('click', () => {
        chrome.runtime.sendMessage({ ENABLED: true, WHITELIST_ENABLED: false });
        chrome.storage.local.set({ ENABLED: true, WHITELIST_ENABLED: false });
    })
    document.getElementById("settings-view-radio1").addEventListener('click', () => {
        chrome.runtime.sendMessage({ ENABLED: false, WHITELIST_ENABLED: false });
        chrome.storage.local.set({ ENABLED: false, WHITELIST_ENABLED: false });
    })
    document.getElementById("settings-view-radio2").addEventListener('click', () => {
        chrome.runtime.sendMessage({ ENABLED: true, WHITELIST_ENABLED: true });
        chrome.storage.local.set({ ENABLED: true, WHITELIST_ENABLED: true });
    })
    document.getElementById("download-button").addEventListener('click', handleDownload)
    document.getElementById("upload-button").addEventListener('click', startUpload)
    document.getElementById("upload-whitelist").addEventListener('change', handleUpload, false)
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

  darkSwitchFunction();

  chrome.storage.local.get(["ENABLED", "WHITELIST_ENABLED"], function (result) {
      console.log(result.ENABLED)
    if (result.ENABLED == undefined) {
      chrome.storage.local.set({ ENABLED: true });
      document.getElementById("settings-view-radio0").checked = true;
    } else if (result.ENABLED) {
      document.getElementById("settings-view-radio0").checked = true;
    } else {
      document.getElementById("settings-view-radio1").checked = true;
    }
    if (result.WHITELIST_ENABLED) {
      document.getElementById("settings-view-radio2").checked = true;
    }
  });

  eventListeners();
}
