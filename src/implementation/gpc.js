/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

var userAgent = window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome";

// GPC Header
var gpc = {
        "name": "Sec-GPC",
        "value": "1"
};

// Updates GPC HTTP Header signal
var addHeaders = (details) => {
    details.requestHeaders.push({ name: gpc.name, value: gpc.value });
    return { requestHeaders: details.requestHeaders };
};

// Initializes GPC DOM signal
var addDomSignal = (details) => {
    try { 
        const contentType = document.documentElement.ownerDocument.contentType
        // don't inject into xml or json pages
        if (contentType === 'application/xml' ||
            contentType === 'application/json' ||
            contentType === 'text/xml' ||
            contentType === 'text/json' ||
            contentType === 'text/rss+xml' ||
            contentType === 'application/rss+xml'
        ) {
            return
        }
    } catch (e) {
        // if we can't find content type, go ahead with injection
    }
    initDomJS(details);
}

var initDomJS = (details) => {
    chrome.tabs.executeScript(details.tabId, {
      file: "dom.js",
    //   code: `
    //         try {
    //             var globalPrivacyControlValue = ${GPCEnabled}
    //         } catch(e) {}`,
      frameId: details.frameId, // Supposed to solve multiple injections
                                // as opposed to allFrames: true
      runAt: "document_start",
    });
}

// Main function
function enable() {
    if (userAgent === "moz") {
        chrome.webRequest.onBeforeSendHeaders.addListener(
        addHeaders,
        {
            urls: ["<all_urls>"],
        },
        ["requestHeaders", "blocking"]
        );

        chrome.webNavigation.onCommitted.addListener(
        addDomSignal
        )
    } else {
        chrome.webRequest.onBeforeSendHeaders.addListener(
        addHeaders,
        {
            urls: ["<all_urls>"],
        },
        ["requestHeaders", "extraHeaders", "blocking"]
        );

        console.log("DOM signal to navigator");
        chrome.webNavigation.onCommitted.addListener(
        addDomSignal,
        {
            urls: ["<all_urls>"],
        }
        )
    }
}

enable();