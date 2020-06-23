/*
whitelist-view script
*/

import { renderParse, fetchParse } from '../../components/util.js'
// import '../../libs/list.js-1.5.0/list.min.js'

const headings = {
    title: 'Whitelist',
    subtitle: "Create a custom list to send 'Do-Not-Sell' signals"
}

function eventListeners() {
    console.log("Loaded eventListeners();")
    document.getElementById('searchbar').addEventListener('keyup', () => {
        console.log("Searchbar listener activated...")
        
        input = document.getElementById('searchbar')
        filter = input.value.toLowerCase()
    })
}

// Constructs list of domains with `list.min.js`
async function buildListJS() {
    var options = {
        valueNames: [ 'domain' ],
        // Since there are no elements in the list, this will be used as template.
        item: `<li>
        <div class="uk-width-1-1 domain" style="font-size: medium;">
          <span
            class="uk-badge uk-align-right"
            style="
              margin: 0px;
              background-color: white;
              border: 1px solid #f44336;
              color: #f44336;
            "
          >
            Delete</span
          >
        </div>
      </li>`
      };
      
    var values = [];

    // Populate values
    chrome.storage.local.get(["DOMAINS"], function (result) {
        for (var d in result.DOMAINS) {
            values += { domain: d }
        }
    })
      
    var domainList = new List('whitelist-view', options, values);
      
    // chrome.storage.local.get(["DOMAINS"], function (result) {
    //     for (var d in result.DOMAINS) {
    //         domainList.add({
    //             domain: d,
    //           });
    //     }
    // })
}

async function buildList() {
    var stored_domains = []
    var items = ""
    chrome.storage.local.get(["DOMAINS"], function (result) {
        stored_domains = result.DOMAINS;
        for (var domain in result.DOMAINS) {
            items += 
                `
        <li>
            <div class="uk-width-1-1 domain" style="font-size: medium;">
                `
                +
                domain
                +
                `
            <span
                class="uk-badge uk-align-right"
                style="
                    margin: 0px;
                    background-color: white;
                    border: 1px solid #f44336;
                    color: #f44336;
                    "
                >
                    Delete
                </span>
            </div>
        </li>
                `
        }
        document.getElementById('whitelist-main').innerHTML = items;
    })
}

export async function whitelistView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/whitelist-view/whitelist-view.html', 'whitelist-view')
    // var values = { valueNames: ['domain'] }
    // var domainList = new List('whitelist-view', values)
    
    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML
    buildList();
    console.log("Finished building list.")

    eventListeners();
}