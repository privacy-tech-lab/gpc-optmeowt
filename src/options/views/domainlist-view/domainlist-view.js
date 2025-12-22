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
  getWellknownCheckOverrides,
  resolveWellknownCheckEnabled,
  setWellknownCheckOverrideForDomain,
  isWellknownCheckEnabled,
} from "../../../common/settings.js";

import {
  addDomainToDomainlistAndRules,
  removeDomainFromDomainlistAndRules,
  updateRemovalScript,
  deleteCS
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

export function buildWellknownToggle(domain, enabled) {
  const checked = enabled ? "checked" : "";
  return `<input type="checkbox" id="wellknown-${domain}" ${checked} aria-label="Check for /.well-known/gpc.json" />`;
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

    chrome.runtime.sendMessage({
      msg: "FORCE_RELOAD",
    });
  });
}

function wellknownToggleListener(elementId, domain) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }
  element.addEventListener("change", async (event) => {
    await setWellknownCheckOverrideForDomain(domain, event.target.checked);
  });
}

function showConfirmModal(message, callback) {
  const modal = document.getElementById("confirm-modal");
  const yesButton = document.getElementById("confirm-yes");
  const noButton = document.getElementById("confirm-no");

  // Set the message in the modal
  modal.querySelector("p").textContent = message;

  // Show the modal
  modal.classList.remove("hidden");

  // Handle "Yes" button click
  yesButton.onclick = () => {
    callback(true);  // Pass true to the callback if "Yes" was clicked
    modal.classList.add("hidden");  // Hide the modal
  };

  // Handle "No" button click
  noButton.onclick = () => {
    callback(false);  // Pass false to the callback if "No" was clicked
    modal.classList.add("hidden");  // Hide the modal
  };
}

function showAlert(message, callback) {
  const modal = document.getElementById("alert-modal");
  const okButton = document.getElementById("alert-ok");

  // Set the message in the modal
  modal.querySelector("p").textContent = message;

  // Show the modal
  modal.classList.remove("hidden");

  // Handle "OK" button click
  okButton.onclick = () => {
    callback();  // Call the callback after the alert is dismissed
    modal.classList.add("hidden");  // Hide the modal
  };
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
    wellknownToggleListener(`wellknown-${domain}`, domain);
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
      const deletePrompt = `Are you sure you would like to delete this domain from the Domain List?`;
      const successPrompt = `Successfully deleted ${domain} from the Domain List.`;

      showConfirmModal(deletePrompt, async (confirmed) => {
        if (confirmed) {
          // Proceed with deletion if user confirms
          await storage.delete(stores.domainlist, domain);

          reloadDynamicRules();
          updateRemovalScript();
          deleteCS();

          // Replacing alert() with custom showAlert()
          showAlert(successPrompt, () => {
            document.getElementById(`li ${domain}`).remove();
          });
        }
      });
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

  document.getElementById("delete-all-domains").addEventListener("click", async () => {
    const deletePrompt = `Are you sure you would like to delete all domains from the Domain List?`;
    const successPrompt = `Successfully deleted all domains from the Domain List.`;

    showConfirmModal(deletePrompt, async (confirmed) => {
      if (confirmed) {
        // If user clicks "Yes", proceed with deletion
        const domainlistKeys = await storage.getAllKeys(stores.domainlist);

        for (let domain of domainlistKeys) {
          await storage.delete(stores.domainlist, domain);
        }

        reloadDynamicRules();
        updateRemovalScript();
        deleteCS();

        // Show success message using the custom alert modal
        showAlert(successPrompt, () => {
          document.getElementById("domainlist-main").innerHTML = "";  // Clears the list visually
        });
      } else {
        // No action taken if user clicks "No"
      }
    });
  });

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
  const wellknownGlobalEnabled = await isWellknownCheckEnabled();
  const wellknownOverrides = await getWellknownCheckOverrides();
  const domainlistKeys = await storage.getAllKeys(stores.domainlist);
  const domainlistValues = await storage.getAll(stores.domainlist);
  for (let index in domainlistKeys) {
    domain = domainlistKeys[index];
    domainValue = domainlistValues[index];
    const wellknownEnabled = resolveWellknownCheckEnabled(
      domain,
      wellknownGlobalEnabled,
      wellknownOverrides
    );
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
          <label class="switch" title="Check for /.well-known/gpc.json">
          ` +
      buildWellknownToggle(domain, wellknownEnabled) +
      `
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
