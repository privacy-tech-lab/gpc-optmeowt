/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
dom.js
================================================================================
dom.js sets the GPC DOM property
*/


/**
 * Sets GPC DOM property
 */
function setDomSignal () {
    try {
        if ('globalPrivacyControl' in Navigator.prototype) {
            //console.log("Found globalPrivacyControl DOM signal, doing nothing!")
            return
        };

        var GPCVal = true
        const GPCDomVal = `Object.defineProperty(Navigator.prototype, "globalPrivacyControl", {
            get: () => ${GPCVal},
            configurable: true,
            enumerable: true
        });
        document.currentScript.parentElement.removeChild(document.currentScript);
        `

        const GPCDomElem = document.createElement('script');
        GPCDomElem.innerHTML = GPCDomVal;
        document.documentElement.prepend(GPCDomElem);
    } catch(e) {
        console.error(`Failed to set DOM signal: ${e}`)
    }
}

setDomSignal();