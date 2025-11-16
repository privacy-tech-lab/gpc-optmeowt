/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
cookieRemoval.test.js
================================================================================
Verifies that legacy cookie-based opt-out code was fully removed when the
extension dropped IAB/NAI cookie support.
*/

import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

const resolvePath = (relativePath) => path.resolve(repoRoot, relativePath);
const readFile = (relativePath) =>
  fs.readFileSync(resolvePath(relativePath), "utf8");

/**
 * Recursively searches a directory for a given string.
 * Stops early once the string is found.
 * NOTE: Only used on the `src` tree which is small enough for sync traversal.
 */
function containsInDir(dirPath, needle) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (containsInDir(fullPath, needle)) {
        return true;
      }
    } else {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes(needle)) {
        return true;
      }
    }
  }
  return false;
}

it("confirms legacy cookie source files were removed", () => {
  const removedFiles = [
    "src/background/cookiesIAB.js",
    "src/background/protection/cookiesOnInstall.js",
    "src/background/storageCookies.js",
    "src/data/cookie_list.js",
  ];

  removedFiles.forEach((filePath) => {
    assert.strictEqual(
      fs.existsSync(resolvePath(filePath)),
      false,
      `Expected ${filePath} to be removed`
    );
  });
});

describe("Check parsing of IAB signal", () => {
  it("should not reference parse helpers in chrome protection background", () => {
    const content = readFile("src/background/protection/protection.js");
    assert.ok(
      !content.includes("parseIAB") && !content.includes("cookiesIAB"),
      "chrome protection background still references legacy parse helpers"
    );
  });

  it("should not reference parse helpers in firefox protection background", () => {
    const content = readFile("src/background/protection/protection-ff.js");
    assert.ok(
      !content.includes("parseIAB") && !content.includes("cookiesIAB"),
      "firefox protection background still references legacy parse helpers"
    );
  });

  it("should not reference parse helpers in popup UI state", () => {
    const content = readFile("src/popup/popup.js");
    assert.ok(
      !content.includes("parseIAB") && !content.includes("cookiesIAB"),
      "popup still references legacy parse helpers"
    );
  });

  it("should not ship legacy parse tests", () => {
    assert.strictEqual(
      fs.existsSync(resolvePath("test/background/parseIAB.test.js")),
      false,
      "parseIAB.test.js should have been removed"
    );
  });
});

describe("Checks if cookie is stored per domain/subdomain", () => {
  const storageContent = readFile("src/background/storage.js");

  it("should not import storageCookies helper", () => {
    assert.ok(
      !storageContent.includes("storageCookies"),
      "storage.js still imports storageCookies helper"
    );
  });

  it("should guard storage.get against undefined keys", () => {
    const guardRegex =
      /async get\(store, key\)[\s\S]*?if \(typeof key === "undefined"\)/;
    assert.ok(
      guardRegex.test(storageContent),
      "storage.get does not guard against undefined keys"
    );
  });

  it("should guard storage.set against undefined keys", () => {
    const guardRegex =
      /async set\(store, value, key\)[\s\S]*?if \(typeof key === "undefined"\)/;
    assert.ok(
      guardRegex.test(storageContent),
      "storage.set does not guard against undefined keys"
    );
  });

  it("should guard storage.delete against undefined keys", () => {
    const guardRegex =
      /async delete\(store, key\)[\s\S]*?if \(typeof key === "undefined"\)/;
    assert.ok(
      guardRegex.test(storageContent),
      "storage.delete does not guard against undefined keys"
    );
  });

  it("should not call addCookiesForGivenDomain helper", () => {
    assert.ok(
      !storageContent.includes("addCookiesForGivenDomain"),
      "storage.js still references addCookiesForGivenDomain"
    );
  });

  it("should not call deleteCookiesForGivenDomain helper", () => {
    assert.ok(
      !storageContent.includes("deleteCookiesForGivenDomain"),
      "storage.js still references deleteCookiesForGivenDomain"
    );
  });
});

describe("Check different IAB signals for validity", () => {
  const srcRoot = resolvePath("src");

  it("should not reference isValidSignalIAB helper in source files", () => {
    assert.strictEqual(
      containsInDir(srcRoot, "isValidSignalIAB"),
      false,
      "Found isValidSignalIAB reference in src"
    );
  });

  it("should not reference makeCookieIAB helper in source files", () => {
    assert.strictEqual(
      containsInDir(srcRoot, "makeCookieIAB"),
      false,
      "Found makeCookieIAB reference in src"
    );
  });

  it("should not reference pruneCookieIAB helper in source files", () => {
    assert.strictEqual(
      containsInDir(srcRoot, "pruneCookieIAB"),
      false,
      "Found pruneCookieIAB reference in src"
    );
  });

  it("should not reference legacy cookie_list dataset", () => {
    assert.strictEqual(
      containsInDir(srcRoot, "cookie_list"),
      false,
      "Found cookie_list reference in src"
    );
  });
});
