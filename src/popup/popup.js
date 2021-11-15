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

// CSS TO JS IMPORTS
import "../../node_modules/uikit/dist/css/uikit.min.css"
import "../../node_modules/animate.css/animate.min.css"
import "./styles.css"

// HTML TO JS IMPORTS - TOP OF `popup.html`
import psl from "psl"
import "../../node_modules/uikit/dist/js/uikit"
import "../../node_modules/uikit/dist/js/uikit-icons"

// HTML TO JS IMPORTS - BOTTOM OF `popup.html`
import "../../node_modules/@popperjs/core/dist/umd/popper"
import tippy from "../../node_modules/tippy.js/dist/tippy-bundle.umd";

// MISC. IMPORTS THRUOUT FILE
import Darkmode from "../theme/darkmode";


var mode = undefined;


/******************************************************************************/
// Inflates main content

//Note: this must be initialized first
var parsedDomain = "";

/**
 * Initializes the popup window after DOM content is loaded
 * @param {Object} event - contains information about the event
 */
document.addEventListener("DOMContentLoaded", async (event) => {

  // DARK MODE
  const darkmode = new Darkmode();

  //Init: initialize darkmode button
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

  // Listener: Dark mode listener for `main-view.js`
  document.getElementById("darkSwitch").addEventListener("click", () => {
    chrome.runtime.sendMessage({
  	  msg: "DARKSWITCH_PRESSED",
    });

    if (darkmode.isActivated()){
      document.getElementById("optMode").style.color = "rgb(89,98,127)";
      document.getElementById("optMode").style.border = "1px solid rgb(89,98,127)";
      if (document.getElementById("a-light").style.display = ""){
        document.getElementById("a-light").style.display = "none"
        document.getElementById("a-dark").style.display = ""
      }  else if (document.getElementById("p-light").style.display = ""){
        document.getElementById("p-light").style.display = "none"
        document.getElementById("p-dark").style.display = ""
      }
    } else {
      document.getElementById("optMode").style.color = "rgb(238,238,238)"
      document.getElementById("optMode").style.border = "1px solid rgb(238,238,238)"
      if (document.getElementById("a-dark").style.display = ""){
        document.getElementById("a-dark").style.display = "none"
        document.getElementById("a-light").style.display = ""
      }  else if (document.getElementById("p-dark").style.display = ""){
        document.getElementById("p-dark").style.display = "none"
        document.getElementById("p-light").style.display = ""
      }
    }

    darkmode.toggle();

  });
  

  async function dnsEnabled(){
    let checkbox;
    let text;
    document.getElementById("compliance-body").style.display = "none"
    document.getElementById("dns-enabled-body").style.display = "";
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


  // Init: Queries, parses, and sets the visible active tab 1st party domain
  // NOTE: This MUST happen first. The rest can be rendered separately.
  await (async () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];
        try {
          let url = new URL(tab.url);
          let parsed = psl.parse(url.hostname);
          parsedDomain = parsed.domain;

          if (parsedDomain) {
            document.getElementById("domain-title").innerHTML = parsedDomain;

            // Initializes the tutorial if it needs to be loaded
            initPopUpWalkthrough();

          } else {
            document.getElementById("dns-enabled-body").style.display = "none";
            document.getElementById("domain-title").style.display = "none";
          }
          resolve();
        } catch(e) {
          console.error(e);
          document.getElementById("domain-title").innerHTML = location.href;
          reject();
        }
      });
    })
  })();

  // Init: ENABLE/DISABLE button to the correct mode
  // const mode = await storage.get(stores.settings, "MODE");

  const isEnabled = await storage.get(stores.settings, "IS_ENABLED");
  const isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");

  if (isEnabled === undefined || isDomainlisted === undefined) {
    document.getElementById("img").src = "../assets/play-circle-outline.svg";
    document
      .getElementById("enable-disable")
      .setAttribute("uk-tooltip", "Enable");
  // } else if (mode === modes.readiness.enabled || mode === modes.readiness.domainlisted) {
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

  // Listener: ENABLE/DISABLE button
  document.getElementById("enable-disable").addEventListener("click", async () => {
    // const mode = await storage.get(stores.settings, 'MODE');
    const isEnabled = await storage.get(stores.settings, "IS_ENABLED");
    const isDomainlisted = await storage.get(stores.settings, "IS_DOMAINLISTED");
    // if (mode === modes.readiness.enabled || mode === modes.readiness.domainlisted) {
    if (isEnabled) {
      document.getElementById("extension-disabled-message").style.display = "";
      document.getElementById("img").src =
        "../assets/play-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Enable");
      document.getElementById("content").style.opacity = "0.1";
      document.getElementById("extension-disabled-message").style.opacity = "1";
      // chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: modes.readiness.disabled })
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: false } });
      // chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: false } });
    } else {
      document.getElementById("img").src =
        "../assets/pause-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Disable");
      document.getElementById("content").style.opacity = "1";
      document.getElementById("extension-disabled-message").style.opacity = "0";
      document.getElementById("extension-disabled-message").style.display = "none";
      // chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: modes.readiness.enabled })
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: true } });
      // chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: false } });
    }
  });

  // Init: 1st party domain "Do Not Sell Enabled/Disabled" text + toggle
  let checkbox = "";
  let text = "";

  if (!darkmode.isActivated()){
    document.getElementById("optMode").style.color = "rgb(89,98,127)";
    document.getElementById("optMode").style.border = "1px solid rgb(89,98,127)";
    if (document.getElementById("a-light").style.display = ""){
      document.getElementById("a-light").style.display = "none"
      document.getElementById("a-dark").style.display = ""
    }  else if (document.getElementById("p-light").style.display = ""){
      document.getElementById("p-light").style.display = "none"
      document.getElementById("p-dark").style.display = ""
    }
  } else {
    document.getElementById("optMode").style.color = "rgb(238,238,238)"
    document.getElementById("optMode").style.border = "1px solid rgb(238,238,238)"
    if (document.getElementById("a-dark").style.display = ""){
      document.getElementById("a-dark").style.display = "none"
      document.getElementById("a-light").style.display = ""
    }  else if (document.getElementById("p-dark").style.display = ""){
      document.getElementById("p-dark").style.display = "none"
      document.getElementById("p-light").style.display = ""
    }
  }


  dnsEnabled();

  // Listener: 1st party domain "Do Not Sell Enabled/Disabled" text + toggle
  document.getElementById("switch-label").addEventListener("click", async () => {
    // await storage.set(stores.settings, extensionMode.domainlisted, 'MODE');
    // chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: modes.readiness.domainlisted })
    chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: true } });
    chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: true } });
    const parsedDomainValue = await storage.get(stores.domainlist, parsedDomain);
    let elemString = "";
    if (parsedDomainValue) {
      elemString = "Do Not Sell Disabled";
      // await storage.set(stores.domainlist, false, parsedDomain);
      setToDomainlist(parsedDomain, false);
    } else {
      elemString = "Do Not Sell Enabled";
      // await storage.set(stores.domainlist, true, parsedDomain);
      setToDomainlist(parsedDomain, true);
    }
    document.getElementById("dns-enabled-text").innerHTML = elemString;
  })

  // Init: Sets "X domains receiving signals" information section
  const domainlistValues = await storage.getAll(stores.domainlist);
  let count = Object.keys(domainlistValues).filter((key) => {
    return domainlistValues[key] == true;
  }).length
  document.getElementById("visited-domains-stats").innerHTML = `
    <p id = "domain-count" class="blue-heading" style="font-size:25px;
    font-weight: bold">${count}</p> domains receiving signals
  `;

  // Listener: Generates 3rd party domain list droptdown toggle functionality
  document.getElementById("dropdown-1").addEventListener("click", () => {
    // var icon = document.getElementById("dropdown")
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
  });

  // Listener: Generates wellknown json dropdown list toggle functionality
  document.getElementById("dropdown-2").addEventListener("click", () => {
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
  });

  
})


