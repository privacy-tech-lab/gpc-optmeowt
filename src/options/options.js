/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
options.js
================================================================================
options.js starts the process of rendering the main options page
*/

import { mainView } from "./views/main-view/main-view.js";

// CSS TO JS IMPORTS
import "../../node_modules/uikit/dist/css/uikit.min.css";
import "../../node_modules/animate.css/animate.min.css";
import "./styles.css";

// HTML TO JS IMPORTS - TOP OF `popup.html`
import "../../node_modules/uikit/dist/js/uikit.js";
import "../../node_modules/uikit/dist/js/uikit-icons.js";
import "../../node_modules/mustache/mustache.js";
import "../../node_modules/@popperjs/core/dist/umd/popper.js";
import "../../node_modules/tippy.js/dist/tippy-bundle.umd.js";

/**
 * Intializes scripts that build the options page
 */
document.addEventListener("DOMContentLoaded", (event) => {
  mainView();
});
