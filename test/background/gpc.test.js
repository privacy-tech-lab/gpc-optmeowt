/**
 *  Tests for testing GPC signals
 */

 import assert from 'assert';
 import puppeteer from 'puppeteer';
 
 let browser

 
 describe('GPC test', function () {
   this.timeout(20000);
     before(async () => {

        const puppeteerOps = {
            headless: false,
        }
        const args = []

        let extensionPath = 'dev/chrome'

        args.push('--disable-extensions-except=' + extensionPath)
        args.push('--load-extension=' + extensionPath)

        puppeteerOps.args = args
        browser = await puppeteer.launch(puppeteerOps)
        await new Promise(resolve => setTimeout(resolve, 2000));
        

     })
     after(async () => {
        //await new Promise(resolve => setTimeout(resolve, 1000));
         await browser.close()
     })
 
     it('Tests whether the GPC and header signal are properly set', async () => {         
             const page = await browser.newPage()
             let rules;
             //let gpc;


            await page.goto("https://example.org/foo/bar.html")
            await page.reload();

            const gpc_neg = await page.evaluate(async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));

                    return (async () => {
                        return navigator.globalPrivacyControl
                    })()
                })

                await page.goto(`https://global-privacy-control.glitch.me/`)

                //await new Promise(resolve => setTimeout(resolve, 2000));
                await page.reload();
                //await new Promise(resolve => setTimeout(resolve, 1000));
   
                const gpc = await page.evaluate(async () => {
                   await new Promise(resolve => setTimeout(resolve, 2000));
   
                       return (async () => {
                           return navigator.globalPrivacyControl
                       })()
                   })
   
               const header = await page.evaluate(async () => {
   
                   function getElementByXpath(path) {
                       return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                     }
   
                   return getElementByXpath("/html/body/section[2]/div/div[1]/div/h3").innerText;
                   
               })


            

            
            assert.equal(header, 'Header present \nSec-GPC: "1"');
            assert.equal(gpc, true);
            assert.equal(gpc_neg, undefined);
     })
 })