/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

function setDomSignal () {
    try {
        if (navigator.globalPrivacyControl) {
            console.log("Found globalPrivacyControl, doing nothing!")
            return
        };

        var GPCVal = true
        const GPCDomVal = `Object.defineProperty(navigator, "globalPrivacyControl", {
            value: ${GPCVal},
            configurable: false,
            writable: false
        });
        document.currentScript.parentElement.removeChild(document.currentScript);
        `

        const GPCDomElem = document.createElement('script');
        GPCDomElem.innerHTML = GPCDomVal;
        document.documentElement.prepend(GPCDomElem);
        console.log("Set GPC signal.")
    } catch(e) {
        console.log(`Failed to set DOM signal: ${e}`)
    }
}

setDomSignal();
