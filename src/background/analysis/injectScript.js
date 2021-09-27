__uspapi('getUSPData', 1, (data) => {
	console.log("USP Data: ", data);
	window.postMessage(data, "*");
});