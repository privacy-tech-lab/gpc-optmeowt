/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
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
  // extensionMode
} from "../../../background/storage.js";

// Used in tutorial
import UIkit from "../../../../node_modules/uikit/dist/js/uikit.js";
import tippy from "../../../../node_modules/tippy.js/dist/tippy-bundle.umd.js";

import "../../../../node_modules/file-saver/src/FileSaver.js";
import Darkmode from "darkmode-js"; // check darkmode
import {
  addDynamicRule,
  deleteAllDynamicRules,
  reloadDynamicRules,
} from "../../../common/editRules.js";
import { updateRemovalScript } from "../../../common/editDomainlist.js";



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
      chrome.runtime.sendMessage({
        msg: "TURN_ON_OFF",
        data: { isEnabled: true },
      });
      chrome.runtime.sendMessage({
        msg: "CHANGE_IS_DOMAINLISTED",
        data: { isDomainlisted: false },
      });
      if ("$BROWSER" == "chrome") {
        chrome.scripting.updateContentScripts([
          {
            id: "1",
            matches: ["<all_urls>"],
            excludeMatches: [],
            js: ["content-scripts/registration/gpc-dom.js"],
            runAt: "document_start",
          },
        ]);
        deleteAllDynamicRules();
      }
    });
  document
    .getElementById("settings-view-radio1")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({
        msg: "TURN_ON_OFF",
        data: { isEnabled: false },
      });
      chrome.runtime.sendMessage({
        msg: "CHANGE_IS_DOMAINLISTED",
        data: { isDomainlisted: false },
      });
      if ("$BROWSER" == "chrome") {
        chrome.scripting.updateContentScripts([
          {
            id: "1",
            matches: ["https://example.com/foo/bar.html"],
            excludeMatches: [],
            js: ["content-scripts/registration/gpc-dom.js"],
            runAt: "document_start",
          },
        ]);
        addDynamicRule(4999, "*");
      }
    });
  document
    .getElementById("settings-view-radio2")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({
        msg: "TURN_ON_OFF",
        data: { isEnabled: true },
      });
      chrome.runtime.sendMessage({
        msg: "CHANGE_IS_DOMAINLISTED",
        data: { isDomainlisted: true },
      });
      if ("$BROWSER" == "chrome") {
        updateRemovalScript();
        reloadDynamicRules();
      }
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

  chrome.runtime.onMessage.addListener(async function (message, _, __) {
    if (message.msg === "SHOW_TUTORIAL") {
      if ("$BROWSER" == "chrome") {
        chrome.tabs.reload();
      } else {
        await storage.set(stores.settings, true, "TUTORIAL_SHOWN");
        walkthrough();
      }
    }
  });
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
  };

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
    let tooltip =
      document.getElementsByClassName("tutorial-tooltip1")[0]._tippy;
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
        trigger4();
      },
    });
    let tooltip =
      document.getElementsByClassName("tutorial-tooltip2")[0]._tippy;
    tooltip.show();
  }

  function trigger4() {
    let modal = UIkit.modal("#thank-you-modal");
    modal.show();
    document.getElementById("modal-button-3").onclick = () => {
      chrome.tabs.create(
        { url: "https://privacytechlab.org/optmeowt" },
        function (tab) {}
      );
    };
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

  // Render correct extension mode radio button
  const isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  const isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");

  if (isEnabled) {
    isDomainlisted
      ? (document.getElementById("settings-view-radio2").checked = true)
      : (document.getElementById("settings-view-radio0").checked = true);
  } else {
    document.getElementById("settings-view-radio1").checked = true;
  }

  eventListeners();

  const tutorialShown = await storage.get(stores.settings, "TUTORIAL_SHOWN");
  if (!tutorialShown) {
    walkthrough();
  }
  storage.set(stores.settings, true, "TUTORIAL_SHOWN");
}
