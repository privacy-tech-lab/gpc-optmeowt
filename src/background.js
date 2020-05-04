/*
Initializers
*/
counter = 0;
chrome.browserAction.setBadgeBackgroundColor({ color: "#666666" });
chrome.browserAction.setBadgeText({ text: "0" });

/// Manipulate Headers
addHeaders = (details) => {
  details.requestHeaders.push({ name: "DNS", value: "0" });
  incrementBadge();
  return { requestHeaders: details.requestHeaders };
};

/// Increment badge number
function incrementBadge() {
  counter++;
  chrome.runtime.sendMessage({
    msg: "COUNTER",
    data: counter.toString(),
  });
  chrome.browserAction.setBadgeText({ text: counter.toString() });
}

/// Enable extension funtionality
function enable() {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    addHeaders,
    {
      urls: ["<all_urls>"],
    },
    ["requestHeaders", "extraHeaders", "blocking"]
  );
  chrome.storage.local.set({ ENABLED: true });
}

/// Disable extenstion functionality
function disable() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
  chrome.storage.local.set({ ENABLED: false });
  chrome.browserAction.setBadgeText({ text: "" });
  counter = 0;
}

chrome.storage.local.get(["ENABLED"], function (result) {
  if (result.ENABLED == undefined) {
    chrome.storage.local.set({ ENABLED: true });
    enable();
  } else if (result.ENABLED) {
    enable();
  } else {
    disable();
  }
});

chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
  if (request.ENABLED != null) {
    if (request.ENABLED) {
      enable();
      sendResponse("DONE");
    } else {
      disable();
      sendResponse("DONE");
    }
  }
});
