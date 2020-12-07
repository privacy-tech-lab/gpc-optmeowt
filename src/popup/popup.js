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

import {
  // toggleListener,
  addToDomainlist,
  removeFromDomainlist,
} from "../domainlist.js";
// import { buildToggle, toggleListener } from "../../../domainlist.js";

/**
 * Initializes the popup window after DOM content is loaded
 * @param {Object} event - contains information about the event
 */
document.addEventListener("DOMContentLoaded", (event) => {
  var parsed_domain = "";

  /**
   * Queries, parses, and sets active tab domain to popup
   */
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    try {
      var url = new URL(tab.url);
      var parsed = psl.parse(url.hostname);
      parsed_domain = parsed.domain;
      console.log("POPUP: ", parsed_domain);
      if (parsed_domain === null) {
        document.getElementById("dns-body").style.display = "none";
        document.getElementById("domain").style.display = "none";
      } else {
        document.getElementById("domain").innerHTML = parsed_domain;
        chrome.storage.local.get(["FIRSTINSTALL_POPUP"], (result) => {
          if (result.FIRSTINSTALL_POPUP) {
            popUpWalkthrough();
          }
          chrome.storage.local.set({ FIRSTINSTALL_POPUP: false }, () => {});
        });
      }
    } catch (e) {
      document.getElementById("domain").innerHTML = location.href;
    }
  });

  /**
   * Sets enable/disable button to correct mode
   */
  chrome.storage.local.get(["ENABLED"], function (result) {
    if (result.ENABLED == undefined) {
      document.getElementById("img").src = "../assets/play-circle-outline.svg";
      document
        .getElementById("enable-disable")
        .setAttribute("uk-tooltip", "Enable");
    } else if (result.ENABLED) {
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
  });

  /**
   * Listener for enable/disable extension switch
   */
  document.getElementById("enable-disable").addEventListener("click", () => {
    chrome.storage.local.get(["ENABLED"], function (result) {
      if (result.ENABLED) {
        document.getElementById("message").style.display = "";
        document.getElementById("img").src =
          "../assets/play-circle-outline.svg";
        document
          .getElementById("enable-disable")
          .setAttribute("uk-tooltip", "Enable");
        document.getElementById("content").style.opacity = "0.1";
        document.getElementById("message").style.opacity = "1";
        chrome.runtime.sendMessage({ ENABLED: false });
      } else {
        document.getElementById("img").src =
          "../assets/pause-circle-outline.svg";
        document
          .getElementById("enable-disable")
          .setAttribute("uk-tooltip", "Disable");
        document.getElementById("content").style.opacity = "1";
        document.getElementById("message").style.opacity = "0";
        document.getElementById("message").style.display = "none";
        chrome.runtime.sendMessage({ ENABLED: true });
      }
    });
  });

  /**
   * Sets domain list switch to correct position and adds listener
   */
  chrome.storage.local.get(["DOMAINS"], function (result) {
    // Sets popup view
    var checkbox = "";
    var text = "";
    if (result.DOMAINS[parsed_domain]) {
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
    // toggleListener("input", parsed_domain);
    // This is based on the toggleListener function and creates a toggle
    document.getElementById("switch-label").addEventListener("click", () => {
      chrome.storage.local.set({ ENABLED: true, DOMAINLIST_ENABLED: true });
      chrome.storage.local.get(["DOMAINS"], function (result) {
        var t = "";
        if (result.DOMAINS[parsed_domain]) {
          t = "Do Not Sell Disabled";
          removeFromDomainlist(parsed_domain);
        } else {
          t = "Do Not Sell Enabled";
          addToDomainlist(parsed_domain);
        }
        // console.log(t)
        document.getElementById("dns-text").innerHTML = t;
      })
    })
  })

  chrome.storage.local.get(["DOMAINS"], (result) => {
    var count = Object.keys(result.DOMAINS).filter((key) => {
      return result.DOMAINS[key] == true;
    }).length
    document.getElementById("block-count").innerHTML = `<p id = "domain-count" style="color:#4472c4; font-size:25px; font-weight: bold">${count}</p> domains receiving signals`;
  })

  /**
   * Generates third party domain list toggle functionality
   */
  document.getElementById("third-party-domains").addEventListener("click", () => {
    // var icon = document.getElementById("dropdown")
    // console.log
    if (document.getElementById("third-party-domains-list").style.display === "none") {
      document.getElementById("dropdown").src = "../assets/chevron-up.svg"
      document.getElementById("third-party-domains-list").style.display = ""
      // document.getElementById("third-party-domains").classList.add("third-party-domains-click")
      document.getElementById("divider").style.display = ""
    } else {
      document.getElementById("dropdown").src = "../assets/chevron-down.svg"
      document.getElementById("third-party-domains-list").style.display = "none"
      // document.getElementById("third-party-domains").classList.remove("third-party-domains-click")
      document.getElementById("divider").style.display = "none"
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log("TABS URL ", tabs[0].url)
      buildAcceptedBadge(tabs[0].url)
  });
})

async function buildAcceptedBadge(currentUrl) {
  var url = new URL(currentUrl); 
  console.log("Url: ", currentUrl)
  console.log(`buildAcceptedBadge(), ${url.origin}/.well-known/gpc.json`)

  fetch(`${url.origin}/.well-known/gpc.json`)
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      console.log(`.well-known via ContentScr: ${JSON.stringify(data)}`)
      if (data["gpc"] === true){

        document.getElementById(`accepted-badge`).innerHTML = `
          <div
          class="uk-badge button uk-text-center uk-text-bold uk-align-center"
          style="
            margin-right: auto;
            margin-left: auto;
            margin-top: auto;
            margin-bottom: auto;
            background-color: #a0e682;
            border: 1px solid #a0e682;
            color: var(--text-color-lighter);
          "
        >
          Do Not Sell Signal Accepted
        </div>
        <br>    
      `;

      }
    })
    .catch((e) => {console.log(`.well-known error: ${e}`)})
}

