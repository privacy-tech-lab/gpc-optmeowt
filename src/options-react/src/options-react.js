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