/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

/*
headers.js
================================================================================
headers.js exports all optout headers to be attached per request
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