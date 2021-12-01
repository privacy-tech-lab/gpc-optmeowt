/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
analysis-view.js
================================================================================
analysis-view.js loads analysis-view.html when clicked on the options page
*/


import { storage, stores } from '../../../background/storage.js';
import { renderParse, fetchParse } from '../../components/util.js';
import { isValidSignalIAB } from '../../../background/cookiesIAB.js'


/******************************************************************************/
/***************************** Dropdown Functions *****************************/
/******************************************************************************/


export async function dropListener(domain) {
  document.getElementById("li " + domain).addEventListener("click", () => {
    if (document.getElementById(domain + " analysis").style.display === "none") {
      document.getElementById("dropdown " + domain).src = "../assets/chevron-up.svg"
      document.getElementById(domain + " analysis").style.display = ""
      document.getElementById("li " + domain + " info").style.display = ""
    } else {
      document.getElementById("dropdown " + domain).src = "../assets/chevron-down.svg"
      document.getElementById(domain + " analysis").style.display = "none"
      document.getElementById("li " + domain + " info").style.display = "none"
    }
  });
}

/**
 * Creates the specific Dropdown toggles as well as the perm delete
 * buttons for each domain
 */
 async function createDropListeners(){
  let verdict;
  const analysisKeys = await storage.getAllKeys(stores.analysis)
  const analysisValues = await storage.getAll(stores.analysis)
  let domain;
  let data;
  for (let index in analysisKeys) {
    domain = analysisKeys[index];
    data = analysisValues[index];

    dropListener(domain)
    // Compliance information
    // if (data.DO_NOT_SELL_LINK_EXISTS 
    //     && data.SENT_GPC 
    //     && data.USPAPI_OPTED_OUT 
    //     && (data.USPAPI_BEFORE_GPC.length != 0) 
    //     && isValidSignalIAB(data.USPAPI_BEFORE_GPC[0].uspString)
    //   ){
    //     compliant(true, domain); 
    // } else {
    //     compliant(false, domain); 
    // }
  }
}


/**
 * Create the compliance label
 * @param {Boolean} verdict
 * @param {String} domain
 */
 function compliant (verdict, domain) {
   let identifier = document.getElementById(`${domain} compliance`);
   if(verdict == true){
    identifier.classList.add("compliant");
    identifier.style.border = "1px solid rgb(64,107,202)"; //0 100 170
    identifier.style.color = "rgb(64,107,202)";
    identifier.innerText = "Compliant";
   } else {
    identifier.classList.add("notCompliant");
    identifier.style.border = "1px solid rgb(222,107,20)"; //255 121 0
    identifier.style.color = "rgb(222,107,20)";
    identifier.innerText = "Not Compliant";
   }
}


/******************************************************************************/

/**
 * @typedef headings
 * @property {string} headings.title - Title of the given page
 * @property {string} headings.subtitle - Subtitle of the given page
 */
const headings = {
    title: 'Analyzed Domains',
    subtitle: "A breakdown of the CCPA compliance of sites you have visited in Analysis Mode"
}

