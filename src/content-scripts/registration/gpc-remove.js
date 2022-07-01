/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
registration/gpc-dom.js
================================================================================
registration/gpc-dom.js is the content script, registered via the 
extension service worker, that injects another static script to provide full
DOM access and permissions
*/


// High Level:
// Static script that will be injected onto a page to allow it full access, not 
// an isolated-world access (see Chrome extension API docs on isolated worlds).
// Necessary to inject the GPC JS property on a page via full DOM permission.

// Requirements: 
// - INJECTION_SCRIPT must also be defined under "web_accessible_resources"
// - This url must be a (semi) absolute path from the compiled project to the script
//   (Please see webpack output file directory structure)
// - This script must be registered from the extension service worker w/ same URL
const REMOVAL_SCRIPT = 'content-scripts/injection/gpc-remove.js'


// Based on
// https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions
function injectStaticScript() {
  let s = document.createElement('script');
  s.src = chrome.runtime.getURL(REMOVAL_SCRIPT);
  s.online = function() {
    this.remove()
  }
  document.documentElement.prepend(s);
}
injectStaticScript();


// // Currently, adding a DOMContentLoaded listener makes the signal send late
// // and (I forget) might break the message passing with the service worker
// document.addEventListener("DOMContentLoaded", () => {

// chrome.runtime.sendMessage({ 
//   msg: "APPEND_GPC_PROP",
//   url: location.href,
// }, (response) => {
//   console.log("recieved response for appending gpc at sendMessage response", response);
//   if (response.sendGPC) {
//     injectStaticScript();
//   }
// })

// // This doesn't seem to work with the background for some reason? Not sure why
// chrome.runtime.onMessage.addListener(
//   function onMessageHandler(message, sender, sendResponse) {
//     console.log("RECIEVED")
//     if (message.msg == "APPEND_GPC_PROP_RESPONSE") {
//       console.log("recieved response for appending gpc at addListener", message);
//       if (message.sendGPC) {
//         injectStaticScript();
//       }
//     }
//   }
// );

// });

