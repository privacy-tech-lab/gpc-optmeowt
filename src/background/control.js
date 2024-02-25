/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
control.js
================================================================================
control.js manages persistent data, message liseteners, in particular
to manage the state & functionality mode of the extension
*/

import {
  init as initProtection_ff,
  halt as haltProtection_ff,
} from "./protection/protection-ff.js";
import {
  init as initProtection_cr,
  halt as haltProtection_cr,
} from "./protection/protection.js";
import { defaultSettings } from "../data/defaultSettings.js";
import { stores, storage } from "./storage.js";
import { reloadDynamicRules } from "../common/editRules.js";

import {
  debug_domainlist_and_dynamicrules,
  updateRemovalScript,
} from "../common/editDomainlist.js";

async function enable() {

  var initProtection = initProtection_cr;
  
  initProtection();
}

function disable() {

  var haltProtection = haltProtection_cr;
  haltProtection();
}

/******************************************************************************/
// Initializers

// This is the very first thing the extension runs
(async () => {

    chrome.scripting.registerContentScripts([
      {
        id: "1",
        matches: ["<all_urls>"],
        excludeMatches:["https://example.com/"],
        js: ["content-scripts/registration/gpc-dom.js"],
        runAt: "document_start",
      }
    ]);
  
  // Initializes the default settings
  let settingsDB = await storage.getStore(stores.settings);
  for (let setting in defaultSettings) {
    if (!settingsDB[setting]) {
      await storage.set(stores.settings, defaultSettings[setting], setting);
    }
  }

  let isEnabled = await storage.get(stores.settings, "IS_ENABLED");

  if (isEnabled) {
    // Turns on the extension
    enable();

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
chrome.runtime.onMessage.addListener(async function (
  message
) {
  if (message.msg === "TURN_ON_OFF") {
    let isEnabled = message.data.isEnabled; // can be undefined

    if (isEnabled) {
      await storage.set(stores.settings, true, "IS_ENABLED");
      enable();
    } else {
      await storage.set(stores.settings, false, "IS_ENABLED");
      disable();
    }
  }

  if (message.msg === "CHANGE_IS_DOMAINLISTED") {
    let isDomainlisted = message.data.isDomainlisted; // can be undefined // not used
  }
});
