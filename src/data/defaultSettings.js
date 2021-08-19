/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
defaultSettings.js
================================================================================
defaultSettings.js exports the default global extension settings
*/


// import { extensionMode } from "../background/storage.js"
import { modes } from "./modes"

// We could also make the keys here the values of an enumerated object, but
// there is less incentive to do so since it complicates the code and 
// it will be easier to catch a mistake here than mistyping and `enable` string
export const defaultSettings = {
	'BROWSER': '$BROWSER',
	'DOMAINLIST_PRESSED': false,
	'FUNCTIONALITY': modes.functionality.protection,
	'READINESS': modes.readiness.enabled,
	'TUTORIAL_SHOWN': false,
	'TUTORIAL_SHOWN_IN_POPUP': false,
}