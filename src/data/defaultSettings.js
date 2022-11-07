/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
defaultSettings.js
================================================================================
defaultSettings.js exports the default global extension settings
*/

import { modes } from "./modes"

// We could also make the keys here the values of an enumerated object, but
// there is less incentive to do so since it complicates the code and 
// it will be easier to catch a mistake here than mistyping and `enable` string
export const defaultSettings = {
	'BROWSER': '$BROWSER',
	'ANALYSIS_PRESSED' : false,
	'ANALYSIS_STARTED' : false,
}