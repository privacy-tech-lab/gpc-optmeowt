/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
popup.js
================================================================================
popup.js supplements and renders complex elements on popup.html
*/


import { stores, storage } from "../background/storage";
import { isValidSignalIAB } from "../background/cookiesIAB";
import { csvGenerator } from "../background/csvGenerator"
import { modes } from "../data/modes.js";
import "../../node_modules/uikit/dist/css/uikit.min.css"
import "../../node_modules/animate.css/animate.min.css"
import "./styles.css"
import psl from "psl"
import "../../node_modules/uikit/dist/js/uikit"
import "../../node_modules/uikit/dist/js/uikit-icons"
import "../../node_modules/@popperjs/core/dist/umd/popper"
import tippy from "../../node_modules/tippy.js/dist/tippy-bundle.umd";
import UIkit from "uikit"
import Darkmode from "../theme/darkmode";


// Global scope settings variables
var isEnabled;
var isDomainlisted;
var mode;
var parsedDomain;

// Protection mode data
var domainsInfo;
var wellknownInfo;

// Analysis mode data
var analysis;
var analysis_userend;

// Darkmode
const darkmode = new Darkmode();


/******************************************************************************/
/******************************************************************************/
/**********       # First-to-load popup components (essential)       **********/
/******************************************************************************/
/******************************************************************************/

// Sets the current mode icon
function changeOptModeIcon() {
  let optMode = document.getElementById("optMode");
  let pl = document.getElementById("p-light");
  let al = document.getElementById("a-light");
  let pd = document.getElementById("p-dark");
  let ad = document.getElementById("a-dark");

  // optMode badge icon
  pl.style.display = "none";
  al.style.display = "none";
  pd.style.display = "none";
  ad.style.display = "none";
  if (darkmode.isActivated()) {
    (mode === modes.analysis) ? al.style.display="" : pl.style.display="";
  } else {
    (mode === modes.analysis) ? ad.style.display="" : pd.style.display="";
  }
}


// Changes-the-icon listener
function changeOptModeIconListenerCallback() {
  let optMode = document.getElementById("optMode");
  let pl = document.getElementById("p-light");
  let al = document.getElementById("a-light");
  let pd = document.getElementById("p-dark");
  let ad = document.getElementById("a-dark");

  // optMode badge icon
  pl.style.display = "none";
  al.style.display = "none";
  pd.style.display = "none";
  ad.style.display = "none";
  if (darkmode.isActivated()) {
    // optMode.style.color = "rgb(89,98,127)";
    // optMode.style.border = "1px solid rgb(89,98,127)";
    (mode === modes.analysis) ? ad.style.display="" : pd.style.display="";
  } else {
    // optMode.style.color = "rgb(238,238,238)";
    // optMode.style.border = "1px solid rgb(238,238,238)";
    (mode === modes.analysis) ? al.style.display="" : pl.style.display="";
  }
}


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
    changeOptModeIconListenerCallback();
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
        parsedDomain = domain;  // for global scope variable
        resolve(domain);
      });
    } catch(e) {
      console.log(e)
      reject();
    }
  })
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
    // document.getElementById("more-info-body").style.display = "none";
    document.getElementById("domain-title").style.display = "none";
  }
}


// Extension on/off renderer helper

function renderExtenionIsEnabledDisabled(isEnabled, isDomainlisted) {
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
    document.getElementById("extension-disabled-message").style.display = "none";
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

function listenerExtensionIsEnabledDisabledButton(isEnabled, isDomainlisted, mode) {
  document.getElementById("enable-disable").addEventListener("click", () => {
    if (isEnabled) {
      document.getElementById("extension-disabled-message").style.display = "";
      document.getElementById("img").src =
        "../assets/play-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Enable");
      document.getElementById("content").style.opacity = "0.1";
      document.getElementById("extension-disabled-message").style.opacity = "1";
      chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: false } });
    } else {
      document.getElementById("img").src =
        "../assets/pause-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Disable");
      document.getElementById("content").style.opacity = "1";
      document.getElementById("extension-disabled-message").style.opacity = "0";
      document.getElementById("extension-disabled-message").style.display = "none";
      chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: true } });
    }
  });
}


