/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
main-view.js
================================================================================
main-view.js handles the navigation between different parts of the options page
and loads them when called through the navigation bar
*/


import {
  fetchTemplate,
  parseTemplate,
  animateCSS,
} from "../../components/util.js";
import { settingsView } from "../settings-view/settings-view.js";
import { whitelistView } from "../whitelist-view/whitelist-view.js";
import { aboutView } from "../about-view/about-view.js";

/**
 * Opens the `Settings` page
 * @param {string} bodyTemplate - stringified HTML template
 */
async function displaySettings(bodyTemplate) {
    animateCSS("#scaffold", 'fadeOut', async function() {
        document.getElementById('scaffold').remove()
        await settingsView(bodyTemplate)
        animateCSS("#scaffold", 'fadeIn');
      });
      document.querySelector('.navbar-item.active').classList.remove('active')
      document.querySelector('#main-view-settings').classList.add('active')
}

/**
 * Opens the `Whitelist` page
 * @param {string} bodyTemplate - stringified HTML template
 */
function displayWhitelist(bodyTemplate) {
    animateCSS("#scaffold", 'fadeOut', async function() {
        document.getElementById('scaffold').remove()
        await whitelistView(bodyTemplate)
        animateCSS("#scaffold", 'fadeIn');
      });
      document.querySelector('.navbar-item.active').classList.remove('active')
      document.querySelector('#main-view-whitelist').classList.add('active')
}

/**
 * Opens the `Display` page
 * @param {string} bodyTemplate - stringified HTML template
 */
function displayAbout(bodyTemplate) {
    animateCSS("#scaffold", 'fadeOut', async function() {
        document.getElementById('scaffold').remove()
        await aboutView(bodyTemplate)
        animateCSS("#scaffold", 'fadeIn');
      });
      document.querySelector('.navbar-item.active').classList.remove('active')
      document.querySelector('#main-view-about').classList.add('active')
}

/**
 * Prepares the `Main` page elements and intializes the default `Settings` page
 */
export async function mainView() {
  let docTemplate = await fetchTemplate("./views/main-view/main-view.html");
  const bodyTemplate = await fetchTemplate(
    "./components/scaffold-component.html"
  );
  document.body.innerHTML = parseTemplate(docTemplate).getElementById(
    "main-view"
  ).innerHTML;

  settingsView(bodyTemplate); // First page
  document.querySelector('#main-view-settings').classList.add('active')

  document
    .getElementById("main-view-settings")
    .addEventListener("click", () => displaySettings(bodyTemplate));
  document
    .getElementById("main-view-whitelist")
    .addEventListener("click", () => displayWhitelist(bodyTemplate));
  document
    .getElementById("main-view-about")
    .addEventListener("click", () => displayAbout(bodyTemplate));
}
