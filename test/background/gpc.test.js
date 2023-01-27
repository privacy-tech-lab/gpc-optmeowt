/**
 *  Tests for testing GPC signals
 */

 import harness from 'harness/harness.js';
 import backgroundWait from '../../node_modules/helpers/backgroundWait';
 import pageWait from '../../node_modules/helpers/pageWait';

 import http from 'http';
 import fs from 'fs';
 import path from 'path';
import { assert } from 'joi';
 
 let browser
 let bgPage
 let teardown
 
 describe('GPC test', () => {
     beforeAll(async () => {
         ({ browser, bgPage, teardown } = await harness.setup())
         await backgroundWait.forAllConfiguration(bgPage)

         chrome.scripting.registerContentScripts([
            {
              id: "1",
              matches: ["<all_urls>"],
              js: ["content-scripts/registration/gpc-dom.js"],
              runAt: "document_start",
            },
            {
              id: "2",
              matches: ["https://example.org/foo/bar.html"],
              js: ["content-scripts/registration/gpc-remove.js"],
              runAt: "document_start",
            },
          ]);

     })
     afterAll(async () => {
         await teardown()
     })
 
     it('Tests whether the GPC signal is properly set', async () => {         
             const page = await browser.newPage()
             await pageWait.forGoto(page, `https://good.third-party.site/privacy-protections/gpc/`)
             // Wait for injection; will be resolved with MV3 changes
             await page.waitForFunction(
                 () => navigator.globalPrivacyControl,
                 { polling: 100, timeout: 6000 }
             )
             await page.evaluate(() => {
                 document.getElementById('start').click()
             })
             await new Promise(resolve => setTimeout(resolve, 1000));
             await document.getElementById('tests').click()
             let top_frame_header = document.getElementById('test-top-frame header').innerHTML;
             let top_frame_api = document.getElementById('test-top-frame JS API').innerHTML;
             assert(top_frame_header, 1);
             assert(top_frame_api, "true");

     })
 })