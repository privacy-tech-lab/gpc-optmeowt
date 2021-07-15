/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

/*
popup.js
================================================================================
popup.js supplements and renders complex elements on popup.html
*/

import { extensionMode, stores, storage } from "../background/storage.js";

// ! Make sure to fix runtime.sendMessage (ENABLED : TRUE) so that the extension fixes itself

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
import "../../node_modules/tippy.js/dist/tippy-bundle.umd"

// MISC. IMPORTS THRUOUT FILE
// import "../../node_modules/dark-mode-switch/dark-mode-switch"


/**
 * Initializes the popup window after DOM content is loaded
 * @param {Object} event - contains information about the event
 */
document.addEventListener("DOMContentLoaded", async (event) => {
  var parsedDomain = "";

  /**
   * Queries, parses, and sets active tab domain to popup
   */
  await (async () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var tab = tabs[0];
        try {
          var url = new URL(tab.url);
          var parsed = psl.parse(url.hostname);
          parsedDomain = parsed.domain;

          if (parsedDomain === null) {
            document.getElementById("dns-body").style.display = "none";
            document.getElementById("domain").style.display = "none";
          } else {
            document.getElementById("domain").innerHTML = parsedDomain;
            // chrome.storage.local.get(["FIRSTINSTALL_POPUP"], (result) => {
            //   if (result.FIRSTINSTALL_POPUP) {
            //     popUpWalkthrough();
            //   }
            //   chrome.storage.local.set({ FIRSTINSTALL_POPUP: false }, () => {});
            // });
          }
          resolve()
        } catch (e) {
          document.getElementById("domain").innerHTML = location.href;
          reject()
        }
      });
    })
  })();

  /**
   * Sets enable/disable button to correct mode
   */
  const mode = await storage.get(stores.settings, 'MODE')
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

  /**
   * Listener for enable/disable extension switch
   */
  document.getElementById("enable-disable").addEventListener("click", async () => {
    const mode = await storage.get(stores.settings, 'MODE')
    if (mode === extensionMode.enabled || mode === extensionMode.domainlisted) {
      document.getElementById("message").style.display = "";
      document.getElementById("img").src =
        "../assets/play-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Enable");
      document.getElementById("content").style.opacity = "0.1";
      document.getElementById("message").style.opacity = "1";
      chrome.runtime.sendMessage({ "ENABLED": false });
    } else {
      document.getElementById("img").src =
        "../assets/pause-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Disable");
      document.getElementById("content").style.opacity = "1";
      document.getElementById("message").style.opacity = "0";
      document.getElementById("message").style.display = "none";
      chrome.runtime.sendMessage({ "ENABLED": true });
    }
  });

  /**
   * Sets domain list switch to correct position and adds listener
   */
  const parsedDomainValue = await storage.get(stores.domainlist, parsedDomain)
  console.log(`parsedDomainValue = ${parsedDomainValue} \n parsedDomain = ${parsedDomain}`)
  // Sets popup view
  var checkbox = "";
  var text = "";
    if (parsedDomainValue) {
    checkbox = `<input type="checkbox" id="input" checked/>
                    <span></span>`;
    text = "Do Not Sell Enabled";
  } else {
    checkbox = `<input type="checkbox" id="input"/>
                    <span></span>`;
    text = "Do Not Sell Disabled";
  }
  document.getElementById("switch-label").innerHTML = checkbox;
  document.getElementById("dns-text").innerHTML = text;

  // 1st party domain domainlist toggle listener
  document.getElementById("switch-label").addEventListener("click", async () => {
    await storage.set(stores.settings, extensionMode.domainlisted, 'MODE')
    const parsedDomainValue = await storage.get(stores.domainlist, parsedDomain);
    let elemString = "";
    if (parsedDomainValue) {
      elemString = "Do Not Sell Disabled";
      await storage.set(stores.domainlist, false, parsedDomain);
    } else {
      elemString = "Do Not Sell Enabled";
      await storage.set(stores.domainlist, true, parsedDomain);
    }
    document.getElementById("dns-text").innerHTML = elemString;
  })

  /**
   * Generates `X domains receiving signals` section in popup
   */
  const domainlistValues = await storage.getAll(stores.domainlist)
  let count = Object.keys(domainlistValues).filter((key) => {
    return domainlistValues[key] == true;
  }).length
  document.getElementById("block-count").innerHTML = `
    <p id = "domain-count" class="blue-heading" style="font-size:25px; 
    font-weight: bold">${count}</p> domains receiving signals
  `;

  /**
   * Generates third party domain list droptdown toggle functionality
   */
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

  /**
   * Generates well-known json dropdown list toggle functionality
   */
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

  //Compliance analysis mode UI. WIP!

  let btn = document.getElementById('complianceAnalysisButton');
  btn.addEventListener('click', function() {
    alert("Compliance checked! Check console...");
    chrome.runtime.sendMessage({
      msg: "COMPLIANCECHECK",
      data: "https://www.dailymail.co.uk",
      return: true,
    }, (response) => {
      console.log("done...")
    }
    );
  });

})

/**
 * Builds the listener to enable toggling 3rd party domains on/off in domainlist
 * @param {String} requestDomain - the domain related to the element which
 * the listener should be attached
 */
function addThirdPartyDomainToggleListener(requestDomain) {
  document.getElementById(`input-${requestDomain}`).addEventListener("click", async () => {
    console.log("input-requestDomain button triggered.")
    await storage.set(stores.settings, extensionMode.domainlisted, 'MODE')
    const requestDomainValue = await storage.get(stores.domainlist, requestDomain)
    let elemString = "";
    if (requestDomainValue) {
      elemString = "Do Not Sell Disabled"
      await storage.set(stores.domainlist, false, requestDomain)
    } else {
      elemString = "Do Not Sell Enabled"
      await storage.set(stores.domainlist, true, requestDomain);
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

/**
 * Sends "INIT" message to background page to start badge counter
 */
chrome.runtime.sendMessage({
  msg: "INIT",
  data: null,
});

/**
 * Requests Well Known info from Background page
 */
chrome.runtime.sendMessage({
    msg: "WELLKNOWNREQUEST",
    data: null,
    return: true,
  }, (response) => {
    //console.log(`Received WELLKNOWNREQUEST response: ${JSON.stringify(response.data)}`)
    // buildWellKnown(response.data);
  }
);

/**
 * Listens for messages from background page that call functions to populate
 * the popup badge counter and build the popup domain list HTML, respectively
 */
chrome.runtime.onMessage.addListener(function (request, _, __) {
  if (request.msg === "REQUESTS") {
    console.log("request.data", request)
    buildDomains(request.data);
  }
  if (request.msg === "WELLKNOWNRESPONSE") {
    //console.log(`Received WELLKNOWNREQUEST response: ${JSON.stringify(request.data)}`)
    buildWellKnown(request.data);
  }
});


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

/**
 * Various options page listeners
 */
document.getElementById("more").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

/**
 * Opens domainlist in settings page
 */
document.getElementById("domain-list").addEventListener("click", () => {
  chrome.storage.local.set({ DOMAINLIST_PRESSED: true }, ()=>{
    chrome.runtime.openOptionsPage();
  });
});
