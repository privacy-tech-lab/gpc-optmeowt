/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
listeners-firefox.js
================================================================================
listeners-firefox.js holds the on-page-visit listeners for firefox that activate 
our main functionality
*/

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
// https://developer.chrome.com/docs/extensions/reference/webRequest/
// This is the extraInfoSpec array of strings
const MOZ_REQUEST_SPEC = ["requestHeaders", "blocking"];
const MOZ_RESPONSE_SPEC = ["responseHeaders", "blocking"];

// This is the filter object
const FILTER = { urls: ["<all_urls>"] };

/**
 * Enables extension functionality and sets site listeners
 * Information regarding the functionality and timing of webRequest and webNavigation
 * can be found on Mozilla's & Chrome's API docuentation sites (also linked above)
 *
 * The functions called on event occurance are located in `events.js`
 */
function enableListeners(callbacks) {
  const {
    onBeforeSendHeaders,
    onHeadersReceived,
    onBeforeNavigate,
    onCommitted,
    onCompleted,
  } = callbacks;

  // (4) global Firefox listeners
  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    FILTER,
    MOZ_REQUEST_SPEC
  );
  chrome.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
    FILTER,
    MOZ_RESPONSE_SPEC
  );
  chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);
  chrome.webNavigation.onCommitted.addListener(onCommitted);
  chrome.webNavigation.onCompleted.addListener(onCompleted);
}

/**
 * Disables background listeners
 */
function disableListeners(callbacks) {
  const {
    onBeforeSendHeaders,
    onHeadersReceived,
    onBeforeNavigate,
    onCommitted,
    onCompleted,
  } = callbacks;

  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
  chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
  chrome.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate);
  chrome.webNavigation.onCommitted.removeListener(onCommitted);
  chrome.webNavigation.onCompleted.removeListener(onCompleted);
}

export { enableListeners, disableListeners };
