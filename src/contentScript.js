/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
contentScripts.js
================================================================================
contentScripts.js runs on every page and passes data to the background page
https://developer.chrome.com/extensions/content_scripts
*/


/**
 * Gets Frame:0 Tab content and sends to background script
 */
chrome.runtime.sendMessage({
  msg: "TAB",
  data: Date.now(),
});

console.log(location)
var url = new URL(location);
fetch(`${url.origin}/.well-known/gpc.json`)
  .then((response) => {
    return response.json()
  })
  .then((data) => {
    console.log(`.well-known via ContentScr: ${JSON.stringify(data)}`)
    chrome.runtime.sendMessage({
      msg: "WELLKNOWNCS",
      data: data,
    });
  })
  .catch((e) => {console.log(`.well-known error: ${e}`)})
