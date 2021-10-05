/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
headers.js
================================================================================
headers.js exports all opt-out headers to be attached per request
*/


// headers must contain a name and a value
export const headers = {
    "Sec-GPC": {
        "name": "Sec-GPC",
        "value": "1"
     },
     "DNT": {
        "name": "DNT",
        "value": "1"
     }
}