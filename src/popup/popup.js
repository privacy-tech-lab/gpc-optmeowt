/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
popup.js
================================================================================
popup.js supplements and renders complex elements on popup.html
*/

import { stores, storage } from "../background/storage.js";
import "../../node_modules/uikit/dist/css/uikit.min.css";
import "../../node_modules/animate.css/animate.min.css";
import "./styles.css";
import psl from "psl";
import "../../node_modules/uikit/dist/js/uikit.js";
import "../../node_modules/uikit/dist/js/uikit-icons.js";
import "../../node_modules/@popperjs/core/dist/umd/popper.js";
import tippy from "../../node_modules/tippy.js/dist/tippy-bundle.umd.js";
import UIkit from "uikit";
import Darkmode from "../theme/darkmode.js";

import {
  addDomainToDomainlistAndRules,
  removeDomainFromDomainlistAndRules,
  updateRemovalScript,
} from "../common/editDomainlist.js";

import { reloadDynamicRules, addDynamicRule } from "../common/editRules.js";

// Global scope settings variables
var isEnabled;
var isDomainlisted;
var parsedDomain;

// Protection mode data
var domainsInfo;
var wellknownInfo;

// Darkmode
const darkmode = new Darkmode();


/******************************************************************************/
/******************************************************************************/
/**********       # First-to-load popup components (essential)       **********/
/******************************************************************************/
/******************************************************************************/


//Init: initialize darkmode button (NOTE: accesses global scope `mode`)
function generateDarkmodeElement() {
  let darkSwitch = document.getElementById("darkSwitch");
  let darkmodeText = "";
  if (darkmode.isActivated()) {
    darkmodeText = `<input
      type="checkbox"
      class="custom-control-input"
      id="darkSwitch" 
      checked
      />`;
  } else {
    darkmodeText = `<input
      type="checkbox"
      class="custom-control-input"
      id="darkSwitch"
      />`;
  }
  darkSwitch.outerHTML = darkmodeText;

  document.getElementById("darkSwitch").addEventListener("click", () => {
    chrome.runtime.sendMessage({
      msg: "DARKSWITCH_PRESSED",
    });
    darkmode.toggle();
  });
}

// Fetches the current domain
function getCurrentParsedDomain() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];
        let url = new URL(tab.url);
        let parsed = psl.parse(url.hostname);
        let domain = parsed.domain;
        parsedDomain = domain; // for global scope variable
        resolve(domain);
      });
    } catch (e) {
      reject();
    }
  });
}

/**
 * In sync with global scope `parsedDomain`
 * @param {String} parsedDomain
 */
function renderFirstPartyDomain(parsedDomain) {
  if (parsedDomain) {
    document.getElementById("domain-title").innerHTML = parsedDomain;
    initPopUpWalkthrough();
  } else {
    document.getElementById("domain-title").style.display = "none";
  }
}

// Extension on/off renderer helper

function renderExtensionIsEnabledDisabled(isEnabled, isDomainlisted) {
  if (isEnabled === undefined || isDomainlisted === undefined) {
    document.getElementById("img").src = "../assets/play-circle-outline.svg";
    document
      .getElementById("enable-disable")
      .setAttribute("uk-tooltip", "Enable");
  } else if (isEnabled) {
    document.getElementById("img").src = "../assets/pause-circle-outline.svg";
    document
      .getElementById("enable-disable")
      .setAttribute("uk-tooltip", "Disable");
    document.getElementById("content").style.opacity = "1";
    document.getElementById("extension-disabled-message").style.opacity = "0";
    document.getElementById("extension-disabled-message").style.display =
      "none";
  } else {
    document.getElementById("extension-disabled-message").style.display = "";
    document.getElementById("img").src = "../assets/play-circle-outline.svg";
    document
      .getElementById("enable-disable")
      .setAttribute("uk-tooltip", "Enable");
    document.getElementById("content").style.opacity = "0.1";
    document.getElementById("extension-disabled-message").style.opacity = "1";
  }
}

