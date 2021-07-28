/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
options.js
================================================================================
options.js starts the process of rendering the main options page
*/


import { mainView } from './views/main-view/main-view.js'


// CSS TO JS IMPORTS
import "../../node_modules/uikit/dist/css/uikit.min.css"
import "../../node_modules/animate.css/animate.min.css"
import "./styles.css"

// HTML TO JS IMPORTS - TOP OF `popup.html`
import "../../node_modules/uikit/dist/js/uikit"
import "../../node_modules/uikit/dist/js/uikit-icons"
import "../../node_modules/mustache/mustache"
import "../../node_modules/@popperjs/core/dist/umd/popper"
import "../../node_modules/tippy.js/dist/tippy-bundle.umd"


/**
 * Intializes scripts that build the options page
 */
document.addEventListener('DOMContentLoaded', (event) => {
    mainView()
})
