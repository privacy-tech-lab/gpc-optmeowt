/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

/*
settings.js
================================================================================
settings.js exports all default settings & frozen options (i.e., is the extension
enabled, disabled, or in domainlist mode?) All settings should be set to 
the settings store in storage (`stores.settings`)
*/

// `settings.js` exports: 
// (1) An object defining OptMeowt's 'enable' functionality (3 way switch)
// (2) The default global extension settings
//
// We could use strings instead of hard coding the following objects, however using an
// enumerated object prevents mistyping a string as a parameter, hopefully
// saving us some potential grief
export const extensionMode = Object.freeze({
	enabled: 'ENABLED',
	domainlisted: 'DOMAINLISTED',
	disabled: 'DISABLED'
})

// We could also make the keys here the values of an enumerated object, but
// there is less incentive to do so since it complicates the code and 
// it will be easier to catch a mistake here than mistyping and `enable` string
export const defaultSettings = {
	'MODE': extensionMode.enabled,
	'TUTORIAL_SHOWN': false,
	'BROWSER': '$BROWSER'
}