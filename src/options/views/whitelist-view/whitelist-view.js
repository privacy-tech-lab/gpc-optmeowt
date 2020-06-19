/*
whitelist-view script
*/

import { renderParse, fetchParse } from '../../components/util.js'

const headings = {
    title: 'Whitelist',
    subtitle: "Create a custom list to send 'Do-Not-Sell' signals"
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
            <div class="uk-width-1-1" style="font-size: medium;">
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
    buildList();

    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML
}