/******************************************************************************/
// Generates dropdown information

/**
 * Builds the listener to enable toggling 3rd party domains on/off in domainlist
 * @param {String} requestDomain - the domain related to the element which
 * the listener should be attached
 */
function addThirdPartyDomainToggleListener(requestDomain) {
  document.getElementById(`input-${requestDomain}`).addEventListener("click", async () => {
    // await storage.set(stores.settings, extensionMode.domainlisted, 'MODE')
    // chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: modes.readiness.domainlisted })
    chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: { isEnabled: true } });
    chrome.runtime.sendMessage({ msg: "CHANGE_IS_DOMAINLISTED", data: { isDomainlisted: true } });
    const requestDomainValue = await storage.get(stores.domainlist, requestDomain)
    let elemString = "";
    if (requestDomainValue) {
      elemString = "Do Not Sell Disabled"
      // await storage.set(stores.domainlist, false, requestDomain)
      setToDomainlist(requestDomain, false);
      // chrome.runtime.sendMessage({ msg: "ADD_TO_DOMAINLIST", data: { "DOMAIN": requestDomain, "KEY": false } })
    } else {
      elemString = "Do Not Sell Enabled"
      // await storage.set(stores.domainlist, true, requestDomain);
      // chrome.runtime.sendMessage({ msg: "ADD_TO_DOMAINLIST", data: { "DOMAIN": requestDomain, "KEY": true } })
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
// Message passing

// Initializng a longterm port with the background for the onDisconnect event
let backgroundPort = chrome.runtime.connect({ name: "POPUP" });
backgroundPort.postMessage({ msg: "REQUEST_MODE" });
backgroundPort.onMessage.addListener(function(message) {
  if (message.msg === "RESPONSE_MODE") {
    mode = message.data;
    loadModeButton();
    chrome.runtime.sendMessage({
      msg: "CSV_DATA_REQUEST"
    })
  }
})
// console.log("SENT CONNECTION");

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
    loadCSVDownload(message.data);
  }
});

