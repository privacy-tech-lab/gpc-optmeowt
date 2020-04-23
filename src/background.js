addHeaders = (details) => {
  details.requestHeaders.push({ name: "DNS", value: "0" });
  return { requestHeaders: details.requestHeaders };
}

function enable() {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    addHeaders,
    {
      urls: ["<all_urls>"],
    },
    ["requestHeaders", "extraHeaders", "blocking"]
  );
}

function disable() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
}

///////////////////////////////////////////////////////////////////////////

/* Generate ENABLE, WHITELIST_ENABLED, WHITELIST, NON_WHITELISTED keys */
chrome.storage.local.get(["WHITELIST", "WHITELIST_ENABLED", "NON_WHITELISTED"], function (result) {
  if (result.WHITELIST_ENABLED == undefined) {
    chrome.storage.local.set({ "WHITELIST_ENABLED": false });
  }
  if (result.WHITELIST == undefined) {
    chrome.storage.local.set({ "WHITELIST": [] });
  }
  if (result.NON_WHITELISTED == undefined) {
    chrome.storage.local.set({ "NON_WHITELISTED": [] });
  }
});

/* returns URL hostname string */
function getCurrURL () {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    const urlObj = new URL(tabs[0].url);
    host = urlObj.hostname
    chrome.storage.local.set({"HOST": host})
  })
}
getCurrURL();

/* Stores current URL if not in database */
function storeCurrURL() {
  chrome.storage.local.get(["NON_WHITELISTED", "WHITELIST", "HOST"], function (result) {
    var url = result.HOST;
    var whitelist = result.WHITELIST;
    var non_whitelisted = result.NON_WHITELISTED;
    for (i = 0; i < whitelist.length; i++) {
      if (whitelist[i] == url) {
        return;
      }
    }
    for (i = 0; i < non_whitelisted.length; i++) {
      if (non_whitelisted[i] == url) {
        return;
      }
    }
    chrome.storage.local.set({"NON_WHITELISTED": non_whitelisted.push(url)});
  })
}
storeCurrURL();
///////////////////////////////////////////////////////////////////////////

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
  if (request.ENABLED) {
    enable();
    sendResponse("DONE");
  } else {
    disable();
    sendResponse("DONE");
  }
});
