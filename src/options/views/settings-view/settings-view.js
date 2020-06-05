/*
settings-view script
*/

import { renderParse, fetchParse } from "../../components/util.js";
import "../../../libs/FileSaver.js-2.0.2/src/FileSaver.js";

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

function handleDownload() {
    console.log("Downloading ...");
    chrome.storage.local.get(["DOMAINS"], function (result) {
      var domains = result.DOMAINS;
      var blob = new Blob([JSON.stringify(domains, null, 4)], {type: "text/plain;charset=utf-8"});
      saveAs(blob, "whitelist_backup.txt");
    })
    console.log("Downloaded!")
}

function startUpload() {
  document.getElementById("upload-whitelist").value = ""
  document.getElementById("upload-whitelist").click()
}

function handleUpload() {
    console.log("Starting upload ...");
    const file = this.files[0];
    const fr = new FileReader();
    fr.onload = function(e) {
      chrome.storage.local.set({ DOMAINS: JSON.parse(e.target.result) });
      console.log("Finished upload!")
    };
    fr.readAsText(file);
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
    if (result.WHITELIST_ENABLED) {
      document.getElementById("settings-view-radio2").checked = true;
    }
  });

  eventListeners();
}