// Domain counter for Protection mode helper

async function renderDomainCounter() {
  const domainlistValues = await storage.getAll(stores.domainlist);
  let count = Object.keys(domainlistValues).filter((key) => {
    return domainlistValues[key] == true;
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
      const parsedDomainValue = await storage.get(stores.domainlist, parsedDomain);
      if (parsedDomainValue) {
        checkbox = `<input type="checkbox" id="input" checked/><span></span>`;
        text = "Do Not Sell Enabled";
      } else {
        checkbox = `<input type="checkbox" id="input"/><span></span>`;
        text = "Do Not Sell Disabled";
      }
      document.getElementById("switch-label").innerHTML = checkbox;
      document.getElementById("more-info-text").innerHTML = text;
    } catch(e) {
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
  chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: true } });
  const parsedDomainValue = await storage.get(stores.domainlist, parsedDomain);
  let elemString = "";
  if (parsedDomainValue) {
    elemString = "Do Not Sell Disabled";
    setToDomainlist(parsedDomain, false);
  } else {
    elemString = "Do Not Sell Enabled";
    setToDomainlist(parsedDomain, true);
  }
  document.getElementById("more-info-text").innerHTML = elemString;
}

function listenerFirstPartyDomainDNSToggle() {
  document.getElementById("switch-label").addEventListener(
    "click", listenerFirstPartyDomainDNSToggleCallback
  );
}

function removeFirstPartyDomainDNSToggle() {
  document.getElementById("switch-label").removeEventListener(
    "click", listenerFirstPartyDomainDNSToggleCallback
  );
  document.getElementById("switch-label").innerHTML = "";
  document.getElementById("more-info-text").innerHTML = "";
}


// Dropdown helpers

function renderDropdown1Toggle() {
  if (document.getElementById("dropdown-1-expandable").style.display === "none") {
    document.getElementById("dropdown-chevron-1").src = "../assets/chevron-down.svg"
    document.getElementById("dropdown-1-expandable").style.display = "none"
    document.getElementById("dropdown-1").classList.remove("dropdown-tab-click")
    document.getElementById("divider-4").style.display = "none"
  } else {
    document.getElementById("dropdown-chevron-1").src = "../assets/chevron-up.svg"
    document.getElementById("dropdown-1-expandable").style.display = ""
    document.getElementById("dropdown-1").classList.add("dropdown-tab-click")
    document.getElementById("divider-4").style.display = ""
  }
}

function renderDropdown2Toggle() {
  if (document.getElementById("dropdown-2-expandable").style.display === "none") {
    document.getElementById("dropdown-chevron-2").src = "../assets/chevron-down.svg"
    document.getElementById("dropdown-2-expandable").style.display = "none"
    document.getElementById("dropdown-2").classList.remove("dropdown-tab-click")
    document.getElementById("divider-6").style.display = "none"
  } else {
    document.getElementById("dropdown-chevron-2").src = "../assets/chevron-up.svg"
    document.getElementById("dropdown-2-expandable").style.display = ""
    document.getElementById("dropdown-2").classList.add("dropdown-tab-click")
    document.getElementById("divider-6").style.display = ""
  }
}

function listenerDropdown1ToggleCallback() {
  if (document.getElementById("dropdown-1-expandable").style.display === "none") {
    document.getElementById("dropdown-chevron-1").src = "../assets/chevron-up.svg"
    document.getElementById("dropdown-1-expandable").style.display = ""
    document.getElementById("dropdown-1").classList.add("dropdown-tab-click")
    document.getElementById("divider-4").style.display = ""
  } else {
    document.getElementById("dropdown-chevron-1").src = "../assets/chevron-down.svg"
    document.getElementById("dropdown-1-expandable").style.display = "none"
    document.getElementById("dropdown-1").classList.remove("dropdown-tab-click")
    document.getElementById("divider-4").style.display = "none"
  }
}

