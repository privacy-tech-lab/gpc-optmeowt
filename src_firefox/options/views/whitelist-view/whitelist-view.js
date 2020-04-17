/*
whitelist-view script
*/

import { renderParse, fetchParse } from '../../components/util.js'

const headings = {
    title: 'Whitelist',
    subtitle: "Create a custom list to send 'Do-Not-Sell' signals"
}

export async function whitelistView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/whitelist-view/whitelist-view.html', 'whitelist-view')

    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML
}