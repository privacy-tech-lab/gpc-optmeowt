const http = require('http');
const app = http.createServer((request, response) => {
    
    if (request.headers["dns"] === '0') {
        response.writeHead(200, {"dns": "received"});
        response.write(`Do Not Sell received, response sent!`)
    } else {
        response.write(`...`)
    }
    response.end(); 
});

app.listen(3000);