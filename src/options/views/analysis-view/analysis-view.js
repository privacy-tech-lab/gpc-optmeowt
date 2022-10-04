/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
analysis-view.js
================================================================================
analysis-view.js loads analysis-view.html when clicked on the options page
*/

import { storage, stores } from "../../../background/storage.js";
import { renderParse, fetchParse } from "../../components/util.js";
import { isValidSignalIAB } from "../../../background/cookiesIAB.js";

/******************************************************************************/
/***************************** Dropdown Functions *****************************/
/******************************************************************************/

export async function dropListener(domain) {
  document.getElementById("li " + domain).addEventListener("click", () => {
    if (
      document.getElementById(domain + " analysis").style.display === "none"
    ) {
      document.getElementById("dropdown " + domain).src =
        "../assets/chevron-up.svg";
      document.getElementById(domain + " analysis").style.display = "";
      document.getElementById("li " + domain + " info").style.display = "";
    } else {
      document.getElementById("dropdown " + domain).src =
        "../assets/chevron-down.svg";
      document.getElementById(domain + " analysis").style.display = "none";
      document.getElementById("li " + domain + " info").style.display = "none";
    }
  });
}

/**
 * Creates the specific Dropdown toggles as well as the perm delete
 * buttons for each domain
 */
async function createDropListeners() {
  let verdict;
  const analysisKeys = await storage.getAllKeys(stores.analysis);
  const analysisValues = await storage.getAll(stores.analysis);
  let domain;
  let data;
  for (let index in analysisKeys) {
    domain = analysisKeys[index];
    data = analysisValues[index];

    dropListener(domain);
  }
}

/******************************************************************************/

/**
 * @typedef headings
 * @property {string} headings.title - Title of the given page
 * @property {string} headings.subtitle - Subtitle of the given page
 */
const headings = {
  title: "Analyzed Domains",
  subtitle: `A breakdown of the CCPA compliance of sites you have visited in Analysis Mode. 
      \n  Note: If you are not in California, websites may not honor your CCPA request.`,
};

/**
 * Filtered lists code heavily inspired by
 * `https://www.w3schools.com/howto/howto_js_filter_lists.asp`
 *
 * Enables live filtering of domains via the search bar
 */
