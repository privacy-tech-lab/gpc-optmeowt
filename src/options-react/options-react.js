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
import React from '../react';


'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Options = function (_React$Component) {
  _inherits(Options, _React$Component);

  function Options(props) {
    _classCallCheck(this, Options);

    return _possibleConstructorReturn(this, (Options.__proto__ || Object.getPrototypeOf(Options)).call(this, props));
  }

  _createClass(Options, [{
    key: 'render',
    value: function render() {
      return React.createElement(
        'p',
        null,
        'test'
      );
    }
  }]);

  return Options;
}(React.Component);

console.log("runing");
ReactDOM.render(React.createElement(Options, null), document.getElementById('options'));

var driver = new FirefoxDriver();

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