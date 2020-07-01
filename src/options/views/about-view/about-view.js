/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
about-view.js
================================================================================
about-view.js loads about-view.html when clicked on the options page
*/


import { renderParse, fetchParse } from '../../components/util.js'

const headings = {
    title: 'About',
    subtitle: "Learn more about the OptMeowt"
}

export async function aboutView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/about-view/about-view.html', 'about-view')

    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML
}