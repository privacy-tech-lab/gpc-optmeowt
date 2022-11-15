/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
main-view.js
================================================================================
main-view.js handles the navigation between different parts of the options page
and loads them when called through the navigation bar
*/

// ! We will probably have to "import" our html docs in order for Webpack to catch them
// ! This means removing the await "docs.html" lines in all of the options page views

import { fetchTemplate, parseTemplate } from "../../components/util.js";
import { settingsView } from "../settings-view/settings-view.js";
import { domainlistView } from "../domainlist-view/domainlist-view.js";
import { aboutView } from "../about-view/about-view.js";
import { storage, stores } from "../../../background/storage.js";
import Darkmode from "../../../theme/darkmode";

/**
 * Opens the `Settings` page
 * @param {string} bodyTemplate - stringified HTML template
 */
async function displaySettings(bodyTemplate) {
  settingsView(bodyTemplate);
  document.querySelector(".navbar-item.active").classList.remove("active");
  document.querySelector("#main-view-settings").classList.add("active");
}

/**
 * Opens the `Domainlist` page
 * @param {string} bodyTemplate - stringified HTML template
 */
function displayDomainlist(bodyTemplate) {
  domainlistView(bodyTemplate);
  document.querySelector(".navbar-item.active").classList.remove("active");
  document.querySelector("#main-view-domainlist").classList.add("active");
}

/**
 * Opens the `Display` page
 * @param {string} bodyTemplate - stringified HTML template
 */
function displayAbout(bodyTemplate) {
  aboutView(bodyTemplate);
  document.querySelector(".navbar-item.active").classList.remove("active");
  document.querySelector("#main-view-about").classList.add("active");
}

/**
 * Prepares the `Main` page elements and intializes the default `Settings` page
 */
export async function mainView() {
  let docTemplate = await fetchTemplate("./views/main-view/main-view.html");
  const bodyTemplate = await fetchTemplate(
    "./components/scaffold-component.html"
  );
  document.body.innerHTML =
    parseTemplate(docTemplate).getElementById("main-view").innerHTML;

  let domainlistPressed = await storage.get(
    stores.settings,
    "DOMAINLIST_PRESSED"
  );

  if (!domainlistPressed) {
    settingsView(bodyTemplate); // First page
    document.querySelector("#main-view-settings").classList.add("active");
  } else if (domainlistPressed) {
    domainlistView(bodyTemplate); // First page
    await storage.set(stores.settings, false, "DOMAINLIST_PRESSED");
    document.querySelector("#main-view-domainlist").classList.add("active");}

  document
    .getElementById("main-view-settings")
    .addEventListener("click", () => displaySettings(bodyTemplate));
  document
    .getElementById("main-view-domainlist")
    .addEventListener("click", () => displayDomainlist(bodyTemplate));
  document
    .getElementById("main-view-about")
    .addEventListener("click", () => displayAbout(bodyTemplate));

  // DARK MODE
  const darkmode = new Darkmode();

  //Listener: Listens for a message sent by popup.js
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    if (message.msg === "DARKSWITCH_PRESSED") {
      darkmode.toggle();
    }
    if (message.msg === "SHOW_TUTORIAL") {
      displaySettings(bodyTemplate);
    }
  });
}
