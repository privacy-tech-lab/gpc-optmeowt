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


/**
 * Passes info to background scripts for processing via messages
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage
 * There are other ways to do this, but I use an IIFE to run everything at once
 * https://developer.mozilla.org/en-US/docs/Glossary/IIFE
 */
(async () => {

	/* MAIN CONTENT SCRIPT PROCESSES GO HERE */

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
	}


	/* (3) Fetches .well-known GPC file */
	const response = await fetch(`${url.origin}/.well-known/gpc.json`);
	const wellknownData = await response.json();


	chrome.runtime.sendMessage({
		msg: "CONTENT_SCRIPT_WELLKNOWN",
		data: wellknownData,
	});

})();