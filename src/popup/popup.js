/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
popup.js
================================================================================
popup.js supplements and renders complex elements on popup.html
*/


import { extensionMode, stores, storage } from "../background/storage.js";

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


/******************************************************************************/
// Inflates main content

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
    darkmode.toggle();
  });


  //Note: this must be initialized first
  var parsedDomain = "";

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
            document.getElementById("domain").innerHTML = parsedDomain;

            // Initializes the tutorial if it needs to be loaded
            initPopUpWalkthrough();

          } else {
            document.getElementById("dns-body").style.display = "none";
            document.getElementById("domain").style.display = "none";
          }
          resolve();
        } catch(e) {
          console.error(e);
          document.getElementById("domain").innerHTML = location.href;
          reject();
        }
      });
    })
  })();

  // Init: ENABLE/DISABLE button to the correct mode
  const mode = await storage.get(stores.settings, "MODE");
  if (mode === undefined) {
    document.getElementById("img").src = "../assets/play-circle-outline.svg";
    document
      .getElementById("enable-disable")
      .setAttribute("uk-tooltip", "Enable");
  } else if (mode === extensionMode.enabled || mode === extensionMode.domainlisted) {
    document.getElementById("img").src = "../assets/pause-circle-outline.svg";
    document
      .getElementById("enable-disable")
      .setAttribute("uk-tooltip", "Disable");
    document.getElementById("content").style.opacity = "1";
    document.getElementById("message").style.opacity = "0";
    document.getElementById("message").style.display = "none";
  } else {
    document.getElementById("message").style.display = "";
    document.getElementById("img").src = "../assets/play-circle-outline.svg";
    document
      .getElementById("enable-disable")
      .setAttribute("uk-tooltip", "Enable");
    document.getElementById("content").style.opacity = "0.1";
    document.getElementById("message").style.opacity = "1";
  }

  // Listener: ENABLE/DISABLE button
  document.getElementById("enable-disable").addEventListener("click", async () => {
    const mode = await storage.get(stores.settings, 'MODE');
    if (mode === extensionMode.enabled || mode === extensionMode.domainlisted) {
      document.getElementById("message").style.display = "";
      document.getElementById("img").src =
        "../assets/play-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Enable");
      document.getElementById("content").style.opacity = "0.1";
      document.getElementById("message").style.opacity = "1";
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.disabled })
    } else {
      document.getElementById("img").src =
        "../assets/pause-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Disable");
      document.getElementById("content").style.opacity = "1";
      document.getElementById("message").style.opacity = "0";
      document.getElementById("message").style.display = "none";
      chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.enabled })
    }
  });

  // Init: 1st party domain "Do Not Sell Enabled/Disabled" text + toggle
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
      document.getElementById("dns-text").innerHTML = text;
    } catch(e) {
      console.error(e);
      document.getElementById("switch-label").innerHTML = checkbox;
      document.getElementById("dns-text").innerHTML = text;
    }
  } else {
    document.getElementById("switch-label").innerHTML = checkbox;
    document.getElementById("dns-text").innerHTML = text;
  }

  // Listener: 1st party domain "Do Not Sell Enabled/Disabled" text + toggle
  document.getElementById("switch-label").addEventListener("click", async () => {
    // await storage.set(stores.settings, extensionMode.domainlisted, 'MODE');
    chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.domainlisted })
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
    document.getElementById("dns-text").innerHTML = elemString;
  })

  // Init: Sets "X domains receiving signals" information section
  const domainlistValues = await storage.getAll(stores.domainlist);
  let count = Object.keys(domainlistValues).filter((key) => {
    return domainlistValues[key] == true;
  }).length
  document.getElementById("block-count").innerHTML = `
    <p id = "domain-count" class="blue-heading" style="font-size:25px;
    font-weight: bold">${count}</p> domains receiving signals
  `;

  // Listener: Generates 3rd party domain list droptdown toggle functionality
  document.getElementById("third-party-domains").addEventListener("click", () => {
    // var icon = document.getElementById("dropdown")
    if (document.getElementById("third-party-domains-list").style.display === "none") {
      document.getElementById("dropdown-1").src = "../assets/chevron-up.svg"
      document.getElementById("third-party-domains-list").style.display = ""
      document.getElementById("third-party-domains").classList.add("dropdown-tab-click")
      document.getElementById("divider-1").style.display = ""
    } else {
      document.getElementById("dropdown-1").src = "../assets/chevron-down.svg"
      document.getElementById("third-party-domains-list").style.display = "none"
      document.getElementById("third-party-domains").classList.remove("dropdown-tab-click")
      document.getElementById("divider-1").style.display = "none"
    }
  });

  // Listener: Generates wellknown json dropdown list toggle functionality
  document.getElementById("well-known-response").addEventListener("click", () => {
    if (document.getElementById("well-known-response-list").style.display === "none") {
      document.getElementById("dropdown-2").src = "../assets/chevron-up.svg"
      document.getElementById("well-known-response-list").style.display = ""
      document.getElementById("well-known-response").classList.add("dropdown-tab-click")
      document.getElementById("divider-2").style.display = ""
    } else {
      document.getElementById("dropdown-2").src = "../assets/chevron-down.svg"
      document.getElementById("well-known-response-list").style.display = "none"
      document.getElementById("well-known-response").classList.remove("dropdown-tab-click")
      document.getElementById("divider-2").style.display = "none"
    }
  });

  // Compliance analysis mode UI. WIP!
  // Commented out for 2.0.0 release

  // let btn = document.getElementById('complianceAnalysisButton');
  // btn.addEventListener('click', function() {
  //   alert("Compliance checked! Check console...");
  //   chrome.runtime.sendMessage({
  //     msg: "COMPLIANCECHECK",
  //     data: "https://www.dailymail.co.uk",
  //     return: true,
  //   }, (response) => {
  //     // console.log("done...")
  //   }
  //   );
  // });


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
    chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.domainlisted })
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
    document.getElementById(`dns-text-${requestDomain}`).innerHTML = elemString;
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
        id="dns-text-${requestDomain}"
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
  document.getElementById("third-party-domains-list").innerHTML = items;

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

  document.getElementById("well-known-response-list").innerHTML = `${explainer} ${wellknown}`;
  // document.getElementById("website-response-tab").innerHTML = tabDetails;
}


/******************************************************************************/
// Message passing

// Initializng a longterm port with the background for the onDisconnect event
let backgroundPort = chrome.runtime.connect({ name: "POPUP" });
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
chrome.runtime.onMessage.addListener(function (request, _, __) {
  if (request.msg === "POPUP_DATA") {
    let { requests, wellknown } = request.data;
    buildDomains(requests);
    buildWellKnown(wellknown);
  }
});


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
