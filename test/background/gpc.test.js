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

import assert from "assert";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";

let browser;

if (!process.env.CI) {
  describe("GPC test", function () {
    this.timeout(20000);
    before(async () => {
      const puppeteerOps = {
        headless: false,
      };
      const args = [];

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const projectRoot = path.resolve(__dirname, "../../");
      let extensionPath = path.resolve(projectRoot, "dev/chrome");

      if (!fs.existsSync(extensionPath)) {
        extensionPath = path.resolve(projectRoot, "dist/chrome");
      }

      if (!fs.existsSync(extensionPath)) {
        throw new Error(
          "Unable to locate an OptMeowt build at dev/chrome or dist/chrome. " +
            "Run `npm run start:chrome` or `npm run build:chrome` before running this test."
        );
      }

      args.push("--disable-extensions-except=" + extensionPath);
      args.push("--load-extension=" + extensionPath);

      puppeteerOps.args = args;
      browser = await puppeteer.launch(puppeteerOps);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });
    after(async () => {
      await browser.close();
    });

    it("Tests whether the GPC and header signal are properly set", async () => {
      const page = await browser.newPage();

      await page.goto(`https://global-privacy-control.vercel.app/`);

      await page.reload();

      const gpc = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return (async () => {
          return navigator.globalPrivacyControl;
        })();
      });

      const header = await page.evaluate(async () => {
        function getElementByXpath(path) {
          return document.evaluate(
            path,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
        }

        return getElementByXpath("/html/body/section[2]/div/div[1]/div/h3")
          .innerText;
      });

      assert.equal(header, 'Header present \nSec-GPC: "1"');
      assert.equal(gpc, true);
    });
  });
}
