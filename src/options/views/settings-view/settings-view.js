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
import {
  handleDownload,
  startUpload,
  handleUpload,
} from "../../../domainlist.js";
import { darkSwitchFunction } from "../../../libs/dark-mode-switch-1.0.0/dark-mode-switch.js";
import "../../../libs/FileSaver.js-2.0.2/src/FileSaver.js";

/**
 * @typedef headings
 * @property {string} headings.title - Title of the given page
 * @property {string} headings.subtitle - Subtitle of the given page
 */
const headings = {
  title: "Settings",
  subtitle: "Adjust extension settings",
};

/**
 * Creates the event listeners for the `Settings` page buttons and options
 */
function eventListeners() {
  document
    .getElementById("settings-view-radio0")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ ENABLED: true, DOMAINLIST_ENABLED: false });
      chrome.storage.local.set({ ENABLED: true, DOMAINLIST_ENABLED: false });
    });
  document
    .getElementById("settings-view-radio1")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ ENABLED: false, DOMAINLIST_ENABLED: false });
      chrome.storage.local.set({ ENABLED: false, DOMAINLIST_ENABLED: false });
    });
  document
    .getElementById("settings-view-radio2")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ ENABLED: true, DOMAINLIST_ENABLED: true });
      chrome.storage.local.set({ ENABLED: true, DOMAINLIST_ENABLED: true });
    });
  document
    .getElementById("download-button")
    .addEventListener("click", handleDownload);
  document.getElementById("upload-button").addEventListener("click", () => {
    const verify = confirm(
      "This option overrides your current domain list!\nDo you still wish to continue?"
    );
    if (verify) {
      startUpload();
    }
  });
  document
    .getElementById("upload-domainlist")
    .addEventListener("change", handleUpload, false);

  const condition = true;
  if (condition) {
    startWalkthroughListener();
  }
}

function startWalkthroughListener() {
  document.getElementsByClassName("startpop")[0].addEventListener(
    "click",
    () => {
      var popup1 = document.getElementById("settings-myPopup1");
      popup1.classList.toggle("settings-show1");
      document.getElementsByClassName("settings-popup2")[0].click();
      popup1.addEventListener("click", () => {
        popup1.classList.toggle("settings-show1");
        var popup2 = document.getElementById("settings-myPopup2");
        popup2.classList.toggle("settings-show2");
        popup2.addEventListener("click", () => {
          popup2.classList.toggle("settings-show2");
          var popup3 = document.getElementById("settings-myPopup3");
          popup3.classList.toggle("settings-show3");
          document.getElementsByClassName("settings-popup3")[0].click();
          popup3.addEventListener("click", () => {
            popup3.classList.toggle("settings-show3");
            var popup4 = document.getElementById("settings-myPopup4");
            popup4.classList.toggle("settings-show4");
            popup4.addEventListener("click", () => {
              popup4.classList.toggle("settings-show4");
              var popup5 = document.getElementById("settings-myPopup5");
              popup5.classList.toggle("settings-show5");
              popup5.addEventListener("click", () => {
                popup5.classList.toggle("settings-show5");
                document.getElementsByClassName("settings-popup1")[0].click();
              });
            });
          });
        });
      });
    },
    { once: true }
  );
  document.getElementsByClassName("startpop")[0].click();
}
/**
 * Renders the `Settings` view in the options page
 * @param {string} scaffoldTemplate - stringified HTML template
 */
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

  chrome.storage.local.get(["ENABLED", "DOMAINLIST_ENABLED"], function (
    result
  ) {
    console.log(result.ENABLED);
    if (result.ENABLED == undefined) {
      chrome.storage.local.set({ ENABLED: true });
      document.getElementById("settings-view-radio0").checked = true;
    } else if (result.ENABLED) {
      document.getElementById("settings-view-radio0").checked = true;
    } else {
      document.getElementById("settings-view-radio1").checked = true;
    }
    if (result.DOMAINLIST_ENABLED) {
      document.getElementById("settings-view-radio2").checked = true;
    }
  });

  eventListeners();
}
