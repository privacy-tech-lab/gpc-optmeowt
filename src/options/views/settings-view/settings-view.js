/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
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
import { csvGenerator } from "../../../common/csvGenerator";
import { modes } from "../../../data/modes.js";

// Used in tutorial
import UIkit from "../../../../node_modules/uikit/dist/js/uikit";
import tippy from "../../../../node_modules/tippy.js/dist/tippy-bundle.umd";

import "../../../../node_modules/file-saver/src/FileSaver"
import Darkmode from 'darkmode-js';
import { addDynamicRule, deleteAllDynamicRules, reloadDynamicRules } from "../../../common/editRules.js";
import { updateRemovalScript } from "../../../common/editDomainlist.js";

// Global scope settings variable
var mode;

/**
 * @typedef headings
 * @property {string} headings.title - Title of the given page
 * @property {string} headings.subtitle - Subtitle of the given page
 */
const headings = {
  title: "Settings",
  subtitle: "Adjust extension settings",
};

function handleDownloadAnalysis() {
  chrome.runtime.sendMessage({
    msg: "CSV_DATA_REQUEST_FROM_SETTINGS"
  })
}


/**
 * Creates the event listeners for the `Settings` page buttons and options
 */
function eventListeners() {
  document
    .getElementById("settings-view-radio0")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: true } });
      chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: false } });
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: modes.protection});
      if ("$BROWSER" == 'chrome'){
        chrome.scripting.updateContentScripts([
          {
          "id": "2",
          "matches": ["https://example.org/foo/bar.html"],
          "js": ["content-scripts/registration/gpc-remove.js"],
          "runAt": "document_start"
          }
        ])
        deleteAllDynamicRules();
    }
    });
  document
    .getElementById("settings-view-radio1")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: false } });
      chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: false } });
      if ("$BROWSER" == 'chrome'){
        chrome.scripting.updateContentScripts([
          {
          "id": "2",
          "matches": ["<all_urls>"],
          "js": ["content-scripts/registration/gpc-remove.js"],
          "runAt": "document_start"
          }
        ])
        addDynamicRule(4999,"*");
    }
    });
  document
    .getElementById("settings-view-radio2")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: true } });
      chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: true } });
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: modes.protection});
      if ("$BROWSER" == 'chrome'){
        updateRemovalScript();
        reloadDynamicRules();
      }
    });
  document
    .getElementById("download-button")
    .addEventListener("click", handleDownload);
  document
    .getElementById("download-analysis-button")
    .addEventListener("click", handleDownloadAnalysis)
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

    chrome.runtime.onMessage.addListener(function (message, _, __) {
      if (message.msg === "SHOW_TUTORIAL") {
        walkthrough();
        storage.set(stores.settings, true, 'TUTORIAL_SHOWN')
        }
      });
    createMessageListeners();
}

function createMessageListeners(){
  chrome.runtime.onMessage.addListener(function (message, _, __) {
    if (message.msg === "CSV_DATA_RESPONSE_TO_SETTINGS") {
      csvGenerator(message.data.csvData, message.data.titles);
    }
  });
}

/******************************************************************************/

/*
 * Gives user a walkthrough of install page on first install
 */


function analysisWarning() {
  let modal = UIkit.modal("#analysis-modal");
  modal.show();
  document.getElementById("modal-button-5").onclick = function () {
    modal.hide();
  }
}

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
        trigger4();
      },
    });
    let tooltip = document.getElementsByClassName("tutorial-tooltip2")[0]
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

// Show Analysis Warning
async function initPopUpWalkthrough() {
  const analysisWarningShown = await storage.get(stores.settings, 'ANALYSIS_WARNING_SHOWN');
  
    if (!analysisWarningShown && mode === modes.analysis) {
      analysisWarning();
      storage.set(stores.settings, true, 'ANALYSIS_WARNING_SHOWN');
    }
  }


// Button to change to Analysis Mode
function loadChangeMode() {
  if ("$BROWSER" != "firefox") {
    document.getElementById("optMode-parent").style.display = "none";
    document.getElementById("analysis-export").style.display = "none";
  } else {
    document.getElementById("optMode").addEventListener('click', function() {
      mode = modes.analysis;
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: mode});
      chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: true } });
      initPopUpWalkthrough();
    })
  }
}




chrome.runtime.onMessage.addListener(function (message, _, __) {
  if (message.msg === "SHOW_TUTORIAL") {
    walkthrough();
  }
});

// Copy confirmation code 
function copyToClipboard() {
  /* Get the text field */
  var copyText = document.getElementById("conf-code");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

   /* Copy the text inside the text field */
  navigator.clipboard.writeText(copyText.value);
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
  document.getElementById("scaffold-component-body").innerHTML = content.innerHTML;

  // Render correct extension mode radio button
  const isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  const isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");

  if (isEnabled) {
    (isDomainlisted)
      ? document.getElementById("settings-view-radio2").checked = true
      : document.getElementById("settings-view-radio0").checked = true;
  } else {
    document.getElementById("settings-view-radio1").checked = true;
  }

  eventListeners();
  loadChangeMode();

  const tutorialShown = await storage.get(stores.settings, 'TUTORIAL_SHOWN');
  if (!tutorialShown) {
    walkthrough();
  }
  storage.set(stores.settings, true, 'TUTORIAL_SHOWN')

  //conf code
  document.getElementById("conf-code-button").addEventListener("click", () => {
    copyToClipboard();
  });
}

 
 
 
 