/******************************************************************************/
// analysis stuff

function modeBadgeButtonOnClick() {
  backgroundPort.postMessage({ msg: "RUN_ANALYSIS_FROM_BACKGROUND", data: null });
}

// This is a temporary mode button injector to make it easy to call a page refresh
function loadModeButton() {
  // enable analysis mode badge
  if (mode && mode === modes.analysis) {
    let modeBadge = document.getElementById("mode-badge");
    let modeBadgeHTML = `<button id="mode-badge-button" class="importexport-button">Run Analysis</button>`;
    modeBadge.innerHTML = modeBadgeHTML;

    let modeBadgeButton = document.getElementById("mode-badge-button");
    modeBadgeButton.addEventListener('click', modeBadgeButtonOnClick);
  }
}



function loadCSVDownload(csvData) {
  // enable analysis mode badge
  if (mode && mode === modes.analysis) {

    let download = document.getElementById("test-csv");
    let downloadHTML = `<button id="csv-download-button" class="importexport-button">Download</button>`; 
    download.innerHTML = downloadHTML;

    let downloadButton = document.getElementById("csv-download-button");

    function loadCSV() {
      // convert to an array which can easily become a CSV file

      // columnTitles is an array of "Domain" + the rest of the sections
      // in csvData (i.e. the analysis_userend object).
      let columnTitles = ["Domain"];
      Object.keys(csvData).map((key, i) => columnTitles.append(i));

      let csvContent = "data:text/csv;charset=utf-8,"
      csvContent += columnTitles.join(",") + "\n"

      for (let property in csvData) {
        csvContent += property + ",";
        for (let i=1; i<columnTitles.length; i++) {
          let stringifiedProp = JSON.stringify(csvData[property][columnTitles[i]])
          if (typeof stringifiedProp === "string") {
            stringifiedProp = stringifiedProp.replace(/"/g, "\'");
          }
          csvContent += '\"' + stringifiedProp + "\",";
        }
        csvContent += "\n"
      }
      
      var encodedUri = encodeURI(csvContent);
      // window.open(encodedUri);
      
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "my_data.csv");
      document.body.appendChild(link);
      
      link.click();
    }

    downloadButton.addEventListener('click', loadCSV);
    
  }
}




/******************************************************************************/
// Tutorial walkthrough

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
// Misc. initializers & listeners

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

function logoSwitch(){
  console.log("logoSwitch called 1");
  //console.log(document.getElementById("a-dark").src);
  console.log("logoSwitch called 2");
  if (document.getElementById("a-dark").style.display = ""){
    document.getElementById("a-dark").style.display = "none"
    document.getElementById("a-light").style.display = ""
  } else if (document.getElementById("a-light").style.display = ""){
    document.getElementById("a-dark").style.display = ""
    document.getElementById("a-light").style.display = "none"
  } else if (document.getElementById("p-dark").style.display = ""){
    document.getElementById("p-dark").style.display = "none"
    document.getElementById("p-light").style.display = ""
  } else if (document.getElementById("p-light").style.display = ""){
    document.getElementById("p-dark").style.display = ""
    document.getElementById("p-light").style.display = "none"
  }
}