function turnonoff(isEnabled) {
    if (isEnabled) {
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
    } else {
      updateRemovalScript();
      reloadDynamicRules();
    }
}

function listenerExtensionIsEnabledDisabledButton(
  isEnabled,
  isDomainlisted,
  mode
) {
  document
    .getElementById("enable-disable")
    .addEventListener("click", async () => {
      isEnabled = await storage.get(stores.settings, "IS_ENABLED");

      if (isEnabled) {
        document.getElementById("extension-disabled-message").style.display =
          "";
        document.getElementById("img").src =
          "../assets/play-circle-outline.svg";
        document
          .getElementById("enable-disable")
          .setAttribute("uk-tooltip", "Enable");
        document.getElementById("content").style.opacity = "0.1";
        document.getElementById("extension-disabled-message").style.opacity =
          "1";
        chrome.runtime.sendMessage({
          msg: "TURN_ON_OFF",
          data: { isEnabled: false },
        });
      } else {
        document.getElementById("img").src =
          "../assets/pause-circle-outline.svg";
        document
          .getElementById("enable-disable")
          .setAttribute("uk-tooltip", "Disable");
        document.getElementById("content").style.opacity = "1";
        document.getElementById("extension-disabled-message").style.opacity =
          "0";
        document.getElementById("extension-disabled-message").style.display =
          "none";
        chrome.runtime.sendMessage({
          msg: "TURN_ON_OFF",
          data: { isEnabled: true },
        });
      }
      turnonoff(isEnabled);
    });
}

// Domain counter for Protection mode helper

async function renderDomainCounter() {
  const domainlistValues = await storage.getAll(stores.domainlist);
  let count = Object.keys(domainlistValues).filter((key) => {
    return domainlistValues[key] == null;
  }).length;
  document.getElementById("visited-domains-stats").innerHTML = `
    <p id = "domain-count" class="blue-heading" style="font-size:25px;
    font-weight: bold">${count}</p> domains receiving signals
  `;
}

// First party domain and the Do Not Sell listener helper

async function renderFirstPartyDomainDNSToggle() {
  let checkbox = "";
  let text = "";
  if (parsedDomain) {
    try {
      const parsedDomainValue = await storage.get(
        stores.domainlist,
        parsedDomain
      );

      if (!parsedDomainValue) {
        checkbox = `<input type="checkbox" id="input" checked/><span></span>`;
        text = "Do Not Sell Enabled";
      } else {
        checkbox = `<input type="checkbox" id="input"/><span></span>`;
        text = "Do Not Sell Disabled";
      }
      document.getElementById("switch-label").innerHTML = checkbox;
      document.getElementById("more-info-text").innerHTML = text;
    } catch (e) {
      console.error(e);
      document.getElementById("switch-label").innerHTML = checkbox;
      document.getElementById("more-info-text").innerHTML = text;
    }
  } else {
    document.getElementById("switch-label").innerHTML = checkbox;
    document.getElementById("more-info-text").innerHTML = text;
  }
}

async function listenerFirstPartyDomainDNSToggleCallback() {
  chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: true } });
  chrome.runtime.sendMessage({
    msg: "CHANGE_IS_DOMAINLISTED",
    data: { isDomainlisted: true },
  });
  const parsedDomainValue = await storage.get(stores.domainlist, parsedDomain);
  let elemString = "";
  if (!parsedDomainValue) {
    elemString = "Do Not Sell Disabled";
    await addDomainToDomainlistAndRules(parsedDomain);
  } else {
    elemString = "Do Not Sell Enabled";
    await removeDomainFromDomainlistAndRules(parsedDomain);
  }

  document.getElementById("more-info-text").innerHTML = elemString;
}

function listenerFirstPartyDomainDNSToggle() {
  document
    .getElementById("switch-label")
    .addEventListener("click", listenerFirstPartyDomainDNSToggleCallback);
}