/**
 * Builds the requested domains HTML of the popup window
 * @param {Object} requests - Contains all request domains for the current tab
 * (requests = tabs[activeTabID].REQUEST_DOMAINS; passed from background page)
 */
async function buildDomains(requests) {
  console.log("requests: ", requests)
  let items = "";
  chrome.storage.local.get(["DOMAINS"], function (result) {
    for (var request_domain in requests) {
      let checkbox = ""
      let text = ""
      if (result.DOMAINS[request_domain]) {
        checkbox = `<input type="checkbox" id="input-${request_domain}" checked/>`
        text = "Do Not Sell Enabled"
      } else {
        checkbox = `<input type="checkbox" id="input-${request_domain}"/>`
        text = "Do Not Sell Disabled"
      }

      items +=
        `
    <li>
      <div
        class="uk-flex-inline uk-width-1-1 uk-flex-center uk-text-center uk-text-bold uk-text-truncate"
        style="color: #4472c4; font-size: medium"
        id="domain"
      >
        ${request_domain}
      </div>
      <div uk-grid  style="margin-top: 4%; ">
        <div
          id="dns-text-${request_domain}"
          class="uk-width-expand uk-margin-auto-vertical"
          style="font-size: small;"
        >
          ${text}
        </div>
        <div>
          <div uk-grid>
            <div class="uk-width-auto">
              <label class="switch switch-smaller" id="switch-label-${request_domain}">
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

    for (let request_domain in requests) {
      document.getElementById(`input-${request_domain}`).addEventListener("click", () => {
        chrome.storage.local.set({ ENABLED: true, DOMAINLIST_ENABLED: true });
        chrome.storage.local.get(["DOMAINS"], function (result) {
          var t = ""
          if (result.DOMAINS[request_domain]) {
            t = "Do Not Sell Disabled"
            removeFromDomainlist(request_domain);
          } else {
            t = "Do Not Sell Enabled"
            addToDomainlist(request_domain);
          }
          // console.log(t)
          document.getElementById(`dns-text-${request_domain}`).innerHTML = t;
        })
      })
    }
  })
}

/**
 * Sends "INIT" message to background page to start badge counter
 */
chrome.runtime.sendMessage({
  msg: "INIT",
  data: null,
});

/**
 * Listens for messages from background page that call functions to populate
 * the popup badge counter and build the popup domain list HTML, respectively
 */
chrome.runtime.onMessage.addListener(function (request, _, __) {
  // if (request.msg === "BADGE") {
  //   document.getElementById("requests").innerText = request.data;
  // }
  if (request.msg === "REQUESTS") {
    buildDomains(request.data);
  }
});

/**
 * Various options page listeners
 */
document.getElementById("more").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

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

document.getElementById("domain-list").addEventListener("click", () => {
  chrome.storage.local.set({ DOMAINLIST_PRESSED: true }, ()=>{
    chrome.runtime.openOptionsPage();
  });
});
