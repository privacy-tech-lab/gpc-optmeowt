/*
overview-view script
*/

import { renderParse, fetchParse } from '../../components/util.js'

const headings = {
    title: 'Overview',
    subtitle: "See how companies have been handling your 'Do Not Sell' requests"
}

export async function overviewView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/overview-view/overview-view.html', 'overview-view')

    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML
}