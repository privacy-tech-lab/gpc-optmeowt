/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
popup.js
================================================================================
popup.js supplements and renders complex elements on popup.html
*/


import { stores, storage } from "../background/storage.js";
import { modes } from "../data/modes.js";
import "../../node_modules/uikit/dist/css/uikit.min.css"
import "../../node_modules/animate.css/animate.min.css"
import "./styles.css"
import psl from "psl"
import "../../node_modules/uikit/dist/js/uikit"
import "../../node_modules/uikit/dist/js/uikit-icons"
import "../../node_modules/@popperjs/core/dist/umd/popper"
import tippy from "../../node_modules/tippy.js/dist/tippy-bundle.umd";
import Darkmode from "../theme/darkmode";


var mode = undefined;


/******************************************************************************/
/******************************************************************************/
/**********       # First-to-load popup components (essential)       **********/
/******************************************************************************/
/******************************************************************************/

//Init: initialize darkmode button
function renderDarkmodeElement() {
  const darkmode = new Darkmode();

  // Darkmode text
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
}

// Listener: Dark mode listener for `main-view.js`
function listenerDarkmodeButton() {
  document.getElementById("darkSwitch").addEventListener("click", () => {
    chrome.runtime.sendMessage({
  	  msg: "DARKSWITCH_PRESSED",
    });
    darkmode.toggle();
  });
}

function getCurrentParsedDomain() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];
        let url = new URL(tab.url);
        let parsed = psl.parse(url.hostname);
        let parsedDomain = parsed.domain;
        resolve(parsedDomain);
      });
    } catch(e) {
      console.log(e)
      reject();
    }
  })
}

function renderFirstPartyDomain(parsedDomain) {
  if (parsedDomain) {
    document.getElementById("domain-title").innerHTML = parsedDomain;
    initPopUpWalkthrough();
  } else {
    document.getElementById("dns-enabled-body").style.display = "none";
    document.getElementById("domain-title").style.display = "none";
  }
}

function renderExtenionIsEnabledDisabled(isEnabled, isDomainlisted, mode) {
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
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: false } });
    } else {
      document.getElementById("img").src =
        "../assets/pause-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Disable");
      document.getElementById("content").style.opacity = "1";
      document.getElementById("extension-disabled-message").style.opacity = "0";
      document.getElementById("extension-disabled-message").style.display = "none";
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: true } });
    }
  });
}


async function renderFirstPartyDomainToggle(parsedDomain) {
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
      document.getElementById("dns-enabled-text").innerHTML = text;
    } catch(e) {
      console.error(e);
      document.getElementById("switch-label").innerHTML = checkbox;
      document.getElementById("dns-enabled-text").innerHTML = text;
    }
  } else {
    document.getElementById("switch-label").innerHTML = checkbox;
    document.getElementById("dns-enabled-text").innerHTML = text;
  }
}

function listenerFirstPartyDomainToggle() {
  document.getElementById("switch-label").addEventListener("click", async () => {
    chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: true } });
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
    document.getElementById("dns-enabled-text").innerHTML = elemString;
  })
}

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

function renderThirdPartyDomainToggle() {
  document.getElementById("dropdown-1").addEventListener("click", () => {
    if (document.getElementById("dropdown-1-expandable").style.display === "none") {
      document.getElementById("dropdown-chevron-1").src = "../assets/chevron-up.svg"
      document.getElementById("dropdown-1-expandable").style.display = ""
      document.getElementById("dropdown-1").classList.add("dropdown-tab-click")
      document.getElementById("divider-1").style.display = ""
    } else {
      document.getElementById("dropdown-chevron-1").src = "../assets/chevron-down.svg"
      document.getElementById("dropdown-1-expandable").style.display = "none"
      document.getElementById("dropdown-1").classList.remove("dropdown-tab-click")
      document.getElementById("divider-1").style.display = "none"
    }
  });
}

function listenerThirdPartyDomainToggle() {
  document.getElementById("dropdown-2").addEventListener("click", () => {
    if (document.getElementById("dropdown-2-expandable").style.display === "none") {
      document.getElementById("dropdown-chevron-2").src = "../assets/chevron-up.svg"
      document.getElementById("dropdown-2-expandable").style.display = ""
      document.getElementById("dropdown-2").classList.add("dropdown-tab-click")
      document.getElementById("divider-2").style.display = ""
    } else {
      document.getElementById("dropdown-chevron-2").src = "../assets/chevron-down.svg"
      document.getElementById("dropdown-2-expandable").style.display = "none"
      document.getElementById("dropdown-2").classList.remove("dropdown-tab-click")
      document.getElementById("divider-2").style.display = "none"
    }
  });
}



/******************************************************************************/
/******************************************************************************/
/**********                 # Inflates main content                  **********/
/******************************************************************************/
/******************************************************************************/

/**
 * Initializes the popup window after DOM content is loaded
 * @param {Object} event - contains information about the event
 */
