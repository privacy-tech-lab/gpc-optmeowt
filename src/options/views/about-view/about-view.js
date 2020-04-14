/*
about-view script
*/

import { renderParse, fetchParse } from '../../components/util.js'

const headings = {
    title: 'About',
    subtitle: "Learn more about the Privacy Rights Platform"
}

export async function aboutView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/about-view/about-view.html', 'about-view')

    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML
}