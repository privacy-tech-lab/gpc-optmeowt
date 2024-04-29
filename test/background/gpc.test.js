/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
gpc.test.js
================================================================================
gpc.test.js tests the GPC signal head-fully using Puppeteer and Chromium
*/

/**
 *  Tests for testing GPC signals
 */

 import assert from 'assert';
 import puppeteer from 'puppeteer';
 
 // declaring a variable to store the puppeteer browser instance
 let browser

 
 if (!process.env.CI) {
    /**
     * First we need to check if process.env.CI is true. This is checking where a Continuous Integration (CI) is currently running
     * the test suite, or if it's being run locally. This test must only be run locally because it's headful and a browser should
     * pop on your computer briefly when it's being run.
     */
 describe('GPC test', function () { // Testing folder, contains 1 test
   this.timeout(20000);
     before(async () => {

        // Puppeteer configuration: we need to be in headful mode to enable the extension
        const puppeteerOps = {
            headless: false,
        }
        const args = []

        // Path to enable Chrome extension
        let extensionPath = 'dev/chrome'

        // disabling other extensions and loading our extension
        args.push('--disable-extensions-except=' + extensionPath)
        args.push('--load-extension=' + extensionPath)



        puppeteerOps.args = args // setting Puppeteer arguments
        browser = await puppeteer.launch(puppeteerOps) // lauching the browser
        await new Promise(resolve => setTimeout(resolve, 1000));
        

     })

     /**
      * This is a hook that waits for the tests to finish because this file uses Promises and async functions.
      * After the tests finish the browser will close on it's own.
      */
     after(async () => {
         await browser.close()
     })
 
     // specific test - checks if GPC and header signal are properly set
     it('Tests whether the GPC and header signal are properly set', async () => {     
             const page = await browser.newPage()


                // We navigate to the offical GPC site to test
                await page.goto(`https://global-privacy-control.glitch.me/`)
                await page.reload();
   
                // ------ GPC TEST ------
                // Evaluating in the context of the specific GPC page to get the value of navigator.globalPrivacyControl
                const gpc = await page.evaluate(async () => {
                   await new Promise(resolve => setTimeout(resolve, 1000));
   
                       return (async () => {
                            // Returning the value of navigator.globalPrivacyControl to the const 'gpc'
                           return navigator.globalPrivacyControl
                       })()
                   })
   
                // ------ HEADER TEST ------
               const header = await page.evaluate(async () => {
   
                    
                    /**
                     * Function to get the specific text of the element 'path' on the page using XPath
                     *      document.evaluate = evaluates an Xpath relative to 'document'
                     *      path = the location of the node we want, specific to the GPC webpage where we know the header is
                     *      XPathResult.FIRST_ORDERED_NODE_TYPE = the type of the result to be returned should be the first 
                     *          node that matches
                     *      .singleNodeValue = returns the node as an object or 'null' if there's no match
                     */
                   function getElementByXpath(path) {
                       return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                     }
   
                     // return only the inner text of the element to the const 'header'
                     // "/html/body/section[2]/div/div[1]/div/h3" is the specific path
                   return getElementByXpath("/html/body/section[2]/div/div[1]/div/h3").innerText;
                   
               })


            
            // Asserting that the header text and GPC value are what we expect
            assert.equal(header, 'Header present \nSec-GPC: "1"');
            assert.equal(gpc, true);
     })
 })
}