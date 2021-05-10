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
  ///Send the message that the DOM has loaded to background.js to clear global_domains
  chrome.runtime.sendMessage({
    msg: "LOADED",
    data: Date.now(),
  });
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
      //console.log("POPUP: ", parsed_domain);
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
        document.getElementById("dns-text").innerHTML = t;
      })
    })
  })

  /**
   * Generates `X domains receiving signals` section in popup
   */
  chrome.storage.local.get(["DOMAINS"], (result) => {
    var count = Object.keys(result.DOMAINS).filter((key) => {
      return result.DOMAINS[key] == true;
    }).length
    document.getElementById("block-count").innerHTML = `
        <p id = "domain-count" class="blue-heading" style="font-size:25px; 
        font-weight: bold">${count}</p> domains receiving signals
    `;
  })

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

    var btn = document.getElementById('complianceAnalysisButton');
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
 * Builds the requested domains HTML of the popup window
 * @param {Object} requests - Contains all request domains for the current tab
 * (requests = tabs[activeTabID].REQUEST_DOMAINS; passed from background page)
 */
async function buildDomains(requests) {
  //console.log("requests: ", requests)
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
        class="blue-heading uk-flex-inline uk-width-1-1 uk-flex-center uk-text-center uk-text-bold uk-text-truncate"
        style="font-size: medium"
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
  if (request.msg === "WELLKNOWNRESPONSE") {
    //console.log(`Received WELLKNOWNREQUEST response: ${JSON.stringify(request.data)}`)
    buildWellKnown(request.data);
  }
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
    buildWellKnown(response.data);
  }
);

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
