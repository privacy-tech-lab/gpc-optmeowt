/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
csvGenerator.js
================================================================================
csvGenerator.js takes info from analysis_userend and packages it for export
*/


/**
 * Generates the CSV to download consisting of the data in `csvData` with column
 * titles according to `titles` — specifically for analysis_userend
 * @param {Object} csvData 
 * @param {Object} titles 
 */
export function csvGenerator(csvData, titles) {

	// columnTitles is an array of "Domain" + the rest of the column titles defined 
	// as the keys in the `titles` object. 
	let columnTitles = ["Domain"];
	(Object.keys(titles)).map((key, i) => columnTitles.push(key));
  
	let csvContent = "data:text/csv;charset=utf-8,";  // inits the top of the csv
	csvContent += columnTitles.join(",") + "\n"       // appends the column titles
  
	for (let property in csvData) {                   // appends the data
	  csvContent += property + ",";
	  for (let i=1; i<columnTitles.length; i++) {
		let stringifiedProp = JSON.stringify(csvData[property][columnTitles[i]]);
		if (typeof stringifiedProp === "string") {
		  stringifiedProp = stringifiedProp.replace(/"/g, "\'");  // handles quotes in csv files
		  stringifiedProp = stringifiedProp.replaceAll("'", "");
		  stringifiedProp = stringifiedProp.replaceAll("[{", "");
		  stringifiedProp = stringifiedProp.replaceAll("}]", "");
		}
		csvContent += '\"' + stringifiedProp + "\",";
	  }
	  csvContent += "\n"
	}
	
	var encodedUri = encodeURI(csvContent);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "my_data.csv");
	document.body.appendChild(link);
  
	link.click();
}
