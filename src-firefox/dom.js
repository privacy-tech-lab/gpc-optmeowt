/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/

function setDomSignal () {
    let wrappedNavigator = navigator.wrappedJSObject;
    try {
        var GPCVal = 1
        Object.defineProperty(wrappedNavigator, "globalPrivacyControl", {
            value: GPCVal,
            configurable: false,
            writable: false
        });
        // document.currentScript.parentElement.removeChild(document.currentScript);
        

        // const GPCDomElem = document.createElement('script');
        // GPCDomElem.innerHTML = GPCDomVal;
        // document.documentElement.prepend(GPCDomElem);
    } catch(e) {
        console.log(`Failed to set DOM signal: ${e}`)
    }
}

setDomSignal();
