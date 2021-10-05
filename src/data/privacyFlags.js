/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
privacyFlags.js
================================================================================
privacyFlags.js exports all privacy flags for analysis
*/


export const privacyFlags = {
    "flags":[
    {
        "name":"gdpr",
        "values":{
            "1":"protected",
            "0":"unprotected",
            "":"unset"
        },
        "jurisdiction":"eu",
        "legislation":"General Data Protection Regulation",
        "organization":"Interactive Advertising Bureau"
    },
    {
        "name":"gdpr_consent",
        "values":{
            "1":"protected",
            "0":"unprotected",
            "":"unset"
        },
        "jurisdiction":"eu",
        "legislation":"General Data Protection Regulation",
        "organization":"Interactive Advertising Bureau"
    },
    {
        "name":"gdpr_pd",
        "values":{
            "1":"protected",
            "0":"unprotected",
            "":"unset"
        },
        "jurisdiction":"eu",
        "legislation":"General Data Protection Regulation",
        "organization":"Interactive Advertising Bureau"
    },
    {
        "name":"usprivacy",
        "values":{
            "1":"protected",
            "0":"unprotected",
            "*---":"nonapplicable",
            "**Y*":"protected",
            "":"unset"
        },
        "jurisdiction":"us",
        "legislation":"California Consumer Privacy Act",
        "organization":"Interactive Advertising Bureau"
    },
    {
        "name":"rdp",
        "values":{
            "1":"protected",
            "0":"unprotected",
            "":"unset"
        },
        "jurisdiction":"us",
        "legislation":"California Consumer Privacy Act",
        "organization":"Alphabet"
    }
    ]
}