/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
injection/gpc-dom.js
================================================================================
injection/gpc-dom.js is the static script injected by a related 
content script (registered from the extension service worker) for full DOM access
*/

/**
 * Sets Global Privacy Control (GPC) JavaScript property on the DOM
 */
function setDomSignal() {
  try {
    var GPCVal = true;
    var DNTVal = true;
    const GPCDomVal = `Object.defineProperties(Navigator.prototype, 
      { "globalPrivacyControl": {
		   get: () => ${GPCVal},
		   configurable: true,
		   enumerable: true
	   },
      "doNotTrack": {
      get: () => ${DNTVal},
      configurable: true,
      enumerable: true
    }});
    document.currentScript.parentElement.removeChild(document.currentScript);
	   `;

    const GPCDomElem = document.createElement("script");
    GPCDomElem.innerHTML = GPCDomVal;
    document.documentElement.prepend(GPCDomElem);

  } catch (e) {
    console.error(`Failed to set DOM signal: ${e}`);
  }
}

setDomSignal();