async function buildAnalysis() {
  let pos = "../../../assets/cat-w-text/check1.png";
  let neg = "../../../assets/cat-w-text/cross1.png"
  let specs = `style= "
    margin-right: 5px;
    margin-left: 5px;
    margin-top: auto;
    margin-bottom: auto;
    padding-right: 5px;
    padding-left: 5px;"
    `
  let items = "";

  let dnslink;
  let stringfound;
  let gpcsent;
  let stringchanged;

  const data = await storage.get(stores.analysis, parsedDomain)

  if (data.DO_NOT_SELL_LINK_EXISTS){
    dnslink = pos;
  } else {
    dnslink = neg;
  }
  let beforeGPC = data.USPAPI_BEFORE_GPC
  if ((beforeGPC.length != 0) && isValidSignalIAB(beforeGPC[0].uspString)) {
    stringfound = pos;
  } else {
    stringfound = neg;
  }
  if (data.SENT_GPC){
    gpcsent = pos;
  } else {
    gpcsent = neg;
  }
  if (data.USPAPI_OPTED_OUT){
    stringchanged = pos;
  } else {
    stringchanged = neg;
  }


  // Sets the 3rd party domain elements

    items +=
    `
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     Do Not Sell Link 
     </div>
     <img src = ${dnslink} width = "40px" height = "40px" ${specs}>
     </div>
     </li>
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     US Privacy String 
     </div>
     <img src = ${stringfound} width = "40px" height = "40px" ${specs}>
     </div>
     </li>
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     GPC Signal Sent
     </div>
     <img src = ${gpcsent} width = "40px" height = "40px" ${specs}>
     </div>
     </li>
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     US Privacy String Updated 
     </div>
     <img src = ${stringchanged} width = "40px" height = "40px" ${specs}>
     </div> 
     </li>`;

  document.getElementById("dropdown-1-expandable").innerHTML = items;
}

async function compliance(){
  console.log("Compliance is running...")
  let checkbox = ""
  if (parsedDomain) {
    try {
      const data = await storage.get(stores.analysis, parsedDomain)
      console.log(parsedDomain);
      if (data.DO_NOT_SELL_LINK_EXISTS && data.SENT_GPC && data.USPAPI_OPTED_OUT
        && (data.USPAPI_BEFORE_GPC.length != 0) && isValidSignalIAB(data.USPAPI_BEFORE_GPC[0].uspString)) {
        checkbox = `<div
        id = "compliance-text"
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
      document.getElementById("compliance-label").innerHTML = checkbox;
    } catch(e) {
      console.error(e);
      document.getElementById("compliance-label").innerHTML = checkbox;
    }
  } else {
    document.getElementById("compliance-label").innerHTML = checkbox;
  }

}

function analysisSwitch(){
  console.log("Switching to analysis view");
  document.getElementById("optMode").innerText = "Analysis Mode";
  //logoSwitch();
  document.getElementById("visited-domains-stats").style.display = "none";
  document.getElementById("dropdown-1-text").innerHTML = "Analysis Breakdown";
  buildAnalysis();
  document.getElementById("dropdown-2").style.display = "none";
  document.getElementById("analysis-list").style.display = "";
  document.getElementById("domain-list").style.display = "none";
  document.getElementById("divider-3").style.display = "none";
  document.getElementById("divider-5").style.display = "none";
  document.getElementById("divider-7").style.display = "none";
  document.getElementById("compliance-body").style.display = ""
  document.getElementById("dns-enabled-body").style.display = "none";
  compliance();
}

function protectSwitch(){
  console.log("Switching to protect view");
  document.getElementById("optMode").innerText = "Protection Mode";
  //logoSwitch();
  document.getElementById("visited-domains-stats").style.display = "";
  document.getElementById("dropdown-1-text").innerHTML = "3rd Party Domains";
  document.getElementById("dropdown-2").style.display = "";
  document.getElementById("analysis-list").style.display = "none";
  document.getElementById("domain-list").style.display = "";
  document.getElementById("divider-3").style.display = "";
  document.getElementById("divider-5").style.display = "";
  document.getElementById("divider-7").style.display = "";
  document.getElementById("compliance-body").style.display = "none"
  document.getElementById("dns-enabled-body").style.display = "";
  dnsEnabled();
  
}

document.getElementById("optMode").addEventListener("click", function(){
    analysisSwitch();
});