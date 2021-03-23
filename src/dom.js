/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

function setDomSignal () {
    try {
        if ('globalPrivacyControl' in Navigator.prototype) {
            console.log("Found globalPrivacyControl DOM signal, doing nothing!")
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
        console.log("Set GPC signal.")
    } catch(e) {
        console.log(`Failed to set DOM signal: ${e}`)
    }
}

setDomSignal();
