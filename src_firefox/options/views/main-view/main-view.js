/*
main-view script
*/

import {
  fetchTemplate,
  parseTemplate,
  animateCSS,
} from "../../components/util.js";
import { overviewView } from "../overview-view/overview-view.js";
import { settingsView } from "../settings-view/settings-view.js";
import { whitelistView } from "../whitelist-view/whitelist-view.js";
import { aboutView } from "../about-view/about-view.js";

async function displayOverview(bodyTemplate) {
    animateCSS("#scaffold", 'fadeOut', async function() {
        document.getElementById('scaffold').remove()
        await overviewView(bodyTemplate)
        animateCSS("#scaffold", 'fadeIn');
      });
      document.querySelector('.navbar-item.active').classList.remove('active')
      document.querySelector('#main-view-overview').classList.add('active')
}

async function displaySettings(bodyTemplate) {
    animateCSS("#scaffold", 'fadeOut', async function() {
        document.getElementById('scaffold').remove()
        await settingsView(bodyTemplate)
        animateCSS("#scaffold", 'fadeIn');
      });
      document.querySelector('.navbar-item.active').classList.remove('active')
      document.querySelector('#main-view-settings').classList.add('active')
}

function displayWhitelist(bodyTemplate) {
    animateCSS("#scaffold", 'fadeOut', async function() {
        document.getElementById('scaffold').remove()
        await whitelistView(bodyTemplate)
        animateCSS("#scaffold", 'fadeIn');
      });
      document.querySelector('.navbar-item.active').classList.remove('active')
      document.querySelector('#main-view-whitelist').classList.add('active')
}

function displayAbout(bodyTemplate) {
    animateCSS("#scaffold", 'fadeOut', async function() {
        document.getElementById('scaffold').remove()
        await aboutView(bodyTemplate)
        animateCSS("#scaffold", 'fadeIn');
      });
      document.querySelector('.navbar-item.active').classList.remove('active')
      document.querySelector('#main-view-about').classList.add('active')
}

export async function mainView() {
  let docTemplate = await fetchTemplate("./views/main-view/main-view.html");
  const bodyTemplate = await fetchTemplate(
    "./components/scaffold-component.html"
  );
  document.body.innerHTML = parseTemplate(docTemplate).getElementById(
    "main-view"
  ).innerHTML;

  overviewView(bodyTemplate); // First page

  document
    .getElementById("main-view-overview")
    .addEventListener("click", () => displayOverview(bodyTemplate));
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
