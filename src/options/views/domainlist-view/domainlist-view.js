/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
domainlist-view.js
================================================================================
domainlist-view.js loads domainlist-view.html when clicked on the options page
*/


import { renderParse, fetchParse } from '../../components/util.js'
import { toggleListener, permRemoveFromDomainlist } from "../../../domainlist.js";

/**
 * @typedef headings
 * @property {string} headings.title - Title of the given page
 * @property {string} headings.subtitle - Subtitle of the given page
 */
const headings = {
    title: 'Domain List',
    subtitle: "Toggle which domains you would like to receive Do Not Sell signals"
}

/**
 * Creates the event listeners for the `domainlist` page buttons and options
 */
function eventListeners() {
    document.getElementById('searchbar').addEventListener('keyup', filterList )
    // document.getElementById('plus-button').addEventListener('keyup', plusButton )
    createToggleListeners();

    window.onscroll = function() { stickyNavbar() };
    var nb = document.getElementById("domainlist-navbar");
    var sb = document.getElementById("searchbar")
    var sticky = nb.offsetTop;

    /**
     * Sticky navbar
     */
    function stickyNavbar() {
      if (window.pageYOffset >= sticky) {
        nb.classList.add("sticky")
        // nb.classList.add("uk-grid")
        // sb.classList.add("uk-width-1-2")
        // document.getElementById("width-expand").classList.remove("uk-width-expand")
      } else {
        nb.classList.remove("sticky")
        // sb.classList.remove("uk-width-3-4")
      }
    }
}

/**
 * Creates the specific Domain List toggles as well as the perm delete
 * buttons for each domain
 */
function createToggleListeners() {
  chrome.storage.local.get(["DOMAINS"], function (result) {
    for (let domain in result.DOMAINS) {
      // MAKE SURE THE ID MATCHES EXACTLY
      toggleListener(domain, domain)
      deleteButtonListener(domain)
    }
  });
}

/**
 * Delete buttons for each domain
 * @param {string} domain 
 */
function deleteButtonListener (domain) {
  document.getElementById(`delete ${domain}`).addEventListener("click", 
    (async () => {
      let delete_prompt = `Are you sure you would like to permanently delete this domain from the Domain List?`
      let success_prompt = `Successfully deleted ${domain} from the Domain List. 
NOTE: It will be automatically added back to the list when the domain is requested again.`
      if (confirm(delete_prompt)) {
        await permRemoveFromDomainlist(domain)
        alert(success_prompt)
        document.getElementById(`li ${domain}`).remove();
      }
  }))
}

/**
 * Filterd lists code heavily inspired by
 * `https://www.w3schools.com/howto/howto_js_filter_lists.asp`
 * 
 * Enables live filtering of domains via the search bar
 */
function filterList() {
  let input, list, li, count
  input = document.getElementById('searchbar').value.toLowerCase();
  list = document.getElementById('domainlist-main')
  li = list.getElementsByTagName('li')
  count = li.length

  for (let i = 0; i < count; i++) {
      let d = li[i].getElementsByClassName('domain')[0];
      let txtValue = d.innerText; 
      if (txtValue.toLowerCase().indexOf(input) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  };
}

/**
 * Builds the list of domains in the domainlist, and their respective 
 * options, to be displayed
 */
function buildList() {
  let items = ""
  chrome.storage.local.get(["DOMAINS"], function (result) {
    for (let domain in result.DOMAINS) {
      items += 
            `
      <li id="li ${domain}">
        <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
          <div>
            <label class="switch">
            `
            +
              buildToggle(domain, result.DOMAINS[domain])
              //<input type="checkbox" id="select" class="check text-color dark-checkbox" />
            +
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
            `
            // +
            // buildToggle(domain, result.DOMAINS[domain])
            // // `<input type="checkbox" id="toggle-domainlist" />`
            +
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
                background-color: white;
                border: 1px solid #e06d62;
                color: #e06d62;
              "
            >
              Delete
            </button>

        </div>
      </li>
            `
    } 
    document.getElementById('domainlist-main').innerHTML = items;
  });
}

/**
 * Generates the HTML that will build the domainlist switch for a given 
 * domain in the domainlist
 * @param {string} domain - Any given domain
 * @param {bool} bool - Represents whether it is domainlisted or not
 * @return {string} - The stringified checkbox HTML compontent
 */
function buildToggle(domain, bool) {
  let toggle;
  if (bool) {
    // checkbox = `<input type="checkbox" id="select ${domain}" 
    //           class="check text-color dark-checkbox" checked />`;
    toggle = `<input type="checkbox" id="${domain}" checked />`;
  } else {
    // checkbox = `<input type="checkbox" id="select ${domain}" 
    //           class="check text-color dark-checkbox"/>`;
    toggle = `<input type="checkbox" id="${domain}" />`;
  }
  return toggle
}

/**
 * Renders the `domain list` view in the options page
 * @param {string} scaffoldTemplate - stringified HTML template
 */
export async function domainlistView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/domainlist-view/domainlist-view.html', 'domainlist-view')
    
    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML

    buildList();
    eventListeners();
}