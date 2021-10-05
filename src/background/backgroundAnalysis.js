/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


import { debug } from "webpack"
import { defaultSettings } from "../data/defaultSettings.js"
import { extensionMode, stores, storage } from "./storage.js"

var urlFlags;

function preInit(){
  urlFlags = loadFlags();
}

function init(){

}

function loadFlags() {
  var urlFlags = [];
  //Load the privacy flags from the static json file
  fetch(chrome.extension.getURL('/data/privacy_flags.json'))
    .then((resp) => resp.json())
    .then(function (jsonData) {
      console.log("flagdata" + JSON.stringify(jsonData));
      flagObject = jsonData;
      console.log("FLAGONE" + jsonData.flags[0].name);
      flagObject.flags.forEach(flag => {
        urlFlags.push(flag.name);
      });
      console.log("URLFLAGS" + urlFlags);
    });
    return urlFlags;
}

//1: details 2: did we privatize this request?
function processTrackingRequest (details, privatized){
  var urlFlags = loadFlags();

  debug.log("Fingerprinting request recieved")
  if (details.urlClassification != null) {
    await storage.set(stores.analysis,details.documentURL,true);
    debug.log("Fingerprinting request recieved")
    debug.log(details.urlClassification)

    var settingsdict = parseURLForSignal(details.documentURL)
    //parse header
    for (let header of e.requestHeaders) {
      if (header.name.toLowerCase() in urlFlags) {
        // flag was in header
      }
    }

  }
  return details
}

function parseURLForSignal(url) {
  var flagSettingsDict = [];

  //Unescape the URL strip off everything until the parameter bit (anything after the question mark)
  url = unescape(url);
  url = url.substring(url.indexOf("\?"));
  if (url.length == 0) {
    return;
  }

  var params = new URLSearchParams(url);

  urlFlags.forEach(flag => {
    if (params.has(flag)) {
      flagSettingsDict[flag] = params.get(flag);
    }
  });

  return flagSettingsDict;
}

export{processTrackingRequest, preInit, init}