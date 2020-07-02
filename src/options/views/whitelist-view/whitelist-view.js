/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
whitelist-view.js
================================================================================
whitelist-view.js loads whitelist-view.html when clicked on the options page
*/


import { renderParse, fetchParse } from '../../components/util.js'
import { toggleListener } from "../../../whitelist.js";

/**
 * @typedef headings
 * @property {string} headings.title - Title of the given page
 * @property {string} headings.subtitle - Subtitle of the given page
 */
const headings = {
    title: 'Whitelist',
    subtitle: "Create a custom list to send 'Do-Not-Sell' signals"
}

/**
 * Creates the event listeners for the `Whitelist` page buttons and options
 */
function eventListeners() {
    document.getElementById('searchbar').addEventListener('keyup', filterList )
    createToggleListeners();
}

/**
 * Creates the specific whitelist toggles for each rendered domain in 
 * the whitelist
 */
function createToggleListeners() {
  chrome.storage.local.get(["DOMAINS"], function (result) {
    for (let domain in result.DOMAINS) {
      toggleListener(domain, domain)
    }
  });
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
  list = document.getElementById('whitelist-main')
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
 * Builds the list of domains in the whitelist, and their respective 
 * options, to be displayed
 */
function buildList() {
  let items = ""
  chrome.storage.local.get(["DOMAINS"], function (result) {
    for (let domain in result.DOMAINS) {
      items += 
            `
      <li>
        <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
          <div>
            <label>
              <input type="checkbox" id="select" class="check text-color dark-checkbox" />
            </label>
          </div>
          <div class="domain uk-width-expand" >
            `
            +
            domain
            +
            `
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
            +
            buildToggle(domain, result.DOMAINS[domain])
            // `<input type="checkbox" id="toggle-whitelist" />`
            +
            `
              <span></span>
            </label>
          </div>
          <div
            class="uk-badge button"
            style="
              margin-right: 5px; 
              margin-left: 5px;
              margin-top: auto;
              margin-bottom: auto;
              background-color: white;
              border: 1px solid #f44336;
              color: #f44336;
            "
          >
            Delete
          </div>
        </div>
      </li>
            `
    } 
    document.getElementById('whitelist-main').innerHTML = items;
  });
}

/**
 * Generates the HTML that will build the whitelist switch for a given 
 * domain in the whitelist
 * @param {string} domain - Any given domain
 * @param {bool} bool - Represents whether it is whitelisted or not
 * @return {string} - The stringified checkbox HTML compontent
 */
function buildToggle(domain, bool) {
  let toggle;
  if (bool) {
    toggle = `<input type="checkbox" id="` + domain + `" checked />`;
  } else {
    toggle = `<input type="checkbox" id="` + domain + `" />`;
  }
  return toggle
}

/**
 * Renders the `Whitelist` view in the options page
 * @param {string} scaffoldTemplate - stringified HTML template
 */
export async function whitelistView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/whitelist-view/whitelist-view.html', 'whitelist-view')
    
    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML

    buildList();
    eventListeners();
}