function removeFirstPartyDomainDNSToggle() {
  document
    .getElementById("switch-label")
    .removeEventListener("click", listenerFirstPartyDomainDNSToggleCallback);
  document.getElementById("switch-label").innerHTML = "";
  document.getElementById("more-info-text").innerHTML = "";
}

// Dropdown helpers

function renderDropdown1Toggle() {
  if (
    document.getElementById("dropdown-1-expandable").style.display === "none"
  ) {
    document.getElementById("dropdown-chevron-1").src =
      "../assets/chevron-down.svg";
    document.getElementById("dropdown-1-expandable").style.display = "none";
    document
      .getElementById("dropdown-1")
      .classList.remove("dropdown-tab-click");
    document.getElementById("divider-4").style.display = "none";
  } else {
    document.getElementById("dropdown-chevron-1").src =
      "../assets/chevron-up.svg";
    document.getElementById("dropdown-1-expandable").style.display = "";
    document.getElementById("dropdown-1").classList.add("dropdown-tab-click");
    document.getElementById("divider-4").style.display = "";
  }
}

function renderDropdown2Toggle() {
  if (
    document.getElementById("dropdown-2-expandable").style.display === "none"
  ) {
    document.getElementById("dropdown-chevron-2").src =
      "../assets/chevron-down.svg";
    document.getElementById("dropdown-2-expandable").style.display = "none";
    document
      .getElementById("dropdown-2")
      .classList.remove("dropdown-tab-click");
    document.getElementById("divider-6").style.display = "none";
  } else {
    document.getElementById("dropdown-chevron-2").src =
      "../assets/chevron-up.svg";
    document.getElementById("dropdown-2-expandable").style.display = "";
    document.getElementById("dropdown-2").classList.add("dropdown-tab-click");
    document.getElementById("divider-6").style.display = "";
  }
}

function listenerDropdown1ToggleCallback() {
  if (
    document.getElementById("dropdown-1-expandable").style.display === "none"
  ) {
    document.getElementById("dropdown-chevron-1").src =
      "../assets/chevron-up.svg";
    document.getElementById("dropdown-1-expandable").style.display = "";
    document.getElementById("dropdown-1").classList.add("dropdown-tab-click");
    document.getElementById("divider-4").style.display = "";
  } else {
    document.getElementById("dropdown-chevron-1").src =
      "../assets/chevron-down.svg";
    document.getElementById("dropdown-1-expandable").style.display = "none";
    document
      .getElementById("dropdown-1")
      .classList.remove("dropdown-tab-click");
    document.getElementById("divider-4").style.display = "none";
  }
}

function listenerDropdown2ToggleCallback() {
  if (
    document.getElementById("dropdown-2-expandable").style.display === "none"
  ) {
    document.getElementById("dropdown-chevron-2").src =
      "../assets/chevron-up.svg";
    document.getElementById("dropdown-2-expandable").style.display = "";
    document.getElementById("dropdown-2").classList.add("dropdown-tab-click");
    document.getElementById("divider-6").style.display = "";
  } else {
    document.getElementById("dropdown-chevron-2").src =
      "../assets/chevron-down.svg";
    document.getElementById("dropdown-2-expandable").style.display = "none";
    document
      .getElementById("dropdown-2")
      .classList.remove("dropdown-tab-click");
    document.getElementById("divider-6").style.display = "none";
  }
}

function listenerDropdown1Toggle() {
  document
    .getElementById("dropdown-1")
    .addEventListener("click", listenerDropdown1ToggleCallback);
}

function listenerDropdown2Toggle() {
  document
    .getElementById("dropdown-2")
    .addEventListener("click", listenerDropdown2ToggleCallback);
}

function removeListenerDropdown1Toggle() {
  document
    .getElementById("dropdown-1")
    .removeEventListener("click", listenerDropdown1ToggleCallback);
}

function removeListenerDropdown2Toggle() {
  document
    .getElementById("dropdown-2")
    .removeEventListener("click", listenerDropdown2ToggleCallback);
}

/******************************************************************************/
/******************************************************************************/
/**********                 # Inflates main content                  **********/
/******************************************************************************/
/******************************************************************************/

