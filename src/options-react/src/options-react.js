/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
options.js
================================================================================
options.js starts the process of rendering the main options page

babel renders this to the folder above src- use:
                                        npx babel --watch src --out-dir . --presets react-app/prod
(in the options-react directory)
*/
//import React from '../react';



'use strict';

class Options extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <p>test</p>;
  } 
}

console.log("runing");
ReactDOM.render(<Options/>, document.getElementById('options'));

var driver = new FirefoxDriver();


driver.
var webdriver = require('selenium-webdriver'),
    firefox = require('selenium-webdriver/firefox'),
    driver = null,
    profile = new firefox.Profile();
profile.setAcceptUntrustedCerts(true);
profile.setAssumeUntrustedCertIssuer(false);

var opts = new firefox.Options();
opts.setProfile(profile);
var builder = new webdriver.Builder().forBrowser('firefox');
builder.setFirefoxOptions(opts);
driver = builder.build();

driver.get('https://www.google.com');
console.log("done");
driver.quit();