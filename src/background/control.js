/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
control.js
================================================================================
control.js manages persistent data, message liseteners, in particular
to manage the state & functionality mode of the extension
*/


import { background as analysis } from "./analysis/background";
import { background as protection } from "./protection/background";

import { modes } from "../data/modes.js";
import { defaultSettings } from "../data/defaultSettings.js";
import { stores, storage } from "./storage.js";

var mode = defaultSettings.MODE;
var isEnabled = defaultSettings.IS_ENABLED;


function enable() {
  switch (mode) {
		case modes.analysis:
			analysis.preinit();
			analysis.init();
			analysis.postinit();
			console.log(`Initializing Analysis mode. `);
			break;
		case modes.protection:
			protection.preinit();
			protection.init();
			protection.postinit();
			console.log(`Initializing Protection mode. `);
			break;
		default:
			console.error(`Failed to enable() OptMeowt. `);
	}
}

function disable() {
  analysis.halt();
  protection.halt();
}


/******************************************************************************/

// Initializers


// Default settings init
(async () => {
  let settingsDB = await storage.getStore(stores.settings);
  for (let setting in defaultSettings) {
    if (!settingsDB[setting]) {
      await storage.set(stores.settings, defaultSettings[setting], setting);
    }
  }

  // Mode init
  if (isEnabled) {
    enable();
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
 chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
	// console.log(`Recieved message @ background page.`);
  if (request.msg === "CHANGE_MODE") {
    isEnabled = request.data.isEnabled;
    mode = request.data.mode;

    if (isEnabled) {
      await storage.set(stores.settings, true, "IS_ENABLED");
      enable();
      // switch (mode) {
      //   case modes.analysis:
      //     break;
      //   case modes.protection:
      //     break;
      //   default:
      //     protection.init();
      // }
    } else {
      await storage.set(stores.settings, false, "IS_ENABLED");
      disable();
    }
  }
});