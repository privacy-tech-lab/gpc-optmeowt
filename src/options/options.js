/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
options.js
================================================================================
options.js starts the process of rendering the main options page
*/


import { mainView }from './views/main-view/main-view.js'


// CSS TO JS IMPORTS
import "../libs-css/uikit.min.css"
import "../libs-css/animate.compat.css"
import "./styles.css"

// HTML TO JS IMPORTS - TOP OF `popup.html`
import "../libs-js/uikit.min.js"
import "../libs-js/uikit-icons.min.js"
import "../libs-js/mustache.js"
import "../libs-js/popper.js"
import "../libs-js/tippy-bundle.umd.min.js"
import "./options.js"


/**
 * Intializes scripts that build the options page
 */
document.addEventListener('DOMContentLoaded', (event) => {
    mainView()
})