function listenerDropdown2ToggleCallback() {
  if (document.getElementById("dropdown-2-expandable").style.display === "none") {
    document.getElementById("dropdown-chevron-2").src = "../assets/chevron-up.svg"
    document.getElementById("dropdown-2-expandable").style.display = ""
    document.getElementById("dropdown-2").classList.add("dropdown-tab-click")
    document.getElementById("divider-6").style.display = ""
  } else {
    document.getElementById("dropdown-chevron-2").src = "../assets/chevron-down.svg"
    document.getElementById("dropdown-2-expandable").style.display = "none"
    document.getElementById("dropdown-2").classList.remove("dropdown-tab-click")
    document.getElementById("divider-6").style.display = "none"
  }
}

function listenerDropdown1Toggle() {
  document.getElementById("dropdown-1").addEventListener("click", 
    listenerDropdown1ToggleCallback
  )
}

function listenerDropdown2Toggle() {
  document.getElementById("dropdown-2").addEventListener("click", 
    listenerDropdown2ToggleCallback
  )
}

function removeListenerDropdown1Toggle() {
  document.getElementById("dropdown-1").removeEventListener("click", 
    listenerDropdown1ToggleCallback
  )
}

function removeListenerDropdown2Toggle() {
  document.getElementById("dropdown-2").removeEventListener("click", 
    listenerDropdown2ToggleCallback
  )
}



/******************************************************************************/
/******************************************************************************/
/**********                 # Inflates main content                  **********/
/******************************************************************************/
/******************************************************************************/


/**
 * Redraws the popup for protection mode
 */
function showProtectionInfo() {
  removeFirstPartyDomainDNSToggle();
  removeListenerDropdown1Toggle();
  removeListenerDropdown2Toggle();
  document.getElementById("optMode-text").innerText = "Protection Mode";
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
  document.getElementById("run-analysis").style.display = "none";
  document.getElementById("stop-analysis").style.display = "none";
  document.getElementById("misc-options").style.display = "none";
  document.getElementById("download-analysis-data").style.display = "none";
  document.getElementById("analysis-list").style.display = "none";
  document.getElementById("domain-list").style.display = "";

  // Generate `Do Not Sell Enabled` elem
  renderDomainCounter(); // Render "X domains receiving signals" info section
  renderFirstPartyDomainDNSToggle(); // Render 1P domain "DNS Enabled/Disabled" text+toggle

  // Listeners associated with the buttons / toggles rendered above
  listenerFirstPartyDomainDNSToggle();
  listenerDropdown1Toggle();
  listenerDropdown2Toggle();

  chrome.runtime.sendMessage({
    msg: "POPUP_PROTECTION",
    data: null,
  }, (response) =>  { /*console.log(response)*/ });
}


/**
 * Redraws the popup for analysis mode
 */
function showAnalysisInfo() {
  removeFirstPartyDomainDNSToggle();
  removeListenerDropdown1Toggle();
  removeListenerDropdown2Toggle();
  document.getElementById("optMode-text").innerText = "Analysis Mode";
  document.getElementById("switch-label").innerHTML = "";
  document.getElementById("more-info-body").style.display = "none";
  document.getElementById("more-info-text").innerHTML = "none";
  document.getElementById("dropdown-1").style.display = "";
  document.getElementById("dropdown-2").style.display = "none";
  document.getElementById("dropdown-1-text").innerHTML = "Analysis Breakdown";
  document.getElementById("dropdown-2-text").innerHTML = "";
  document.getElementById("dropdown-1-expandable").innerHTML = "";
  document.getElementById("dropdown-2-expandable").innerHTML = "";
  document.getElementById("dropdown-1-expandable").style.display = "none";
  document.getElementById("dropdown-2-expandable").style.display = "none";
  document.getElementById("visited-domains-stats").style.display = "none";
  document.getElementById("run-analysis").style.display = "";
  document.getElementById("stop-analysis").style.display = "";
  document.getElementById("misc-options").style.display = "";
  document.getElementById("download-analysis-data").style.display = "";
  document.getElementById("analysis-list").style.display = "";
  document.getElementById("domain-list").style.display = "none";

  // renderDropdown1Toggle();
  listenerDropdown1Toggle();
  
  chrome.runtime.sendMessage({
    msg: "POPUP_ANALYSIS",
    data: null,
  }, (r) =>  { /*console.log(r)*/ });
}


