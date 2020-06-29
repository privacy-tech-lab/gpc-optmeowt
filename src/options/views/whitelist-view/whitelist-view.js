/*
whitelist-view script
*/

import { renderParse, fetchParse } from '../../components/util.js'
import { toggleListener } from "../../../whitelist.js";

const headings = {
    title: 'Whitelist',
    subtitle: "Create a custom list to send 'Do-Not-Sell' signals"
}

function eventListeners() {
    document.getElementById('searchbar').addEventListener('keyup', filterList )
    createToggleListeners();
}

// passed in domains object after HTML rendered
function createToggleListeners() {
  chrome.storage.local.get(["DOMAINS"], function (result) {
    for (let domain in result.DOMAINS) {
      toggleListener(domain, domain)
    }
  });
}

// Filterd lists code heavily inspired by
// `https://www.w3schools.com/howto/howto_js_filter_lists.asp`
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

/* Generates the HTML component of whitelisted domains 
   based on the stored whitelist */
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

/* Generates the HTML component of whitelist toggle 
   based on whether a domain is true/false in the stored whitelist */
function buildToggle(domain, bool) {
  let toggle;
  if (bool) {
    toggle = `<input type="checkbox" id="` + domain + `" checked />`;
  } else {
    toggle = `<input type="checkbox" id="` + domain + `" />`;
  }
  return toggle
}

export async function whitelistView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/whitelist-view/whitelist-view.html', 'whitelist-view')
    
    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML

    buildList();
    eventListeners();
}