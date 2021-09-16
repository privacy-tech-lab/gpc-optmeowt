/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
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
const uspapi = `__uspapi('getUSPData', 1, (data) => {
  console.log("USP Data: ", data);
  let currURL = document.URL
  window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT", result: data, url: currURL });
});`

const runAnalysisProperty = `
if (!window.runAnalysis) {
    window.runAnalysis = function() {
		console.log("POSTED RUN_ANALYSIS");
		window.postMessage({ type: "RUN_ANALYSIS", result: null });
        return 333
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


/**
 * Passes info to background scripts for processing via messages
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage
 * There are other ways to do this, but I use an IIFE to run everything at once
 * https://developer.mozilla.org/en-US/docs/Glossary/IIFE
 */
(async () => {

	/* MAIN CONTENT SCRIPT PROCESSES GO HERE */

  console.log("MAIN CONTENT SCRIPT INIT:: ");

	let url = new URL(location);

	/* (1) Gets Frame:0 Tab content */
	chrome.runtime.sendMessage({
		msg: "CONTENT_SCRIPT_TAB",
		data: Date.now(),
	});

	/* (2) Searches for DNS link */
	window.onload = function(){
		var tagtypes = ["a","button","footer"]; //tag types to search for
		var phrasing = /Do.Not.Sell.My|Don't.Sell.My/gmi

		for (let x=0; x<tagtypes.length;x++){
			var elements = document.getElementsByTagName(tagtypes[x]);
			for (let i = 0; i<elements.length; i++){
				var element = elements[i];
				var text = element.innerHTML;
				if (phrasing.test(text)){
					console.log("Found it");
					break;
				}
			}
		}
    injectScript(uspapi);
		injectScript(runAnalysisProperty);
	}

	/* (3) Fetches .well-known GPC file */
	const response = await fetch(`${url.origin}/.well-known/gpc.json`);
	const wellknownData = await response.json();

	chrome.runtime.sendMessage({
		msg: "CONTENT_SCRIPT_WELLKNOWN",
		data: wellknownData,
	});

})();



/******************************************************************************/
/******************************************************************************/
/**********    # Message passing from injected script via window     **********/
/******************************************************************************/
/******************************************************************************/


window.addEventListener('message', function(event) {
// console.log("EVENT: ", event);
  if (event.data.type == "USPAPI_TO_CONTENT_SCRIPT"
    // && typeof chrome.app.isInstalled !== 'undefined'
  ) {
    console.log("USPAPI_RETURNed to contentScript.js!", event.data.result);
    chrome.runtime.sendMessage({ msg: "USPAPI_TO_BACKGROUND", data: event.data.result });
  }
	if (event.data.type == "RUN_ANALYSIS") {
		chrome.runtime.sendMessage({ msg: "RUN_ANALYSIS", data: event.data.result });	
	}
}, false);