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


import { init as initProtection_ff, halt as haltProtection_ff} from "./protection/protection-ff.js";

import { init as initProtection_cr, halt as haltProtection_cr} from "./protection/protection.js";

import { init as initAnalysis, halt as haltAnalysis } from "./analysis/analysis.js";

import { defaultSettings } from "../data/defaultSettings.js";
import { modes } from "../data/modes.js";
import { stores, storage, adaptDomainlist } from "./storage.js";
import { addDynamicRule, deleteAllDynamicRules, getFreshId, reloadDynamicRules } from '../common/editRules';

// TODO: Remove
import { debug_domainlist_and_dynamicrules, updateRemovalScript, update } from '../common/editDomainlist';

async function enable() {
  let mode = await storage.get(stores.settings, "MODE");

  if ("$BROWSER" == 'firefox'){
    var initProtection = initProtection_ff;
    var haltProtection = haltProtection_ff;
  } else {
    var initProtection = initProtection_cr;
    var haltProtection = haltProtection_cr;
  }
  
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
			initProtection();
      haltAnalysis();
      await storage.set(stores.settings, modes.protection, "MODE")
			console.log(`INITIALIZING Protection mode.`);
      break;
	}
}

function disable() {

  if ("$BROWSER" == 'firefox'){
    var haltProtection = haltProtection_ff;
  } else if ("$BROWSER" == 'chrome') {
    var haltProtection = haltProtection_cr;
  }


  haltAnalysis();
  haltProtection();
}


/******************************************************************************/
// Initializers

// This is the very first thing the extension runs
(async () => {

  // TODO: Temporarily register content script
  if ("$BROWSER" == "chrome"){
    chrome.scripting.registerContentScripts([
      {
        "id": "1",
        "matches": ["<all_urls>"],
        "js": ["content-scripts/registration/gpc-dom.js"],
        "runAt": "document_start"
      },
      {
        "id": "2",
        "matches": ["https://example.org/foo/bar.html"],
        "js": ["content-scripts/registration/gpc-remove.js"],
        "runAt": "document_start"
        }
    ])
    .then(() => { console.log("Registered content scripts."); })
  } 
  // Initializes the default settings
  let settingsDB = await storage.getStore(stores.settings);
  for (let setting in defaultSettings) {
    if (!settingsDB[setting]) {
      await storage.set(stores.settings, defaultSettings[setting], setting);
    }
  }

  // mode = await storage.get(stores.settings, "MODE");
  let isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  // isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");

  if (isEnabled) {  // Turns on the extension
    enable();
  }
    let adapted = await storage.get(stores.settings, "DOMAINLIST_ADAPTED");
    if (!adapted){
      await adaptDomainlist();
      await storage.set(stores.settings,true,"DOMAINLIST_ADAPTED");
    }
    if ("$BROWSER" == 'chrome'){
      updateRemovalScript();
      reloadDynamicRules();
    } 
})();


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
    let isEnabled = message.data.isEnabled;           // can be undefined

    if (isEnabled) {
      await storage.set(stores.settings, true, "IS_ENABLED");
      enable();
    } else {
      await storage.set(stores.settings, false, "IS_ENABLED");
      disable();
    }
  }
  if (message.msg === "CHANGE_MODE") {
    let mode = message.data;
    let isEnabled = await storage.get(stores.settings, "IS_ENABLED");
    await storage.set(stores.settings, mode, "MODE");
    console.log("CHANGE_MODE: mode = ", mode);
    if (isEnabled) {
      enable();
    }
    chrome.runtime.sendMessage({
      msg: "RELOAD_DUE_TO_MODE_CHANGE",
      data: mode
    }); 
  }
  if (message.msg === "CHANGE_IS_DOMAINLISTED") {
    let isDomainlisted = message.data.isDomainlisted; // can be undefined
  }

});

// Handles requests for global mode
/**
 * IF YOU EVER NEED TO DEBUG THIS: 
 * This is outmoded in manifest V3. We cannot maintain global variables anymore. 
 */
chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function (message) {
    if (message.msg === "REQUEST_MODE") {
      port.postMessage({ msg: "RESPONSE_MODE", data: mode })
    }
  })
})