/**
 * In sync with global scope `mode`
 * @param {Modes} mode - from modes.js
 */
async function switchMode(mode) {
  const analysisWarningShown = await storage.get(stores.settings, 'ANALYSIS_WARNING_SHOWN');
  if (!analysisWarningShown && mode === modes.analysis) {
    analysisWarning();
    storage.set(stores.settings, true, 'ANALYSIS_WARNING_SHOWN');
  }

  changeOptModeIcon();
  if (mode === modes.protection) {
    console.log("Switching to protection view");
    showProtectionInfo();
  } else {
    console.log("Switching to analysis view");
    showAnalysisInfo();
  }
}


/**
 * Initializes the popup window after DOM content is loaded
 * @param {Object} event - contains information about the event
 */
document.addEventListener("DOMContentLoaded", async (event) => {

  isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");
  mode = await storage.get(stores.settings, "MODE");
  parsedDomain = await getCurrentParsedDomain(); // This must happen first

  renderExtenionIsEnabledDisabled(isEnabled, isDomainlisted); // Render global ENABLED/DISABLED mode
  listenerExtensionIsEnabledDisabledButton(isEnabled);

  renderFirstPartyDomain(parsedDomain); // Render 1P domain 

  generateDarkmodeElement();  // Render darkmode
  // changeOptModeIcon();

  switchMode(mode); // requires global scope mode to be loaded
})



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
  document.getElementById(`input-${requestDomain}`).addEventListener("click", async () => {
    chrome.runtime.sendMessage({ msg: "TURN_ON_OFF", data: { isEnabled: true } });
    chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: true } });
    const requestDomainValue = await storage.get(stores.domainlist, requestDomain)
    let elemString = "";
    if (requestDomainValue) {
      elemString = "Do Not Sell Disabled";
      setToDomainlist(requestDomain, false);
    } else {
      elemString = "Do Not Sell Enabled";
      setToDomainlist(requestDomain, true);
    }
    document.getElementById(`dns-enabled-text-${requestDomain}`).innerHTML = elemString;
  })
};

/**
 * Builds the requested domains HTML of the popup window
 * @param {Object} requests - Contains all request domains for the current tab
 * (requests = tabs[activeTabID].requestDomainS; passed from background page)
 */
