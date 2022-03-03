/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
listeners-chrome.js
================================================================================
listeners-chrome.js holds the on-page-visit listeners for chrome that activate 
our main functionality
*/


// import {
// 	onBeforeSendHeaders, 
// 	onHeadersReceived, 
// 	onBeforeNavigate,
// 	onCommitted
// } from "./events.js"


// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
// https://developer.chrome.com/docs/extensions/reference/webRequest/
// This is the extraInfoSpec array of strings
const CHROME_REQUEST_SPEC = ["requestHeaders", "extraHeaders", "blocking"]
const CHROME_RESPONSE_SPEC = ["responseHeaders", "extraHeaders", "blocking"]

// This is the filter object
const FILTER = { urls: ["<all_urls>"] }


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
		onCommitted
	} = callbacks;

	// (4) global Chrome listeners
	// chrome.declarativeNetRequest.addListener()
	chrome.webRequest.onBeforeSendHeaders.addListener(
	  onBeforeSendHeaders,
	  FILTER,
	  CHROME_REQUEST_SPEC
	)
	chrome.webRequest.onHeadersReceived.addListener(
	  onHeadersReceived,
	  FILTER,
	  CHROME_RESPONSE_SPEC
	)
	chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate, FILTER)
	chrome.webNavigation.onCommitted.addListener(onCommitted, FILTER)  
}

/**
 * Disables background listeners
 */
function disableListeners(callbacks) {
	const {
		onBeforeSendHeaders,
		onHeadersReceived,
		onBeforeNavigate,
		onCommitted
	} = callbacks;
	
  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders)
  chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived)
  chrome.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate)
  chrome.webNavigation.onCommitted.removeListener(onCommitted)
}

export { 
  enableListeners,
  disableListeners
}