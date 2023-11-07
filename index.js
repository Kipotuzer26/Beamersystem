
const express = require('express')
const http = require('http');
const { arrayBuffer } = require('stream/consumers');
const WebSocket = require('ws')
const fs = require('fs');
const path = require('path');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

var slide = 1;
//serve a simple HTML page

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

app.get('/slide', (req, res) => {
    res.sendFile(__dirname + '/slide.html');
})

app.get('/controller', (req, res) => {
    res.sendFile(__dirname + '/controller.html');
})

app.get('/slideinfo/:presid/:slide', (req, res) => {
    // console.log(path.extname(findFile(req.params.presid, req.params.slide)));
    switch(path.extname(findFile(req.params.presid, req.params.slide))){
        case ".png":
        case ".jpg":
        case ".gif":
            res.send("img");
            break;
        case ".mp4":
            res.send("mov");
            break;
        default:
            res.send("unsure");
            break;
    }
})

app.get('/slide/:presid/:slide', (req, res) =>{
    res.sendFile(findFile(req.params.presid, req.params.slide))
})

function findFile(presid, slide){
    const directoryToSearch = __dirname + `/cdn/${presid}`; // Replace with the directory you want to search in
    const fileNameToSearch = slide; // Replace with the desired file name (without extension)
    
    const files = fs.readdirSync(directoryToSearch);
    
    for (const file of files) {
      const filePath = path.join(directoryToSearch, file);
      const baseName = path.basename(file, path.extname(file));
    
      if (baseName.toLowerCase() === fileNameToSearch.toLowerCase()) {
        return filePath; 
      }   
    }
    throw Error("File not found")
}

wss.on('connection', (ws) => {
    ws.send(slide)
    console.log('Websocket connected')

    ws.on('message', (message) => {
        console.log(`Recieved: ${message}`);

        wss.clients.forEach((client) => {
            // console.log("i")
            // if(client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(Number(`${message}`));
                slide = Number(`${message}`)
                // console.log(`${message}`);
                // console.log('send' + message)
            // }
        });
    })
    ws.on('close', () => {
        console.log('WebSocket disconnected');
    })
})

server.listen(3000, () => {
    console.log('Server is running on port 3000')
})