document.addEventListener("DOMContentLoaded", async (event) => {

  const isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  const isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");
  const mode = await storage.get(stores.settings, "MODE");
  const parsedDomain = await getCurrentParsedDomain(); // This must happen first

  renderExtenionIsEnabledDisabled(isEnabled, isDomainlisted, mode); // Render global ENABLED/DISABLED mode
  renderFirstPartyDomain(parsedDomain); // Render 1P domain 
  renderFirstPartyDomainToggle(parsedDomain); // Render 1P domain "DNS Enabled/Disabled" text+toggle
  renderDomainCounter(); // Render "X domains receiving signals" info section
  renderThirdPartyDomainToggle(); // Render 3rd party domain list dropdown
  renderDarkmodeElement();  // Render darkmode

  // Listeners associated with the buttons / toggles rendered above
  listenerExtensionIsEnabledDisabledButton(isEnabled, isDomainlisted, mode);
  listenerFirstPartyDomainToggle();
  listenerThirdPartyDomainToggle();
  listenerDarkmodeButton();
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
function addThirdPartyDomainToggleListener(requestDomain) {
  document.getElementById(`input-${requestDomain}`).addEventListener("click", async () => {
    chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: true } });
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
    addThirdPartyDomainToggleListener(requestDomain)
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
      loadModeButton();
      loadCSVDownloadButton();
  }
  }
})
// console.log("SENT CONNECTION");

/**
 * Listens for messages from background page that call functions to populate
 * the popup badge counter and build the popup domain list HTML, respectively
 */
chrome.runtime.onMessage.addListener(function (message, _, __) {
  if (message.msg === "POPUP_DATA") {
    let { requests, wellknown } = message.data;
    buildDomains(requests);
    buildWellKnown(wellknown);
  }
  if (message.msg === "POPUP_DATA") {
    var analysis = message.data.analysis;
    var analysis_userend = message.data.analysis_userend;
  }
  if (message.msg === "CSV_DATA_RESPONSE") {
    downloadCSVOnClickCallback(message.data.csvData, message.data.titles);
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

// function setMode(mode) {
//   chrome.runtime.sendMessage({
//     msg: "CHANGE_MODE",
//     data: { "DOMAIN": domain, "KEY": key }
//   }, (response) => { /*console.log(response)*/ })
// }

/**
 * Sends "POPUP" message to background page to retrieve necessary info
 */
chrome.runtime.sendMessage({
  msg: "POPUP",
  data: null,
}, (response) =>  { /*console.log(response)*/ });



/******************************************************************************/
/******************************************************************************/
/**********                     # Analysis Mode                      **********/
/******************************************************************************/
/******************************************************************************/

function modeBadgeButtonOnClick() {
  backgroundPort.postMessage({ msg: "RUN_ANALYSIS_FROM_BACKGROUND", data: null });
}

function downloadCSVOnClick() {
  chrome.runtime.sendMessage({
    msg: "CSV_DATA_REQUEST"
  })
}

/**
 * Generates the CSV to download consisting of the data in `csvData` with column
 * titles according to `titles` — specifically for analysis_userend
 * @param {Object} csvData 
 * @param {Object} titles 
 */
function downloadCSVOnClickCallback(csvData, titles) {

  // columnTitles is an array of "Domain" + the rest of the column titles defined 
  // as the keys in the `titles` object. 
  let columnTitles = ["Domain"];
  (Object.keys(titles)).map((key, i) => columnTitles.push(key));

  let csvContent = "data:text/csv;charset=utf-8,";  // inits the top of the csv
  csvContent += columnTitles.join(",") + "\n"       // appends the column titles

  for (let property in csvData) {                   // appends the data
    csvContent += property + ",";
    for (let i=1; i<columnTitles.length; i++) {
      let stringifiedProp = JSON.stringify(csvData[property][columnTitles[i]]);
      if (typeof stringifiedProp === "string") {
        stringifiedProp = stringifiedProp.replace(/"/g, "\'");  // handles quotes in csv files
      }
      csvContent += '\"' + stringifiedProp + "\",";
    }
    csvContent += "\n"
  }
  
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "my_data.csv");
  document.body.appendChild(link);

  link.click();
}

// This is a temporary mode button injector to make it easy to call a page refresh
function loadModeButton() {
  let modeBadge = document.getElementById("mode-badge");
  let modeBadgeHTML = `<button id="mode-badge-button" class="importexport-button">Run Analysis</button>`;
  modeBadge.innerHTML = modeBadgeHTML;

  let modeBadgeButton = document.getElementById("mode-badge-button");
  modeBadgeButton.addEventListener('click', modeBadgeButtonOnClick);
}

function loadCSVDownloadButton() {
  let download = document.getElementById("test-csv");
  let downloadHTML = `<button id="csv-download-button" class="importexport-button">Download</button>`; 
  download.innerHTML = downloadHTML;

  let downloadButton = document.getElementById("csv-download-button");
  downloadButton.addEventListener('click', downloadCSVOnClick);
}



/******************************************************************************/
/******************************************************************************/
/**********                  # Tutorial walkthorugh                  **********/
/******************************************************************************/
/******************************************************************************/

// Init: Check to see if we should do tutorial
async function initPopUpWalkthrough() {
  const tutorialShownInPopup = await storage.get(stores.settings, 'TUTORIAL_SHOWN_IN_POPUP');
  // console.log("Tutorial shown: ", tutorialShownInPopup)
  if (!tutorialShownInPopup) {
    popUpWalkthrough();
  }
  storage.set(stores.settings, true, 'TUTORIAL_SHOWN_IN_POPUP');
}

// Walkthrough function
function popUpWalkthrough() {
  tippy(".tooltip-1", {
    content:
      "Toggle this switch to enable or disable sending Do Not Sell signals to this site",
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


/******************************************************************************/
/******************************************************************************/
/**********           # Misc. initializers and listeners             **********/
/******************************************************************************/
/******************************************************************************/

// Listener: Opens options page
document.getElementById("more").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Listener: Opens domainlist in options page
document.getElementById("domain-list").addEventListener("click", async () => {
  await storage.set(stores.settings, true, "DOMAINLIST_PRESSED");
  chrome.runtime.openOptionsPage();
});