function filterList() {
  let input, list, li, count;
  input = document.getElementById("searchbar").value.toLowerCase();
  list = document.getElementById("analysis-main");
  li = list.getElementsByTagName("li");
  count = li.length;

  for (let i = 0; i < count; i++) {
    let d = li[i].getElementsByClassName("domain")[0];
    let txtValue = d.innerText;
    if (txtValue.toLowerCase().indexOf(input) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

/**
 * Creates the event listeners for the `domainlist` page buttons and options
 */
async function eventListeners() {
  document.getElementById("searchbar").addEventListener("keyup", filterList);
  await createDropListeners();

  window.onscroll = function () {
    stickyNavbar();
  };
  var nb = document.getElementById("analysis-navbar");
  var sb = document.getElementById("searchbar");
  var sticky = nb.offsetTop;

  /**
   * Sticky navbar
   */
  function stickyNavbar() {
    if (window.pageYOffset >= sticky) {
      nb.classList.add("sticky");
    } else {
      nb.classList.remove("sticky");
    }
  }
}

/**
 * Builds the list of domains in the analysis, and their respective
 * options, to be displayed
 */
async function buildList() {
  let pos = "../../../../assets/cat-w-text/check1.png";
  let neg = "../../../../assets/cat-w-text/cross1.png";
  let specs = `style= "
    margin-right: 5px;
    margin-left: 5px;
    margin-top: auto;
    margin-bottom: auto;
    padding-right: 5px;
    padding-left: 5px;"
    `;
  let items = "";
  let domain;

  const analysisKeys = await storage.getAllKeys(stores.analysis);
  const analysisValues = await storage.getAll(stores.analysis);

  for (let index in analysisKeys) {
    domain = analysisKeys[index];

    let dnsLink;
    let stringFound;
    let gpcSent;
    let stringChanged;
    let data = analysisValues[index];
    let beforeGPCUSPAPI = data.USPAPI_BEFORE_GPC;
    let afterGPCUSPAPI = data.USPAPI_AFTER_GPC;
    let beforeGPCUSPCookies = data.USP_COOKIES_BEFORE_GPC;
    let afterGPCUSPCookies = data.USP_COOKIES_AFTER_GPC;
    let optedOut;

    if (data.USPAPI_OPTED_OUT) {
      optedOut = data.USPAPI_OPTED_OUT;
    } else {
      optedOut = data.USP_COOKIE_OPTED_OUT;
    }

    let uspStringBeforeGPC;
    let uspStringAfterGPC;

    // Generate the US Privacy String BEFORE GPC is sent
    // Give priority to the USPAPI over USP Cookie
    if (
      beforeGPCUSPAPI &&
      beforeGPCUSPAPI[0] &&
      beforeGPCUSPAPI[0]["uspString"]
    ) {
      uspStringBeforeGPC = beforeGPCUSPAPI[0]["uspString"];
    } else {
      if (
        beforeGPCUSPCookies &&
        beforeGPCUSPCookies[0] &&
        beforeGPCUSPCookies[0]["value"]
      ) {
        uspStringBeforeGPC = beforeGPCUSPCookies[0]["value"];
      } else {
        uspStringBeforeGPC = data.USPAPI_OPTED_OUT || data.USP_COOKIE_OPTED_OUT;
      }
    }

    // Generate the US Privacy String AFTER GPC is sent
    // Give priority to the USPAPI over USP Cookie
    if (afterGPCUSPAPI && afterGPCUSPAPI[0] && afterGPCUSPAPI[0]["uspString"]) {
      uspStringAfterGPC = afterGPCUSPAPI[0]["uspString"];
    } else {
      if (
        afterGPCUSPCookies &&
        afterGPCUSPCookies[0] &&
        afterGPCUSPCookies[0]["value"]
      ) {
        uspStringAfterGPC = afterGPCUSPCookies[0]["value"];
      } else {
        uspStringAfterGPC = data.USPAPI_OPTED_OUT || data.USP_COOKIE_OPTED_OUT;
      }
    }

    dnsLink = data.DO_NOT_SELL_LINK_EXISTS ? pos : neg;
    gpcSent = data.SENT_GPC ? pos : neg;

    if (!beforeGPCUSPAPI && !beforeGPCUSPCookies) {
      stringFound = neg;
    } else {
      let existsUSP =
        beforeGPCUSPAPI.length != 0 || beforeGPCUSPCookies.length != 0
          ? true
          : false;
      let existsAndIsValidBeforeGPCUSPAPI;
      let existsAndIsValidBeforeGPCUSPCookies;

      if (
        beforeGPCUSPAPI &&
        beforeGPCUSPAPI[0] &&
        beforeGPCUSPAPI[0].uspString
      ) {
        existsAndIsValidBeforeGPCUSPAPI = isValidSignalIAB(
          beforeGPCUSPAPI[0].uspString
        );
      } else {
        existsAndIsValidBeforeGPCUSPAPI = false;
      }
      if (
        beforeGPCUSPCookies &&
        beforeGPCUSPCookies[0] &&
        beforeGPCUSPCookies[0].value
      ) {
        existsAndIsValidBeforeGPCUSPCookies = isValidSignalIAB(
          beforeGPCUSPCookies[0].value
        );
      } else {
        existsAndIsValidBeforeGPCUSPCookies = false;
      }

      stringFound =
        existsUSP &&
        (existsAndIsValidBeforeGPCUSPAPI || existsAndIsValidBeforeGPCUSPCookies)
          ? pos
          : neg;
    }

    if (typeof optedOut === "string") {
      if (optedOut === "PARSE_FAILED") {
        stringChanged = neg;
      } else if (optedOut === "NOT_IN_CA") {
        stringChanged = neg;
      }
    } else {
      stringChanged = optedOut ? pos : neg;
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
          ` +
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
                    <img src = ${dnsLink} width = "40px" height = "40px" ${specs}>
                </div>
            </li>
            <li>
                <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
                    <div class="domain uk-width-expand">
                    US Privacy String 
                    </div>
                    <button class="uk-badge uspStringElem">${uspStringBeforeGPC}</button>
                    <img src = ${stringFound} width = "40px" height = "40px" ${specs}>
                </div>
            </li>
            <li>
                <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
                    <div class="domain uk-width-expand">
                    Signal Sent 
                    </div>
                    <img src = ${gpcSent} width = "40px" height = "40px" ${specs}>
                </div>
            </li>
            <li>
                <div uk-grid class="uk-grid-small uk-width-1-1" style="font-size: medium;">
                    <div class="domain uk-width-expand">
                    US Privacy String Updated 
                    </div>
                    <button class="uk-badge uspStringElem">${uspStringAfterGPC}</button>
                    <img src = ${stringChanged} width = "40px" height = "40px" ${specs}>
                </div> 
            </li>
        </ul>
    </li>
          `;
  }
  document.getElementById("analysis-main").innerHTML = items;
}

/**
 * Renders the `domain list` view in the options page
 * @param {string} scaffoldTemplate - stringified HTML template
 */
export async function analysisView(scaffoldTemplate) {
  const body = renderParse(scaffoldTemplate, headings, "scaffold-component");
  let content = await fetchParse(
    "./views/analysis-view/analysis-view.html",
    "analysis-view"
  );

  document.getElementById("content").innerHTML = body.innerHTML;
  document.getElementById("scaffold-component-body").innerHTML =
    content.innerHTML;

  await buildList();

  eventListeners();
}
