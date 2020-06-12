import { addToWhitelist, removeFromWhitelist } from "../../whitelist.js";

document.addEventListener("DOMContentLoaded", (event) => {
  var parsed_domain = '';

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    try {
      var url = new URL(tab.url);
      var parsed = psl.parse(url.hostname)
      parsed_domain = parsed.domain;
      console.log("POPUP: ", parsed_domain);
      if (parsed.domain === null) {
        document.getElementById("domain").innerHTML = location.href;
      } else {
        document.getElementById("domain").innerHTML = parsed.domain;
      }
    } catch (e) {
      document.getElementById("domain").innerHTML = location.href;
    }
  });

  /// Sets whole extension enable/disable
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

  /// Sets whitelist switch to correct position
  /// CANNOT USE result.CURR_DOMAIN, otherwise you have unexpected behavior with the switch
  chrome.storage.local.get(["DOMAINS"], function (result) {
      if (result.DOMAINS[parsed_domain]) {
        document.getElementById("input").checked = true;
      } else {
        document.getElementById("input").checked = false;
      }
    // })
  });

  document.getElementById("input").addEventListener("click", () => {
    chrome.storage.local.get(["DOMAINS"], function (result) {
      if (result.DOMAINS[parsed_domain]) {
        removeFromWhitelist(parsed_domain);
        document.getElementById("input").checked = false;
      } else {
        addToWhitelist(parsed_domain);
        document.getElementById("input").checked = true;
      }
    });
  });

});

async function buildURLS(requests) {
  let items = "";
  for (var request_domain in requests) {
    items +=
      `
  <li class="uk-margin-small-left uk-margin-small-right">
    <div uk-grid class="uk-grid-row-collapse">
      <div
        class="uk-width-1-1"
        style="font-size: small; font-weight: bold;"
      >
        Request Domain:
      </div>
      <div class="uk-width-1-1 uk-text-break">
        ` +
      request_domain +
      `
      </div>
      <div
        class="uk-width-1-1 uk-margin-small-top"
        style="font-size: small; font-weight: bold;"
      >
        Responses: <span class="uk-badge" style="font-size: 10px; background-color: #cfd8dc; color:#37474f !important;">RECEIVED 0/`+Object.keys(requests[request_domain].URLS).length+`</span>
      </div>
      <div class="uk-width-1-1">
        None
      </div>
    </div>
  </li>
  `;
  }
  document.getElementById("urls").innerHTML = items;
}

chrome.runtime.sendMessage({
  msg: "INIT",
  data: null,
});

chrome.runtime.onMessage.addListener(function (request, _, __) {
  if (request.msg === "BADGE") {
    document.getElementById("requests").innerText = request.data;
  }
  if (request.msg === "REQUESTS") {
    buildURLS(request.data);
  }
});

document.getElementById("more").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
