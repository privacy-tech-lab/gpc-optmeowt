/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
util.js
================================================================================
util.js contains global helper functions to help render the options page
*/


/**
 * Get local html file as string
 * @param {string} path - location of HTML template
 * @returns {string|none} - Returns the stringified HTML template or
 *                          prints an error
 */
import Mustache from "mustache";

export async function fetchTemplate(path) {
    let response = await fetch(path)
    let data = await response.text()
    return data
}

/**
 * Parse string to html document
 * @param {string} template - stringified HTML template
 * @returns {HTMLDocument} - also a Document
 */
export function parseTemplate(template) {
    let parser = new DOMParser()
    let doc = parser.parseFromString(template, "text/html")
    return doc
}

/**
 * Fetches and parses html document; returns selected html
 * @param {string} path - location of document to be parsed
 * @param {string} id - name of the element in doc to be selected
 *                      after it is parsed
 * @returns {Object} - element object related to the id parameter
 */
export async function fetchParse(path, id) {
    let template = await fetchTemplate(path)
    return parseTemplate(template).getElementById(id)
}

/**
 * Renders and parse html document; returns selected html
 * @param {string} template - stringified HTML doc template
 * @param {Object} data - specifically a `headings` object
 * @param {string} id - id of an element in an HTML doc
 * @returns {Object} - element object related to the id parameter
 */
export function renderParse(template, data, id) {
    let renderedTemplate = Mustache.render(template, data)
    return parseTemplate(renderedTemplate).getElementById(id)
}

/**
 * Fetches, renders, and parses html document; returns selected html
 * @param {string} path - location of document to be parsed
 * @param {Object} data - specifically a `headings` object
 * @param {string} id - id of an element in an HTML doc
 * @returns {Object} - element object related to the id parameter
 */
export async function fetchRenderParse(path, data, id) {
    let template = await fetchTemplate(path)
    return renderParse(template, data, id).getElementById(id)
}

/**
 * Animates a given css element
 * https://github.com/daneden/animate.css#usage-with-javascript
 * @param {string} element - a DOMString css selector
 * @param {string} animationName - name of the selected animation
 * @param {function} callback - callback function
 */
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