async function buildDomains(requests) {
  let items = "";
  const domainlistKeys = await storage.getAllKeys(stores.domainlist)
  const domainlistValues = await storage.getAll(stores.domainlist)

  // Sets the 3rd party domain elements
  for (let requestDomain in requests) {
    let checkbox = ""
    let text = ""
    // Find correct index
    let index = domainlistKeys.indexOf(requestDomain)
    if (index > -1 && domainlistValues[index] === true) {
      checkbox = `<input type="checkbox" id="input-${requestDomain}" checked/>`
      text = "Do Not Sell Enabled"
    } else {
      checkbox = `<input type="checkbox" id="input-${requestDomain}"/>`
      text = "Do Not Sell Disabled"
    }

    items +=
      `
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
              <!-- <input type="checkbox" id="input"/> -->
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
  document.getElementById("dropdown-1-expandable").innerHTML = items;

  // Sets the 3rd party domain toggle listeners
  for (let requestDomain in requests) {
    addThirdPartyDomainDNSToggleListener(requestDomain)
  }

}

/**
 * Builds the Well Known HTML for the popup window
 * @param {Object} requests - Contains all well-known info in current tab
 * (requests passed from contentScript.js page as of v1.1.3)
 */
async function buildWellKnown(requests) {
  //console.log("Well-Known info: ", requests);
  //console.log(JSON.stringify(requests, null, 4))

  let explainer;
  // let tabDetails;

  /*
  This iterates over the cases of possible combinations of
  having found a GPC policy, and whether or not a site respects
  the signal or not, setting both the `explainer` and `tabDetails`
  for GPC v1
  */
  if (requests !== null && requests["gpc"] == true) {
    // tabDetails = `GPC Signals Accepted`;
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
      `
  } else if (requests !== null && requests["gpc"] == false) {
    // tabDetails = `GPC Signals Rejected`;
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
      `
  } else if (requests === null || requests["gpc"] == null) {
    // tabDetails = `GPC Policy Missing`;
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
      `
  }

  let wellknown = (requests !== null && requests["gpc"] != null) ? `
    <li class="uk-text-center uk-text-small">
      Here is the GPC policy:
    </li>
    <li>
      <pre class="wellknown-bg">
        ${JSON.stringify(requests, null, 4)
            .replace(/['"\{\}\n]/g, '')
            .replace(/,/g, "\n")
          }
      </pre>
    </li>
  ` : ``;

  document.getElementById("dropdown-2-expandable").innerHTML = `${explainer} ${wellknown}`;
  // document.getElementById("website-response-tab").innerHTML = tabDetails;
}


/**
 * Builds Analysis info dropdown in dropdown-1
 */
