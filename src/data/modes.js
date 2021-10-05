/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
settings.js
================================================================================
settings.js exports the default global extension settings
NOTE: 
*/


// import { extensionMode } from "../background/storage.js"


// const extensionMode = Object.freeze({
// 	enabled: 'ENABLED',
// 	domainlisted: 'DOMAINLISTED',
// 	disabled: 'DISABLED'
// });

// const extensionFunctionality = Object.freeze({
// 	analysis: 'ANALYSIS',
// 	protection: 'PROTECTION'
// })

export const modes = Object.freeze({
	analysis: 'ANALYSIS',
	protection: 'PROTECTION'
})



// We could also make the keys here the values of an enumerated object, but
// there is less incentive to do so since it complicates the code and 
// it will be easier to catch a mistake here than mistyping and `enable` string
// export const defaultSettings = {
// 	'BROWSER': '$BROWSER',
// 	'DOMAINLIST_PRESSED': false,
// 	'MODE': extensionMode.enabled,
// 	'TUTORIAL_SHOWN': false,
// 	'TUTORIAL_SHOWN_IN_POPUP': false,
// }