/**
 * Filtered lists code heavily inspired by
 * `https://www.w3schools.com/howto/howto_js_filter_lists.asp`
 *
 * Enables live filtering of domains via the search bar
 */
 function filterList() {
  let input, list, li, count
  input = document.getElementById('searchbar').value.toLowerCase();
  list = document.getElementById('analysis-main')
  li = list.getElementsByTagName('li')
  count = li.length

  for (let i = 0; i < count; i++) {
      let d = li[i].getElementsByClassName('domain')[0];
      let txtValue = d.innerText;
      if (txtValue.toLowerCase().indexOf(input) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  };
}

/**
 * Creates the event listeners for the `domainlist` page buttons and options
 */
async function eventListeners() {
    document.getElementById('searchbar').addEventListener('keyup', filterList )
    // document.getElementById('plus-button').addEventListener('keyup', plusButton )
    await createDropListeners();

    window.onscroll = function() { stickyNavbar() };
    var nb = document.getElementById("analysis-navbar");
    var sb = document.getElementById("searchbar")
    var sticky = nb.offsetTop;

    /**
     * Sticky navbar
     */
    function stickyNavbar() {
      if (window.pageYOffset >= sticky) {
        nb.classList.add("sticky")
        // nb.classList.add("uk-grid")
        // sb.classList.add("uk-width-1-2")
        // document.getElementById("width-expand").classList.remove("uk-width-expand")
      } else {
        nb.classList.remove("sticky")
        // sb.classList.remove("uk-width-3-4")
      }
    }
}

/**
 * Builds the list of domains in the analysis, and their respective
 * options, to be displayed
 */
async function buildList() {
  let pos = "../../../../assets/cat-w-text/check1.png";
  let neg = "../../../../assets/cat-w-text/cross1.png"
  let specs = `style= "
    margin-right: 5px;
    margin-left: 5px;
    margin-top: auto;
    margin-bottom: auto;
    padding-right: 5px;
    padding-left: 5px;"
    `
  let items = ""
  let domain;

  const analysisKeys = await storage.getAllKeys(stores.analysis);
  console.log("analysisKeys", analysisKeys);
  const analysisValues = await storage.getAll(stores.analysis)
  console.log("analysisValues", analysisValues);
  for (let index in analysisKeys) {

    domain = analysisKeys[index]
    console.log("dnslink", analysisValues[index].DO_NOT_SELL_LINK_EXISTS,"sent gpc", analysisValues[index].SENT_GPC);

    let dnslink;
    let stringfound;
    let gpcsent;
    let stringchanged;

    let data = analysisValues[index];
    if (data.DO_NOT_SELL_LINK_EXISTS){
      dnslink = pos;
    } else {
      dnslink = neg;
    }
    let beforeGPC = data.USPAPI_BEFORE_GPC
    if (!beforeGPC[0]) {
      stringfound = neg;
    } else {
      if ((beforeGPC.length != 0) && isValidSignalIAB(beforeGPC[0].uspString)) {
        stringfound = pos;
      } else {
        stringfound = neg;
      }
    }
    if (data.SENT_GPC){
      gpcsent = pos;
    } else {
      gpcsent = neg;
    }
    if (data.USPAPI_OPTED_OUT){
      stringchanged = pos;
    } else {
      stringchanged = neg;
    }


    items +=
          `
    <li id="li ${domain}">
      <div id = "div ${domain}" uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
        <div>
          <div
          class="uk-container-analysis"
          style="margin: auto; padding: 0; padding-left: 30px;"
          uk-tooltip="Dropdown"
        >
          <img
            id="dropdown ${domain}"
            src="./assets/chevron-down.svg"
            height="15"
            width="15"
            alt="dropdown"
            uk-svg
          />
        </div>
            <span></span>
          </label>
        </div>
        <div class="domain uk-width-expand">
          ${domain}

        </div>
        <div style="
          margin-right: 5px;
          margin-left: 5px;
          margin-top: auto;
          margin-bottom: auto;
          "
        >
          <label class="switch" >
          `

          +
          `
            <span></span>
          </label>
    </li>

    <li id="li ${domain} info" style="display: none">
        <ul id="${domain} analysis" class="uk-list" style="display:none;padding-left:60px">
            <li>
                <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
                    <div class="domain uk-width-expand">
                    Do Not Sell Link 
                    </div>
                    <img src = ${dnslink} width = "40px" height = "40px" ${specs}>
                </div>
            </li>
            <li>
                <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
                    <div class="domain uk-width-expand">
                    US Privacy String 
                    </div>
                    <img src = ${stringfound} width = "40px" height = "40px" ${specs}>
                </div>
            </li>
            <li>
                <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
                    <div class="domain uk-width-expand">
                    Signal Sent 
                    </div>
                    <img src = ${gpcsent} width = "40px" height = "40px" ${specs}>
                </div>
            </li>
            <li>
                <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
                    <div class="domain uk-width-expand">
                    US Privacy String Updated 
                    </div>
                    <img src = ${stringchanged} width = "40px" height = "40px" ${specs}>
                </div> 
            </li>
        </ul>
    </li>
          `
  }
  document.getElementById('analysis-main').innerHTML = items;
}

/**
 * Renders the `domain list` view in the options page
 * @param {string} scaffoldTemplate - stringified HTML template
 */
export async function analysisView(scaffoldTemplate) {
    const body = renderParse(scaffoldTemplate, headings, 'scaffold-component')
    let content = await fetchParse('./views/analysis-view/analysis-view.html', 'analysis-view')

    document.getElementById('content').innerHTML = body.innerHTML
    document.getElementById('scaffold-component-body').innerHTML = content.innerHTML

    await buildList();

    eventListeners();
}