async function buildAnalysis(data) {
  let pos = "../../../assets/cat-w-text/check1.png";
  let neg = "../../../assets/cat-w-text/cross1.png"
  let specs = `style= "
      margin-right: -20px;
      margin-left: auto;
      margin-top: auto;
      margin-bottom: auto;
      padding-right: 5px;
      padding-left: 5px;"
    `

  // const data = await storage.get(stores.analysis, parsedDomain);
  console.log("stores.analysis", data);

  let items         = "";
  let dnsLink       = (data.DO_NOT_SELL_LINK_EXISTS) ? pos : neg;
  let stringFound;
  let gpcSent       = (data.SENT_GPC) ? pos : neg;
  let beforeGPCUSPAPI     = data.USPAPI_BEFORE_GPC;
  let afterGPCUSPAPI      = data.USPAPI_AFTER_GPC;
  let beforeGPCUSPCookies = data.USP_COOKIES_BEFORE_GPC;
  let afterGPCUSPCookies  = data.USP_COOKIES_AFTER_GPC;

  let uspStringBeforeGPC;
  let uspStringAfterGPC;

  // console.log("beforeGPCUSPCookies", beforeGPCUSPCookies);
  // console.log("afterGPCUSPCookies", afterGPCUSPCookies);

  // Generate the US Privacy String BEFORE GPC is sent
  // Give priority to the USPAPI over USP Cookie
  if (beforeGPCUSPAPI && beforeGPCUSPAPI[0] && beforeGPCUSPAPI[0]["uspString"]) {
    // console.log("Triggering 1A:")
    uspStringBeforeGPC = beforeGPCUSPAPI[0]["uspString"];   // USPAPI exists
  } else {
    // console.log("Triggering 1B:")
    if (beforeGPCUSPCookies && beforeGPCUSPCookies[0] && beforeGPCUSPCookies[0]["value"]) {
      // console.log("Triggering 1C:")
      uspStringBeforeGPC = beforeGPCUSPCookies[0]["value"]; // USP Cookie exists
    } else {
      // console.log("Triggering 1D:")
      uspStringBeforeGPC = data.USPAPI_OPTED_OUT || data.USP_COOKIE_OPTED_OUT;
    }
  }

  // Generate the US Privacy String AFTER GPC is sent
  // Give priority to the USPAPI over USP Cookie
  if (afterGPCUSPAPI && afterGPCUSPAPI[0] && afterGPCUSPAPI[0]["uspString"]) {
    // console.log("Triggering 2A:")
    uspStringAfterGPC = afterGPCUSPAPI[0]["uspString"];
  } else {
    // console.log("Triggering 2B");
    if (afterGPCUSPCookies && afterGPCUSPCookies[0] && afterGPCUSPCookies[0]["value"]) {
      // console.log("Triggering 2C");
      uspStringAfterGPC = afterGPCUSPCookies[0]["value"];
    } else {
      // console.log("Triggering 2D");
      uspStringAfterGPC = data.USPAPI_OPTED_OUT || data.USP_COOKIE_OPTED_OUT;
    }
  }

  if (!beforeGPCUSPAPI && !beforeGPCUSPCookies) {
    stringFound = neg;
  } else {
    let existsUSP = ((beforeGPCUSPAPI.length!=0) || (beforeGPCUSPCookies.length!=0)) ? true : false;
    let existsAndIsValidBeforeGPCUSPAPI;
    let existsAndIsValidBeforeGPCUSPCookies;

    if (beforeGPCUSPAPI && beforeGPCUSPAPI[0] && beforeGPCUSPAPI[0].uspString) {
      existsAndIsValidBeforeGPCUSPAPI = isValidSignalIAB(beforeGPCUSPAPI[0].uspString)
    } else {
      existsAndIsValidBeforeGPCUSPAPI = false;
    }
    if (beforeGPCUSPCookies && beforeGPCUSPCookies[0] && beforeGPCUSPCookies[0].value) {
      existsAndIsValidBeforeGPCUSPCookies = isValidSignalIAB(beforeGPCUSPCookies[0].value)
    } else {
      existsAndIsValidBeforeGPCUSPCookies = false;
    }

    stringFound = (existsUSP && 
      (existsAndIsValidBeforeGPCUSPAPI || existsAndIsValidBeforeGPCUSPCookies))
      ? pos : neg;
  }

  let stringChanged;
  let optedOut;
  if (data.USPAPI_OPTED_OUT) {
    optedOut = data.USPAPI_OPTED_OUT;
  } else {
    optedOut = data.USP_COOKIE_OPTED_OUT;
  }
  if (typeof optedOut === 'string') {
    // console.log("Triggering 3A:");
    if (optedOut === "PARSE_FAILED") {
      // console.log("Triggering 3B:");
      stringChanged = neg;
    } else if (optedOut === "NOT_IN_CA") {
      // console.log("Triggering 3C:");
      stringChanged = neg;
    }
  } else {
    // console.log("Triggering 3D:");
    // console.log("optedOut: ", optedOut);
    stringChanged = optedOut ? pos : neg;
  }
  // console.log("data.USP_OPTED_OUT", data.USP_OPTED_OUT);
  // console.log("optedOut", optedOut);
  // console.log("stringChanged", stringChanged);

  // Sets the 3rd party domain elements
    items += `
  <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
      <div class="domain uk-width-expand">
        Do Not Sell Link 
      </div>
      <img src = ${dnsLink} width = "40px" height = "40px" ${specs}>
    </div>
  </li>
  <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
      <div class="domain uk-width-expand">
        US Privacy String 
      </div>
      <button class="uk-badge uspStringElem">${uspStringBeforeGPC}</button>
      <img src = ${stringFound} width = "40px" height = "40px" ${specs}>
    </div>
  </li>
  <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
      <div class="domain uk-width-expand">
        GPC Signal Sent
      </div>
      <img src = ${gpcSent} width = "40px" height = "40px" ${specs}>
    </div>
  </li>
  <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
      <div class="domain uk-width-expand">
        US Privacy String Updated 
      </div>
      <button class="uk-badge uspStringElem">${uspStringAfterGPC}</button>
      <img src = ${stringChanged} width = "40px" height = "40px" ${specs}>
    </div> 
  </li>`;

  document.getElementById("dropdown-1-expandable").innerHTML = items;
}

/**
 * Builds per-site compliance snippet
 */
