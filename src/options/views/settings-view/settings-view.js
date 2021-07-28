/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
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
  stores,
  storage,
  extensionMode
} from "../../../background/storage.js";

// Used in tutorial
import UIkit from "../../../../node_modules/uikit/dist/js/uikit";
import tippy from "../../../../node_modules/tippy.js/dist/tippy-bundle.umd";

import "../../../../node_modules/file-saver/src/FileSaver"
//import { darkSwitchFunction } from "../../../../node_modules/dark-mode-switch/dark-mode-switch.js";


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
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.enabled });
    });
  document
    .getElementById("settings-view-radio1")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.disabled });
    });
  document
    .getElementById("settings-view-radio2")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.domainlisted });
    });
  document
    .getElementById("download-button")
    .addEventListener("click", handleDownload);
  document.getElementById("upload-button").addEventListener("click", () => {
    const verify = confirm(
      `This option will load a list of domains from a file, clearing all domains currently in the list.\n Do you wish to continue?`
    );
    if (verify) {
      startUpload();
    }
  });
  document
    .getElementById("upload-domainlist")
    .addEventListener("change", handleUpload, false);
}

/******************************************************************************/

/*
 * Gives user a walkthrough of install page on first install 
 */
function walkthrough() {
  let modal = UIkit.modal("#welcome-modal");
  modal.show();

  document.getElementById("modal-button-1").onclick = function () {
    modal.hide();
  }

  document.getElementById("modal-button-2").onclick = function () {
    modal.hide();
    tippy(".tutorial-tooltip1", {
      content:
        "<p>Set which sites should receive a Do Not Sell signal<p>  <button class='uk-button uk-button-default'>Next</button>",
      allowHTML: true,
      trigger: "manual",
      placement: "right",
      offset: [0, -600],
      duration: 1000,
      theme: "custom-1",
      onHide(instance) {
        trigger2();
      },
    });
    let tooltip = document.getElementsByClassName("tutorial-tooltip1")[0]
      ._tippy;
    tooltip.show();
  };

  function trigger2() {
    tippy(".tutorial-tooltip2", {
      content:
        "<p>Import and export your customized list of sites that should receive a signal<p>  <button class='uk-button uk-button-default'>Next</button>",
      allowHTML: true,
      trigger: "manual",
      duration: 1000,
      theme: "custom-1",
      placement: "right",
      offset: [0, 60],
      onHide() {
        // trigger3();
        // This is to skip the dark mode tutorial option
        trigger4();
      },
    });
    let tooltip = document.getElementsByClassName("tutorial-tooltip2")[0]
      ._tippy;
    tooltip.show();
  }

  function trigger3() {
    tippy(".tutorial-tooltip3", {
      content:
        "<p>Toggle this switch to change the color theme of OptMeowt<p> <button class='uk-button uk-button-default'>Finish</button>",
      allowHTML: true,
      trigger: "manual",
      duration: 1000,
      theme: "custom-1",
      placement: "bottom",
      offset: [-100, 20],
      onHide() {
        trigger4();
      },
    });
    let tooltip = document.getElementsByClassName("tutorial-tooltip3")[0]
      ._tippy;
    tooltip.show();
  }

  function trigger4() {
    let modal = UIkit.modal("#thank-you-modal")
    modal.show()
    document.getElementById("modal-button-3").onclick = () => {
      chrome.tabs.create(
        { url: "https://privacytechlab.org/optmeowt" },
        function (tab) {}
      );
    }
  }
}

/******************************************************************************/

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

  //darkSwitchFunction();

  // Render correct extension mode radio button
  const mode = await storage.get(stores.settings, "MODE");
  // console.log(`mode = ${mode}`);
  switch (mode) {
    case extensionMode.enabled:
      document.getElementById("settings-view-radio0").checked = true;
      break;
    case extensionMode.domainlisted:
      document.getElementById("settings-view-radio2").checked = true;
      break;
    case extensionMode.disabled:
      document.getElementById("settings-view-radio1").checked = true;
      break;
    default:
      console.log(`FAILED: Couldn't load mode for radio buttons. Changing mode to ENABLED.`);
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.enabled });
      document.getElementById("settings-view-radio0").checked = true;
  }

  eventListeners();

  // Tutorial walkthrough 
  const tutorialShown = await storage.get(stores.settings, 'TUTORIAL_SHOWN');
  if (!tutorialShown) {
    walkthrough();
  }
  storage.set(stores.settings, true, 'TUTORIAL_SHOWN')
}
