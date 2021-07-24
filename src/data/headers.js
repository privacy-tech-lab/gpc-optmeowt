/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
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