async function buildComplianceInfo(data) {
  console.log("Compliance is running...")
  let checkbox = ""
  if (parsedDomain) {
    try {
    //   const data = await storage.get(stores.analysis, parsedDomain)
      console.log(parsedDomain);
      if (data.DO_NOT_SELL_LINK_EXISTS 
          && data.SENT_GPC 
          && (data.USPAPI_OPTED_OUT || data.USP_COOKIE_OPTED_OUT)
          && ((data.USPAPI_BEFORE_GPC.length != 0) || (data.USP_COOKIES_BEFORE_GPC.length != 0)) 
          && ((isValidSignalIAB(data.USPAPI_BEFORE_GPC[0].uspString)) || 
                (isValidSignalIAB(data.USP_COOKIES_BEFORE_GPC[0].uspString)))
        ) {
        checkbox = `<div
        id = "${parsedDomain} compliance"
        class="uk-badge"
        style="
          margin-right: auto;
          margin-left: auto;
          margin-top: auto;
          margin-bottom: auto;
          padding-right: auto;
          padding-left: auto;
          background-color: white;
          border: 1px solid rgb(64,107,202);
          color: rgb(64,107,202);
          font-size: 12px;
        "
      >
        Compliant
      </div>`;
      } else {
        checkbox = `<div
        id = "${parsedDomain} compliance"
        class="uk-badge"
        style="
          margin-right: auto;
          margin-left: auto;
          margin-top: auto;
          margin-bottom: auto;
          padding-right: auto;
          padding-left: auto;
          background-color: white;
          border: 1px solid rgb(222,107,20);
          color: rgb(222,107,20);
          font-size: 12px;
        "
      >
        Not Compliant
      </div>`;
      }
      document.getElementById("switch-label").innerHTML = checkbox;
    } catch(e) {
      console.error(e);
      document.getElementById("switch-label").innerHTML = checkbox;
    }
  } else {
    document.getElementById("switch-label").innerHTML = checkbox;
  }

}



/******************************************************************************/
/******************************************************************************/
/**********                   # Message handling                     **********/
/******************************************************************************/
/******************************************************************************/

// Initializng a longterm port with the top-level background for the onDisconnect event
let backgroundPort = chrome.runtime.connect({ name: "POPUP" });
backgroundPort.postMessage({ msg: "REQUEST_MODE" });  // queries control.js for mode
backgroundPort.onMessage.addListener(function(message) {
  if (message.msg === "RESPONSE_MODE") {  // when mode is recieved from control.js
    mode = message.data;                  // global mode variable
    if (mode && mode === modes.analysis) {

    }
  }
})
// console.log("SENT CONNECTION");

/**
 * Listens for messages from background page that call functions to populate
 * the popup badge counter and build the popup domain list HTML, respectively
 */
chrome.runtime.onMessage.addListener(function (message, _, __) {
  if (message.msg === "RELOAD_DUE_TO_MODE_CHANGE") {
  }
  if (message.msg === "POPUP_PROTECTION_DATA") {
    let { requests, wellknown } = message.data;
    domainsInfo = requests;
    wellknownInfo = wellknown;
    buildDomains(requests);
    buildWellKnown(wellknown);
  }
  if (message.msg === "POPUP_ANALYSIS_DATA") {
    analysis = message.data.analysis;
    analysis_userend = message.data.analysis_userend;
    let data = analysis_userend[parsedDomain] || {};
    buildAnalysis(data);
    // buildComplianceInfo(data);
  }
  if (message.msg === "CSV_DATA_RESPONSE") {
    csvGenerator(message.data.csvData, message.data.titles);
  }
});


// Initializes the process to add to domainlist, via the background script
// This is to ensure all processes happen correctly
function setToDomainlist(d, k) {
  chrome.runtime.sendMessage({
    msg: "SET_TO_DOMAINLIST",
    data: { domain: d, key: k }
  }, (response) => { /*console.log(response)*/ })
}



/******************************************************************************/
/******************************************************************************/
/**********                  # Tutorial walkthorugh                  **********/
/******************************************************************************/
/******************************************************************************/




