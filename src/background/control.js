/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
control.js
================================================================================
control.js controls the flow of the extension
*/


import { background as analysis } from "./analysis/background";
import { background as protection } from "./protection/background";

// import {
// 	preinit as preinitAnalysis,
// 	init as initAnalysis,
// 	postinit as postinitAnalysis
// } from "./analysis/background";
// import {
// 	preinit as preinitProtection,
// 	init as initProtection,
// 	postinit as postinitProtection
// } from "./protection/background";

import { modes } from "../data/modes";
import { defaultSettings } from "../data/defaultSettings";

// const defaultMode = defaultSettings.MODE;
const defaultFunctionality = defaultSettings.FUNCTIONALITY;
const defaultReadiness = defaultSettings.READINESS;
const functionality = modes.functionality;
const readiness = modes.readiness;

// Mode listeners


// Mode init

if (defaultReadiness !== readiness.disabled) {
	switch (defaultFunctionality) {
		case functionality.analysis:
			analysis.preinit();
			analysis.init();
			analysis.postinit();
			break;
		case functionality.protection:
			protection.preinit();
			protection.init();
			protection.postinit();
			break;
		default:
			console.error("Loading extension functionality mode failed.");
	}
}

// if (defaultReadiness !== readiness.disabled) {
// 	switch (defaultFunctionality) {
// 		case functionality.analysis:
// 			preinitAnalysis();
// 			initAnalysis();
// 			postinitAnalysis();
// 			break;
// 		case functionality.protection:
// 			preinitProtection();
// 			initProtection();
// 			postinitProtection();
// 			break;
// 		default:
// 			console.error("Loading extension functionality mode failed.");
// 	}
// }