/**
 * Redraws the popup for protection mode
 */
async function showProtectionInfo() {
  removeFirstPartyDomainDNSToggle();
  removeListenerDropdown1Toggle();
  removeListenerDropdown2Toggle();
  document.getElementById("switch-label").innerHTML = "";
  document.getElementById("more-info-body").style.display = "";
  document.getElementById("more-info-text").innerHTML = "Do Not Sell Enabled!";
  document.getElementById("dropdown-1").style.display = "";
  document.getElementById("dropdown-2").style.display = "";
  document.getElementById("dropdown-1-text").innerHTML = "3rd Party Domains";
  document.getElementById("dropdown-2-text").innerHTML = "Website Response";
  document.getElementById("dropdown-1-expandable").innerHTML = "";
  document.getElementById("dropdown-2-expandable").innerHTML = "";
  document.getElementById("dropdown-1-expandable").style.display = "none";
  document.getElementById("dropdown-2-expandable").style.display = "none";
  document.getElementById("visited-domains-stats").style.display = "";
  document.getElementById("domain-list").style.display = "";

  // Generate `Do Not Sell Enabled` elem
  renderDomainCounter(); // Render "X domains receiving signals" info section
  renderFirstPartyDomainDNSToggle(); // Render 1P domain "DNS Enabled/Disabled" text+toggle

  // Listeners associated with the buttons / toggles rendered above
  listenerFirstPartyDomainDNSToggle();
  listenerDropdown1Toggle();
  listenerDropdown2Toggle();

  let domain = await getCurrentParsedDomain();
  if (!domain) {
    await buildDomains([]);
    await buildWellKnown(null);
    return;
  }

  let parties = await storage.get(stores.thirdParties, domain);
  let wellknown = await storage.get(stores.wellknownInformation, domain);


  await buildDomains(parties);
  await buildWellKnown(wellknown ?? null);



    // chrome.runtime.sendMessage({
    //   msg: "POPUP_PROTECTION_REQUESTS",
    //   data: null,
    // });
}

/**
 * In sync with global scope `mode`
 * @param {Modes} mode - from modes.js
 */

/**
 * Initializes the popup window after DOM content is loaded
 * @param {Object} event - contains information about the event
 */
document.addEventListener("DOMContentLoaded", async (event) => {
  isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");
  parsedDomain = await getCurrentParsedDomain(); // This must happen first

  renderExtensionIsEnabledDisabled(isEnabled, isDomainlisted); // Render global ENABLED/DISABLED mode
  listenerExtensionIsEnabledDisabledButton(isEnabled);

  renderFirstPartyDomain(parsedDomain); // Render 1P domain

  generateDarkmodeElement(); // Render darkmode
  showProtectionInfo();
});

/******************************************************************************/
/******************************************************************************/
/**********          # Second-to-load components (dropdowns)         **********/
/******************************************************************************/
/******************************************************************************/

/**
 * Builds the listener to enable toggling 3rd party domains on/off in domainlist
 * @param {String} requestDomain - the domain related to the element which
 * the listener should be attached
 */
function addThirdPartyDomainDNSToggleListener(requestDomain) {
  document
    .getElementById(`input-${requestDomain}`)
    .addEventListener("click", async () => {
      chrome.runtime.sendMessage({
        msg: "TURN_ON_OFF",
        data: { isEnabled: true },
      });
      chrome.runtime.sendMessage({
        msg: "CHANGE_IS_DOMAINLISTED",
        data: { isDomainlisted: true },
      });
      const requestDomainValue = await storage.get(
        stores.domainlist,
        requestDomain
      );
      let elemString = "";
      if (!requestDomainValue) {
        elemString = "Do Not Sell Disabled";
        addDomainToDomainlistAndRules(requestDomain);
      } else {
        elemString = "Do Not Sell Enabled";
        removeDomainFromDomainlistAndRules(requestDomain);
      }
      
      document.getElementById(`dns-enabled-text-${requestDomain}`).innerHTML =
        elemString;
    });
}