// Walkthrough function
function popUpWalkthrough() {
  let contentStr = (mode === modes.analysis) ? 
    "Analysis Mode collects info about the current site's CCPA compliance" 
    : "Toggle this switch to enable or disable sending Do Not Sell signals to this site in Protection mode";
  tippy(".tooltip-1", {
    content:
      contentStr,
    trigger: "manual",
    placement: "bottom",
    duration: 1000,
    theme: "custom-2",
    maxWidth: 250,
  });
  let tooltip = document.getElementsByClassName("tooltip-1")[0]
    ._tippy;
  tooltip.show();
}

// Init: Check to see if we should do tutorial
async function initPopUpWalkthrough() {
  const tutorialShownInPopup = await storage.get(stores.settings, 'TUTORIAL_SHOWN_IN_POPUP');
  const mode = await storage.get(stores.settings, "MODE"); //copied
  //const analysisWarningShown = await storage.get(stores.settings, 'ANALYSIS_WARNING_SHOWN');

  // console.log("Tutorial shown: ", tutorialShownInPopup)
  if (!tutorialShownInPopup) {
    popUpWalkthrough(mode);
    storage.set(stores.settings, true, 'TUTORIAL_SHOWN_IN_POPUP');
  }
  /*
  if (!analysisWarningShown && mode === modes.analysis) {
    analysisWarning();
    storage.set(stores.settings, true, 'ANALYSIS_WARNING_SHOWN');
  }
  */
}



/******************************************************************************/
/******************************************************************************/
/**********           # Misc. initializers and listeners             **********/
/******************************************************************************/
/******************************************************************************/


/**
 * Download analysis data button
 */
function downloadCSVOnClick() {
  chrome.runtime.sendMessage({
    msg: "CSV_DATA_REQUEST"
  })
}

/**
 * Run analysis button
 */
function runAnalysisButtonOnClick() {
  backgroundPort.postMessage({ msg: "RUN_ANALYSIS_FROM_BACKGROUND", data: null });
}

/**
 * Stop analysis button
 */
function stopAnalysisButtonOnClick() {
  backgroundPort.postMessage({ msg: "STOP_ANALYSIS_FROM_BACKGROUND", data: null });
}

/**
 * Mode switch button
 */
function loadChangeMode() {
  let modeButton = document.getElementById("optMode");
  modeButton.addEventListener('click', function() {
    let newMode = (mode === modes.analysis) ? modes.protection : modes.analysis;
    mode = newMode;
    // changeOptModeIcon();
    chrome.runtime.sendMessage({
      msg: "CHANGE_MODE",
      data: newMode
    })
    switchMode(mode);
  })
}
loadChangeMode();

// Listener: Opens options page
document.getElementById("more").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Listener: Opens domainlist in options page
document.getElementById("domain-list").addEventListener("click", async () => {
  await storage.set(stores.settings, true, "DOMAINLIST_PRESSED");
  chrome.runtime.openOptionsPage();
});

// Listener: Opens analysislist in options page
document.getElementById("analysis-list").addEventListener("click", async () => {
  await storage.set(stores.settings, true, "ANALYSIS_PRESSED");
  chrome.runtime.openOptionsPage();
});

// Listener: Opens analysislist in options page
document.getElementById("run-analysis").addEventListener("click", 
  runAnalysisButtonOnClick
);

// Listener: Opens analysislist in options page
document.getElementById("stop-analysis").addEventListener("click", 
  stopAnalysisButtonOnClick
);

// Listener: Opens analysislist in options page
document.getElementById("download-analysis-data").addEventListener("click", 
  downloadCSVOnClick
);



/******************************************************************************/
/******************************************************************************/
/**********             # Mode switching functionality               **********/
/******************************************************************************/
/******************************************************************************/


/**
 * For Chrome users:
 * We don't want to expose analysis mode to chrome users
 */
if ("$BROWSER" != "firefox") {
  document.getElementById("optMode-parent").style.display = "none";
}
