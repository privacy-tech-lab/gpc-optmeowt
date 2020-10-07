function setDomSignal () {
    const GPCDomVal = `Object.defineProperty(navigator, "globalPrivacyControl", {
        value: 1,
        configurable: false,
        writable: false
    });`

    const GPCDomElem = document.createElement('script');
    GPCDomElem.innerHTML = GPCDomVal;
    document.documentElement.prepend(GPCDomElem);
}

setDomSignal();