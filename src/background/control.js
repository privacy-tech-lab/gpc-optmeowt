/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/



/*
control.js
================================================================================
control.js manages persistent data, message liseteners, in particular
to manage the state & functionality mode of the extension
*/


import { init as initProtection, halt as haltProtection, halt } from "./protection/protection.js";
import { init as initAnalysis, halt as haltAnalysis } from "./analysis/analysis.js";
import { modes } from "../data/modes.js";
import { defaultSettings } from "../data/defaultSettings.js";
import { stores, storage } from "./storage.js";

var mode = defaultSettings.MODE;
var isEnabled = defaultSettings.IS_ENABLED;
var isDomainlisted = defaultSettings.IS_DOMAINLISTED;


function enable() {
  switch (mode) {
    case modes.analysis:
      initAnalysis();
      haltProtection();
      console.log(`INITIALIZING Analysis mode.`);
      break;
    case modes.protection:
			initProtection();
      haltAnalysis();
			console.log(`INITIALIZING Protection mode.`);
			break;
		default:
			console.error(`FAILED to ENABLE OptMeowt.`);
	}
}

function disable() {
  haltAnalysis();
  haltProtection();
}


/******************************************************************************/
// Initializers

// This is the very first thing the extension runs
(async () => {
  // Initializes the default settings
  let settingsDB = await storage.getStore(stores.settings);
  for (let setting in defaultSettings) {
    if (!settingsDB[setting]) {
      await storage.set(stores.settings, defaultSettings[setting], setting);
    }
  }

  mode = await storage.get(stores.settings, "MODE");
  isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");

  if (isEnabled) {  // Turns on the extension
    enable();
  }
})();

// Opens the options page on extension install
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install' ) {
    chrome.runtime.openOptionsPage((result) => {});
  } else if (details.reason === 'update') {
    chrome.runtime.openOptionsPage((result) => {});
  }
});


/******************************************************************************/
// Mode listeners


// (1) Handle extension activeness is changed by calling all halt
// 	 - Make sure that I switch extensionmode and separate it from mode.domainlist
// (2) Handle extension functionality with listeners and message passing

/**
 * Listeners for information from --POPUP-- or --OPTIONS-- page
 * This is the main "hub" for message passing between the extension components
 * https://developer.chrome.com/docs/extensions/mv3/messaging/
 */
 chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
	// console.log(`Recieved message @ background page.`);
  if (message.msg === "TURN_ON_OFF") {
    isEnabled = message.data.isEnabled;           // can be undefined

    if (isEnabled) {
      await storage.set(stores.settings, true, "IS_ENABLED");
      enable();
    } else {
      await storage.set(stores.settings, false, "IS_ENABLED");
      disable();
    }
  }
  if (message.msg === "CHANGE_MODE") {
    mode = message.data;
    console.log("CHANGE_MODE: mode = ", mode);
    await storage.set(stores.settings, mode, "MODE");
    if (isEnabled) {
      enable();
    }
    chrome.runtime.sendMessage({
      msg: "RELOAD_DUE_TO_MODE_CHANGE",
      data: mode
    }); 
  }
  if (message.msg === "CHANGE_IS_DOMAINLISTED") {
    isDomainlisted = message.data.isDomainlisted; // can be undefined
  }
});

// Handles requests for global mode
chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function (message) {
    if (message.msg === "REQUEST_MODE") {
      port.postMessage({ msg: "RESPONSE_MODE", data: mode })
    }
  })
})