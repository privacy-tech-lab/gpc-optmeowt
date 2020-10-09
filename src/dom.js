function setDomSignal () {
    try {
        var GPCVal = 1
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
    } catch(e) {
        console.log(`Failed to set DOM signal: ${e}`)
    }
}

setDomSignal();