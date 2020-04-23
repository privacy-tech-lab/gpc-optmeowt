addHeaders = (details) => {
  details.requestHeaders.push({ name: "DNS", value: "0" });
  return { requestHeaders: details.requestHeaders };
};

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

function disable() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
  chrome.storage.local.set({ ENABLED: false });
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
