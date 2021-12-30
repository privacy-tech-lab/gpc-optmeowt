/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
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
      console.log("USP Data: ", data);
      let currURL = document.URL
      window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT", result: data, url: currURL });
    });
  } catch (e) {
    console.log("Failed calling USPAPI", e);
  }
`

const uspapiRequest = `
  try {
    __uspapi('getUSPData', 1, (data) => {
      console.log("USP Data: ", data);
      let currURL = document.URL
      window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT_REQUEST", result: data, url: currURL });
    });
  } catch (e) {
    console.log("Failed calling USPAPI", e);
    window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT_REQUEST", result: "USPAPI_FAILED" });
  }
`

const runAnalysisProperty = `
if (!window.runAnalysis) {
    window.runAnalysis = function() {
		  console.log("POSTED RUN_ANALYSIS");
		  window.postMessage({ type: "RUN_ANALYSIS", result: null });
      return;
    };
};`

function injectScript(script) {
  const scriptElem = document.createElement('script');
  scriptElem.innerHTML = script;
  document.documentElement.prepend(scriptElem);
}



/******************************************************************************/
/******************************************************************************/
/**********                   # Main functionality                   **********/
/******************************************************************************/
/******************************************************************************/


async function getWellknown(url) {
  const response = await fetch(`${url.origin}/.well-known/gpc.json`);
	const wellknownData = await response.json();

	chrome.runtime.sendMessage({
		msg: "CONTENT_SCRIPT_WELLKNOWN",
		data: wellknownData,
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
	console.log("MAIN CONTENT SCRIPT INIT:: ");

	let url = new URL(location); // location object
  console.log(url)

	/* (1) Gets Frame:0 Tab content */
	// leave this commented out while debugging ANALYSIS MODE
	// chrome.runtime.sendMessage({
	// 	msg: "CONTENT_SCRIPT_TAB",
	// 	data: Date.now(),
	// });

	/* (2) Injects scripts */
  window.addEventListener('load', function() {
    console.log("running window.onload");
    // injectScript(uspapi);
		injectScript(runAnalysisProperty);
	}, false);

	/* (3) Fetches .well-known GPC file */
  getWellknown(url);
})();



/******************************************************************************/
/******************************************************************************/
/**********    # Message passing from injected script via window     **********/
/******************************************************************************/
/******************************************************************************/


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.msg === "USPAPI_FETCH_REQUEST") {
    console.log("injecting uspapi call to content script")
    injectScript(uspapiRequest);
  }
});

window.addEventListener('message', function(event) {
// console.log("EVENT: ", event);
  if (event.data.type == "USPAPI_TO_CONTENT_SCRIPT"
    // && typeof chrome.app.isInstalled !== 'undefined'
  ) {
    console.log("USPAPI_RETURNed to contentScript.js!", event.data.result);
    chrome.runtime.sendMessage({ 
      msg: "USPAPI_TO_BACKGROUND", 
      data: event.data.result, 
      location: this.location.href
    });
  }
  if (event.data.type == "USPAPI_TO_CONTENT_SCRIPT_REQUEST") {
    chrome.runtime.sendMessage({
      msg: "USPAPI_TO_BACKGROUND_FROM_FETCH_REQUEST", 
      data: event.data.result, 
      location: this.location.href
    });
  }
	if (event.data.type == "RUN_ANALYSIS") {
		chrome.runtime.sendMessage({ msg: "RUN_ANALYSIS", data: event.data.result });	
	}
}, false);
