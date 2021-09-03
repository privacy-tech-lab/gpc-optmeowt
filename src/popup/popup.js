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
        checkbox = `<div
        id = "compliance"
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
      text = "CCPA Compliance: "
      } else {
        checkbox = `<div
        id = "${domain} compliance"
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
      text = "CCPA Compliance: "
      }
      document.getElementById("compliance").innerHTML = checkbox;
      document.getElementById("dns-text").innerHTML = text;
    } catch(e) {
      console.error(e);
      document.getElementById("complaince").innerHTML = checkbox;
      document.getElementById("dns-text").innerHTML = text;
    }
  } else {
    document.getElementById("compliance").innerHTML = checkbox;
    document.getElementById("dns-text").innerHTML = text;
  }

  // Listener: 1st party domain "Do Not Sell Enabled/Disabled" text + toggle
  // document.getElementById("switch-label").addEventListener("click", async () => {
  //   // await storage.set(stores.settings, extensionMode.domainlisted, 'MODE');
  //   chrome.runtime.sendMessage({ msg: "CHANGE_MODE", data: extensionMode.domainlisted })
  //   const parsedDomainValue = await storage.get(stores.domainlist, parsedDomain);
  //   let elemString = "";
  //   if (parsedDomainValue) {
  //     elemString = "Do Not Sell Disabled";
  //     // await storage.set(stores.domainlist, false, parsedDomain);
  //     setToDomainlist(parsedDomain, false);
  //   } else {
  //     elemString = "Do Not Sell Enabled";
  //     // await storage.set(stores.domainlist, true, parsedDomain);
  //     setToDomainlist(parsedDomain, true);
  //   }
  //   document.getElementById("dns-text").innerHTML = elemString;
  // })

  // // Init: Sets "X domains receiving signals" information section   **** Not sure if we want this ****
  // const domainlistValues = await storage.getAll(stores.domainlist);
  // let count = Object.keys(domainlistValues).filter((key) => {
  //   return domainlistValues[key] == true;
  // }).length
  // document.getElementById("block-count").innerHTML = `
  //   <p id = "domain-count" class="blue-heading" style="font-size:25px;
  //   font-weight: bold">${count}</p> domains receiving signals
  // `;

  // Listener: Generates 3rd party domain list droptdown toggle functionality
  document.getElementById("analysis-breakdown").addEventListener("click", () => {
    // var icon = document.getElementById("dropdown")
    if (document.getElementById("analysis-breakdown-list").style.display === "none") {
      document.getElementById("dropdown-1").src = "../assets/chevron-up.svg"
      document.getElementById("analysis-breakdown-list").style.display = ""
      document.getElementById("analysis-breakdown").classList.add("dropdown-tab-click")
      document.getElementById("divider-1").style.display = ""
    } else {
      document.getElementById("dropdown-1").src = "../assets/chevron-down.svg"
      document.getElementById("analysis-breakdown-list").style.display = "none"
      document.getElementById("analysis-breakdown").classList.remove("dropdown-tab-click")
      document.getElementById("divider-1").style.display = "none"
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
 * Builds the requested domains HTML of the popup window
 * @param {Object} requests - Contains all request domains for the current tab
 * (requests = tabs[activeTabID].requestDomainS; passed from background page)
 */
async function buildAnalysis(requests) {
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


  // Sets the 3rd party domain elements

    items +=
    `
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     Do Not Sell Link 
     </div>
     <img src = ${pos} width = "40px" height = "40px" ${specs}>
     </div>
     </li>
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     US Privacy String 
     </div>
     <img src = ${pos} width = "40px" height = "40px" ${specs}>
     </div>
     </li>
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     GPC Signal Sent
     </div>
     <img src = ${pos} width = "40px" height = "40px" ${specs}>
     </div>
     </li>
    <li>
    <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
    <div class="domain uk-width-expand">
     US Privacy String Updated 
     </div>
     <img src = ${neg} width = "40px" height = "40px" ${specs}>
     </div> 
     </li>`;

  document.getElementById("analysis-breakdown-list").innerHTML = items;
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
    let { requests} = request.data;
    buildAnalysis(requests);
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
