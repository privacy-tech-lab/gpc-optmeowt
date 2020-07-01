/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
util.js
================================================================================
util.js contains global helper functions to help render the options page
*/


// Get local html file as string
export async function fetchTemplate(path) {
    try {
        let response = await fetch(path)
        let data = await response.text()
        return data
    }
    catch (e) {
        console.log('Failed to fetch page: ', e);
    }
}

// Parse string to html document
export function parseTemplate(template) {
    let parser = new DOMParser()
    let doc = parser.parseFromString(template, "text/html")
    return doc
}

// Fetches and parses html document; returns selected html
export async function fetchParse(path, id) {
    let template = await fetchTemplate(path)
    return parseTemplate(template).getElementById(id)
}

// Renders and parse html document; returns selected html
export function renderParse(template, data, id) {
    let renderedTemplate = Mustache.render(template, data)
    return parseTemplate(renderedTemplate).getElementById(id)
}

// Fetches, renders, and parses html document; returns selected html
export async function fetchRenderParse(path, data, id) {
    let template = await fetchTemplate(path)
    return renderParse(template, data, id).getElementById(id)
}

//https://github.com/daneden/animate.css#usage-with-javascript
export function animateCSS(element, animationName, callback) {
    const node = document.querySelector(element)
    node.classList.add('animated', animationName)

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}