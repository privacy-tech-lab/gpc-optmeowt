/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/



/*
analysis/background.js
================================================================================
analysis/background.js is the main background script handling OptMeowt's
analysis functionality
*/



/*
The way I envision this working is that init() starts up all the necessary 
listeners that we need to use, meanwhile halt() shuts those listeners down.

preinit() and postinit() are functions that handle things necessarily before
or after the listeners are setup on enable. 
*/


function preinit() { return; };

function init() { return; };

function postinit() { return; };

function halt() { return; };


export const background = {
	preinit,
	init,
	postinit,
	halt
}