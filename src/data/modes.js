/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
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
	functionality: {			// or, `functionality`, `operation` ?
		analysis: 'ANALYSIS',
		protection: 'PROTECTION'
	},
	readiness: {			// or, `availability`, `activeness`, `ability`, `readiness` ?
		enabled: 'ENABLED',
		domainlisted: 'DOMAINLISTED',
		disabled: 'DISABLED'
	}
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