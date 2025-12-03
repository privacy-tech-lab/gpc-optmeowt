/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
contentScripts.js
================================================================================
contentScripts.js runs on every page and passes data to the background page
https://developer.chrome.com/extensions/content_scripts
*/

// Here is a resource I used to help setup the inject script functionality as
// well as setup message listeners to pass data back to the background
// https://www.freecodecamp.org/news/chrome-extension-message-passing-essentials/

/******************************************************************************/
/******************************************************************************/
/**********              # USPAPI call helper functions              **********/
/******************************************************************************/
/******************************************************************************/


// To be injected to call the USPAPI function in analysis mode
const uspapi = `
  try {
    __uspapi('getUSPData', 1, (data) => {
      let currURL = document.URL
      window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT", result: data, url: currURL });
    });
  }
`;

const uspapiRequest = `
  try {
    __uspapi('getUSPData', 1, (data) => {
      let currURL = document.URL
      window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT_REQUEST", result: data, url: currURL });
    });
  } catch (e) {
    window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT_REQUEST", result: "USPAPI_FAILED" });
  }
`;

function injectScript(script) {
  const scriptElem = document.createElement("script");
  scriptElem.innerHTML = script;
  document.documentElement.prepend(scriptElem);
}

async function isWellknownCheckEnabled() {
  try {
    const { WELLKNOWN_CHECK_ENABLED } = await chrome.storage.local.get(
      "WELLKNOWN_CHECK_ENABLED"
    );
    if (typeof WELLKNOWN_CHECK_ENABLED === "boolean") {
      return WELLKNOWN_CHECK_ENABLED;
    }
  } catch (error) {
    print(error);
  }
  try {
    const response = await chrome.runtime.sendMessage({
      msg: "GET_WELLKNOWN_CHECK_ENABLED",
    });
    if (response && typeof response.enabled === "boolean") {
      return response.enabled;
    }
  } catch (error) {
    print(error);
  }
  // If we can't determine the setting, err on the side of not fetching.
  return false;
}

/******************************************************************************/
/******************************************************************************/
/**********                   # Main functionality                   **********/
/******************************************************************************/
/******************************************************************************/

async function getWellknown(url) {
  const response = await fetch(`${url.origin}/.well-known/gpc.json`);
  new_url = url = JSON.parse(JSON.stringify(url));
  let wellknownData;
  try {
    wellknownData = await response.json();
  } catch {
    wellknownData = null;
  }
  chrome.runtime.sendMessage({
    msg: "CONTENT_SCRIPT_WELLKNOWN",
    data: wellknownData,
    origin_url: new_url
  });
}

/**
 * Passes info to background scripts for processing via messages
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage
 * There are other ways to do this, but I use an IIFE to run everything at once
 * https://developer.mozilla.org/en-US/docs/Glossary/IIFE
 */
(() => {
  /*   MAIN CONTENT SCRIPT PROCESSES GO HERE   */

  let url = new URL(location); // location object
  isWellknownCheckEnabled().then((shouldCheck) => {
    if (shouldCheck) {
      getWellknown(url);
    }
  });
})();

/******************************************************************************/
/******************************************************************************/
/**********    # Message passing from injected script via window     **********/
/******************************************************************************/
/******************************************************************************/

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) { // check unused arguments
  if (message.msg === "USPAPI_FETCH_REQUEST") {
    injectScript(uspapiRequest);
  }
});

window.addEventListener(
  "message",
  function (event) {
    if (
      event.data.type == "USPAPI_TO_CONTENT_SCRIPT"
    ) {
      chrome.runtime.sendMessage({
        msg: "USPAPI_TO_BACKGROUND",
        data: event.data.result,
        location: this.location.href,
      });
    }
    if (event.data.type == "USPAPI_TO_CONTENT_SCRIPT_REQUEST") {
      chrome.runtime.sendMessage({
        msg: "USPAPI_TO_BACKGROUND_FROM_FETCH_REQUEST",
        data: event.data.result,
        location: this.location.href,
      });
    }
  },
  false
);
