document.addEventListener("DOMContentLoaded", (event) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    try {
      var url = new URL(tab.url);
      var domain = url.hostname;
      document.getElementById("domain").innerHTML = domain;
    } catch (e) {
      document.getElementById("domain").innerHTML = location.href;
    }
  });

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
});

async function buildURLS(requests) {
  let items = "";
  for (var url in requests) {
    items +=
      `
  <li class="uk-margin-small-left uk-margin-small-right">
    <div uk-grid class="uk-grid-row-collapse">
      <div
        class="uk-width-1-1"
        style="font-size: small; font-weight: bold;"
      >
        Request URL:
      </div>
      <div class="uk-width-1-1 uk-text-break">
        ` +
      url +
      `
      </div>
      <div
        class="uk-width-1-1 uk-margin-small-top"
        style="font-size: small; font-weight: bold;"
      >
        Response: <span class="uk-badge" style="font-size: 10px; background-color: #cfd8dc; color:#37474f !important;">UNRECEIVED</span>
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
    buildURLS(request.data)
  }
});

document.getElementById("more").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
