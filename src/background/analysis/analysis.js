/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
protection.js
================================================================================
protection.js (1) Implements our per-site functionality for the background listeners
          (2) Handles cached values & message passing to popup & options page
*/


// import { stores, storage } from "./../storage.js";
// import { modes } from "../../data/modes.js";
// import { defaultSettings } from "../../data/defaultSettings.js";
// import { headers } from "../../data/headers.js";
// import psl from "psl";



/******************************************************************************/
/******************************************************************************/
/**********             # Initializers (cached values)               **********/
/******************************************************************************/
/******************************************************************************/


var analysis = {};
// var domainlist = {};    // Caches & mirrors domainlist in storage
// var mode = defaultSettings["MODE"]; // Caches the extension mode
// var isDomainlisted = defaultSettings["IS_DOMAINLISTED"];
// var tabs = {};          // Caches all tab infomration, i.e. requests, etc. 
// var wellknown = {};     // Caches wellknown info to be sent to popup
// var signalPerTab = {};  // Caches if a signal is sent to render the popup icon
// var activeTabID = 0;    // Caches current active tab id
// var sendSignal = true;  // Caches if the signal can be sent to the curr domain



/******************************************************************************/
/******************************************************************************/
/**********                      # Functions                         **********/
/******************************************************************************/
/******************************************************************************/


let newIncognitoTab = chrome.windows.create({ "url": null, "incognito": true });

let usprivacyRegex = /us-?_?privacy/g;

// Listener parameters for webRequest & webNavigation
const MOZ_REQUEST_SPEC = ["requestHeaders", "blocking"]
const MOZ_RESPONSE_SPEC = ["responseHeaders", "blocking"]
const FILTER = { urls: ["<all_urls>"] }

// webRequest and webNaviation listeners - for grabbing HTTP headers
// chrome.webRequest.onBeforeSendHeaders.addListener(
// 	onBeforeSendHeaders,
// 	FILTER,
// 	MOZ_REQUEST_SPEC
// )
// chrome.webRequest.onHeadersReceived.addListener(
// 	onHeadersReceived,
// 	FILTER,
// 	MOZ_RESPONSE_SPEC
// )
chrome.webNavigation.onBeforeNavigate.addListener((result) => {

})
// chrome.webNavigation.onCommitted.addListener(onCommitted)


// Cookie listener - grabs ALL cookies changed
chrome.cookies.onChanged.addListener((changeInfo) => {
	if (!changeInfo.removed) {
		let cookie = changeInfo.cookie;
    let domain = cookie.domain;

    if (usprivacyRegex.test(cookie.name)) {
      if (!analysis[domain]) analysis[domain] = {};
      let length = Object.keys(analysis[cookie.domain]).length;

      analysis[cookie.domain][length+1] = cookie;
    }
	}
  console.log(analysis);
})



/******************************************************************************/
/******************************************************************************/
/**********           # Exportable init / halt functions             **********/
/******************************************************************************/
/******************************************************************************/



export function init() {
	newIncognitoTab;
}
  
export function halt() {
	// disableListeners(listenerCallbacks);
}