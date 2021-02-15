# OptMeowt GPC Implementation folder

This is related to issue (#134)

## Files

Location: `src\implementation`

This folder contains a compactified version of an "always on" Global Privacy Control signal that is contained within the `gpc.js` file. It also contains a very basic Chrome extension consisting of a `background.html` and its own `manifest.json` file. It simply implements the `gpc.js` file from within the `background.html` file in order to easily trasmit a "Do Not Sell/Share" signal to all sites. 

This version also contains a recent copy of `dom.js`, however this can be incorporated into `gpc.js` in the future. 


## Potential Discussions
- As a side note, we should also potentially address Chrome vs. Firefox compatability
- This version does not account for reading and displaying `.well-known` information
