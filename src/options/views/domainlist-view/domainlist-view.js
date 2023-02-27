/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
domainlist-view.js
================================================================================
domainlist-view.js loads domainlist-view.html when clicked on the options page
*/

import { storage, stores } from "../../../background/storage.js";
import { renderParse, fetchParse } from "../../components/util.js";

import {
  addDomainToDomainlistAndRules,
  removeDomainFromDomainlistAndRules,
  updateRemovalScript,
} from "../../../common/editDomainlist.js";
import { reloadDynamicRules } from "../../../common/editRules.js";

/******************************************************************************/
/***************************** Toggle Functions *******************************/
/******************************************************************************/

/**
 * Generates the HTML that will build the domainlist switch for a given
 * domain in the domainlist
 * @param {string} domain - Any given domain
 * @param {(number|null)} id - Dynamic rule ID if domainlisted as "excluded"
 * @return {string} - The stringified checkbox HTML compontent
 */
export function buildToggle(domain, id) {
  let toggle;
  if (!id) {
    toggle = `<input type="checkbox" id="${domain}" checked />`;
  } else {
    toggle = `<input type="checkbox" id="${domain}" />`;
  }
  return toggle;
}

/**
 * Creates an event listener that toggles a given domain's stored value in
 * the domainlist if a user clicks on the object with the given element ID
 * @param {string} elementId - HTML element to be linked to the listener
 * @param {string} domain - domain to be changed in domainlist
 */
export async function toggleListener(elementId, domain) {
  document.getElementById(elementId).addEventListener("click", async () => {
    const domainId = await storage.get(stores.domainlist, domain);
    if (domainId == null) {
      await addDomainToDomainlistAndRules(domain);
    } else {
      await removeDomainFromDomainlistAndRules(domain);
    }
    //updateRemovalScript();
    chrome.runtime.sendMessage({
      msg: "FORCE_RELOAD",
    });
  });
}

/**
 * Creates the specific Domain List toggles as well as the perm delete
 * buttons for each domain
 */
async function createToggleListeners() {
  const domainlistKeys = await storage.getAllKeys(stores.domainlist);
  const domainlistValues = await storage.getAll(stores.domainlist);
  let domain;
  let domainValue;
  for (let index in domainlistKeys) {
    domain = domainlistKeys[index];
    domainValue = domainlistValues[index];
    // MAKE SURE THE ID MATCHES EXACTLY
    toggleListener(domain, domain);
    deleteButtonListener(domain);
  }
}

/**
 * Delete buttons for each domain
 * @param {string} domain
 */
function deleteButtonListener(domain) {
  document
    .getElementById(`delete ${domain}`)
    .addEventListener("click", async () => {
      let deletePrompt = `Are you sure you would like to permanently delete this domain from the Domain List?`;
      let successPrompt = `Successfully deleted ${domain} from the Domain List.
NOTE: It will be automatically added back to the list when the domain is requested again.`;
      if (confirm(deletePrompt)) {
        await storage.delete(stores.domainlist, domain);
        if ("$BROWSER" == "firefox") {
          chrome.runtime.sendMessage({
            msg: "REMOVE_FROM_DOMAINLIST",
            data: domain,
          });
        }

        reloadDynamicRules();
        updateRemovalScript();
        alert(successPrompt);
        document.getElementById(`li ${domain}`).remove();
      }
    });
}

/******************************************************************************/

/**
 * @typedef headings
 * @property {string} headings.title - Title of the given page
 * @property {string} headings.subtitle - Subtitle of the given page
 */
const headings = {
  title: "Domain List",
  subtitle:
    "Toggle which domains you would like to receive Do Not Sell signals in Protection Mode",
};

/**
 * Creates the event listeners for the `domainlist` page buttons and options
 */
async function eventListeners() {
  await createToggleListeners();

  window.onscroll = function () {
    stickyNavbar();
  };
  var nb = document.getElementById("domainlist-navbar");
  var sticky = nb.offsetTop;

  /**
   * Sticky navbar
   */
  function stickyNavbar() {
    if (window.pageYOffset >= sticky) {
      nb.classList.add("sticky");
    } else {
      nb.classList.remove("sticky");
    }
  }
}

/**
 * Builds the list of domains in the domainlist, and their respective
 * options, to be displayed
 */
async function buildList() {
  let items = "";
  let domain;
  let domainValue;
  const domainlistKeys = await storage.getAllKeys(stores.domainlist);
  const domainlistValues = await storage.getAll(stores.domainlist);
  for (let index in domainlistKeys) {
    domain = domainlistKeys[index];
    domainValue = domainlistValues[index];
    items +=
      `
    <li id="li ${domain}">
      <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
        <div>
          <label class="switch">
          ` +
      buildToggle(domain, domainValue) +
      `
            <span></span>
          </label>
        </div>
        <div class="domain uk-width-expand">
          ${domain}
        </div>
        <div style="
          margin-right: 5px;
          margin-left: 5px;
          margin-top: auto;
          margin-bottom: auto;
          "
        >
          <label class="switch" >
            <span></span>
          </label>
        </div>
          <button
            id="delete ${domain}"
            class="uk-badge button"
            type="button"
            style="
              margin-right: 5px;
              margin-left: 5px;
              margin-top: auto;
              margin-bottom: auto;
              padding-right: 5px;
              padding-left: 5px;
              background-color: white;
              border: 1px solid #e06d62;
              color: #e06d62;
            "
          >
            Delete
          </button>
      </div>
    </li>
          `;
  }
  document.getElementById("domainlist-main").innerHTML = items;
}

/**
 * Renders the `domain list` view in the options page
 * @param {string} scaffoldTemplate - stringified HTML template
 */
export async function domainlistView(scaffoldTemplate) {
  const body = renderParse(scaffoldTemplate, headings, "scaffold-component");
  let content = await fetchParse(
    "./views/domainlist-view/domainlist-view.html",
    "domainlist-view"
  );

  document.getElementById("content").innerHTML = body.innerHTML;
  document.getElementById("scaffold-component-body").innerHTML =
    content.innerHTML;

  await buildList();
  eventListeners();
}
