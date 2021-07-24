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
		msg: "TAB",
		data: Date.now(),
	});

	/* (2) Fetches .well-known GPC file */
	const response = await fetch(`${url.origin}/.well-known/gpc.json`);
	const wellknownData = await response.json();

	chrome.runtime.sendMessage({
		msg: "WELLKNOWN_CONTENT_SCRIPT_DATA",
		data: wellknownData,
	});
})();