/**
 * Builds the requested domains HTML of the popup window
 * @param {Object} requests - Contains all request domains for the current tab
 * (requests = tabs[activeTabID].requestDomainS; passed from background page)
 */
async function buildDomains(requests) {
  let domain = await getCurrentParsedDomain();
  let items = "";
  const domainlistKeys = await storage.getAllKeys(stores.domainlist);
  const domainlistValues = await storage.getAll(stores.domainlist);
  const requestList = Array.isArray(requests) ? requests : [];

  // Iterate through requests array
  for (let i = 0; i < requestList.length; i++) {
    const requestDomain = requestList[i]; // Get the domain name from the request array

    if (requestDomain != domain) {
      let checkbox = "";
      let text = "";
      // Find correct index
      let index = domainlistKeys.indexOf(requestDomain);
      if (index > -1 && !domainlistValues[index]) {
        checkbox = `<input type="checkbox" id="input-${requestDomain}" checked/>`;
        text = "Do Not Sell Enabled";
      } else {
        checkbox = `<input type="checkbox" id="input-${requestDomain}"/>`;
        text = "Do Not Sell Disabled";
      }

      items += `
        <li>
          <div
            class="blue-heading uk-flex-inline uk-width-1-1 uk-flex-center uk-text-center uk-text-bold uk-text-truncate"
            style="font-size: medium"
            id="domain"
          >
            ${requestDomain}
          </div>
          <div uk-grid  style="margin-top: 4%; ">
            <div
              id="dns-enabled-text-${requestDomain}"
              class="uk-width-expand uk-margin-auto-vertical"
              style="font-size: small;"
            >
              ${text}
            </div>
            <div>
              <div uk-grid>
                <div class="uk-width-auto">
                  <label class="switch switch-smaller" id="switch-label-${requestDomain}">
                    <!-- Populate switch preference here -->
                    ${checkbox}
                    <span class="tooltip-1"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <!-- Response info -->
          <div uk-grid uk-grid-row-collapse style="margin-top:0px;">
          </div>
        </li>
      `;
    }
  }
  document.getElementById("dropdown-1-expandable").innerHTML = items;

  // Sets the 3rd party domain toggle listeners
  for (let i = 0; i < requestList.length; i++) {
    const requestDomain = requestList[i];
    if (requestDomain != domain) {
      addThirdPartyDomainDNSToggleListener(requestDomain);
    }
  }
}

/**
 * Builds the Well Known HTML for the popup window
 * @param {Object} requests - Contains all well-known info in current tab
 * (requests passed from contentScript.js page as of v1.1.3)
 */
async function buildWellKnown(requests) {
  let explainer;
  const data =
    requests && typeof requests === "object" ? requests : null;

  /*
  This iterates over the cases of possible combinations of
  having found a GPC policy, and whether or not a site respects
  the signal or not, setting both the `explainer` and `tabDetails`
  for GPC v1
  */
  if (data !== null && data["gpc"] === true) {
    explainer = `
      <li>
        <p class="uk-text-center uk-text-small uk-text-bold">
          GPC Signals Accepted
        </p>
      </li>
      <li>
        <p class="uk-text-center uk-text-small">
          This website respects GPC signals
        </p>
      </li>
      `;
  } else if (data !== null && data["gpc"] === false) {
    explainer = `
      <li>
        <p class="uk-text-center uk-text-small uk-text-bold">
          GPC Signals Rejected
        </p>
      </li>
      <li>
        <p class="uk-text-center uk-text-small">
          This website does not respect GPC signals
        </p>
      </li>
      `;
  } else {
    explainer = `
      <li>
        <p class="uk-text-center uk-text-small uk-text-bold">
          GPC Policy Missing
        </p>
      </li>
      <li>
        <p class="uk-text-center uk-text-small">
          It seems this website does not have a GPC signal processing policy!
        </p>
      </li>
      `;
  }

  let wellknown =
    data !== null && data["gpc"] !== null
      ? `
    <li class="uk-text-center uk-text-small">
      Here is the GPC policy:
    </li>
    <li>
      <pre class="wellknown-bg">
        ${JSON.stringify(data, null, 4)
          .replace(/['"\{\}\n]/g, "")
          .replace(/,/g, "\n")}
      </pre>
    </li>
  `
      : ``;

  document.getElementById(
    "dropdown-2-expandable"
  ).innerHTML = `${explainer} ${wellknown}`;
}

