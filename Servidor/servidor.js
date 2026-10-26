let colors = require("colors");

let http = require("http");
let express = require("express");
let app = express();
app.use(express.static('./public'))

let server = http.createServer(app);
server.listen(3000)

console.log('servidor rodando...'.rainbow);
