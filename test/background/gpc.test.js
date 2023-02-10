/**
 *  Tests for testing GPC signals
 */

 import assert from 'assert';
 import puppeteer from 'puppeteer';


 import http from 'http';
 import fs from 'fs';
 import path from 'path';
 
 let browser
 let bgPage
 let teardown
 
 describe('GPC test', function () {
   this.timeout(20000000);
     before(async () => {

        const puppeteerOps = {
            headless: 'chrome',
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
        await new Promise(resolve => setTimeout(resolve, 1000));
         await browser.close()
     })
 
     it('Tests whether the GPC signal is properly set', async () => {         
             const page = await browser.newPage()
             let top_frame_header;
             let top_frame_api;
             //let gpc;
             await page.goto(`https://example.com`)

             await new Promise(resolve => setTimeout(resolve, 2000));
             //await page.reload();
             //await new Promise(resolve => setTimeout(resolve, 1000));

             const gpc = await page.evaluate(() => {
                    return (async () => {
                        return navigator.globalPrivacyControl
                    })()
                })
            
            //  await page.evaluate(async () => {
            //     gpc = await document.window.navigator.globalPrivacyControl;
            //     // await new Promise(resolve => setTimeout(resolve, 3000));

            //     // document.getElementById('start').click()
             
            //     // await new Promise(resolve => setTimeout(resolve, 3000));

            //     // document.getElementById('tests').click()

            //     // await new Promise(resolve => setTimeout(resolve, 3000));
            //     // top_frame_header = document.getElementById('test-top-frame header').innerHTML;
            //     // top_frame_api = document.getElementById('test-top-frame JS API').innerHTML;
            //  })

            assert.equal(gpc, true);
            //  assert.equal(top_frame_header, 1);
            //  assert.equal(top_frame_api, "true");
     })
 })