/******************************************************************************/
/******************************************************************************/
/**********                   # Message handling                     **********/
/******************************************************************************/
/******************************************************************************/

/**
 * Listens for messages from background page that call functions to populate
 * the popup badge counter and build the popup domain list HTML, respectively
 */
chrome.runtime.onMessage.addListener(function (message, _, __) {
  if (message.msg === "POPUP_PROTECTION_DATA") {
    let { requests, wellknown } = message.data;
    domainsInfo = requests;
    wellknownInfo = wellknown;
    //buildDomains(requests);
    //buildWellKnown(wellknown);
  }
  if (message.msg === "POPUP_PROTECTION_DATA_REQUESTS") {
    let requests = message.data;
    buildDomains(requests);
  }
});

// Initializes the process to add to domainlist, via the background script
// This is to ensure all processes happen correctly
function setToDomainlist(d, k) {
  chrome.runtime.sendMessage({
    msg: "SET_TO_DOMAINLIST",
    data: { domain: d, key: k },
  });
}

/******************************************************************************/
/******************************************************************************/
/**********                  # Tutorial walkthorugh                  **********/
/******************************************************************************/
/******************************************************************************/

// Walkthrough function
function popUpWalkthrough() {
  let contentStr =
    "Toggle this switch to enable or disable sending Do Not Sell signals to this site in Protection mode";
  tippy(".tooltip-1", {
    content: contentStr,
    trigger: "manual",
    placement: "bottom",
    duration: 1000,
    theme: "custom-2",
    maxWidth: 250,
  });
  let tooltip = document.getElementsByClassName("tooltip-1")[0]._tippy;
  tooltip.show();
}

// Init: Check to see if we should do tutorial
async function initPopUpWalkthrough() {
  const tutorialShownInPopup = await storage.get(
    stores.settings,
    "TUTORIAL_SHOWN_IN_POPUP"
  );

  if (!tutorialShownInPopup) {
    popUpWalkthrough();

    storage.set(stores.settings, true, "TUTORIAL_SHOWN_IN_POPUP");
  }
}

/******************************************************************************/
/******************************************************************************/
/**********           # Misc. initializers and listeners             **********/
/******************************************************************************/
/******************************************************************************/

// Listener: Opens options page
document.getElementById("more").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Listener: Opens tutorial
if ("$BROWSER" == "chrome") {
  document.getElementById("tour").addEventListener("click", async () => {
    await storage.set(stores.settings, false, "TUTORIAL_SHOWN");

    chrome.runtime.sendMessage({
      msg: "SHOW_TUTORIAL",
    });
  });

  document.getElementById("tour").addEventListener("click", async () => {
    await storage.set(stores.settings, false, "TUTORIAL_SHOWN");
    setTimeout(chrome.runtime.openOptionsPage, 100);
  });
} else {
  document.getElementById("tour").addEventListener("click", () => {
    chrome.runtime.sendMessage({
      msg: "SHOW_TUTORIAL",
    });

    storage.set(stores.settings, false, "TUTORIAL_SHOWN");
  });

  document.getElementById("tour").addEventListener("click", () => {
    chrome.runtime.sendMessage({
      msg: "SHOW_TUTORIAL",
    });

    storage.set(stores.settings, false, "TUTORIAL_SHOWN");

    chrome.runtime.openOptionsPage();
  });
}

// Listener: Opens domainlist in options page
document.getElementById("domain-list").addEventListener("click", async () => {
  await storage.set(stores.settings, true, "DOMAINLIST_PRESSED");
  chrome.runtime.openOptionsPage();
});
