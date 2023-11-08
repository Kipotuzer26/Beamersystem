const express = require('express')
const http = require('http');
const { arrayBuffer } = require('stream/consumers');
const WebSocket = require('ws')
const fs = require('fs');
const path = require('path');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

// const clients = new Map();

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


app.get('/presentations', (req, res) => {
    var presentations = []
    getDirectories(__dirname + '/cdn/').forEach((directory)=>{
        presentations.push(directory)
    })
    res.send(presentations)
})

function getDirectories(path){
    return fs.readdirSync(path).filter( (file) =>{
        return fs.statSync(path+'/'+file).isDirectory();
    })
}



app.get('/slideinfo/', (req, res) => {
    // console.log(path.extname(findFile(req.params.presid, req.params.slide)));
    preslength = 0;
    getDirectories(__dirname + "/cdn/").forEach((directory)=>{
        var files = fs.readdirSync(__dirname+ `/cdn/${directory}`).sort();
        var file = files[files.length - 1]
        try{
        preslength = Math.max(preslength, Number(path.basename(file, path.extname(file))))
        } catch (err) {
            throw new Error("invalid presentation")
        }
    })

    var info = {  
        "presLength": preslength,
        "slide": slide
    }
    res.send(info)
})

app.get('/slideinfo/:presid/:slide', (req, res) => {
    //console.log(path.extname(findFile(req.params.presid, req.params.slide)));
    var type = ()=>{ 
        try{
        switch(path.extname(findFile(req.params.presid, req.params.slide))){
            case ".png":
            case ".jpg":
            case ".gif":
                return "img"
                break;
            case ".mp4":
                return "video"
                break;
            case ".black":
                return "black"
                break;
            default:
                return "img"
                break;
        }
        } catch(err){
            console.log(`[info] "${req.params.presid}"-presentation missing slide ${req.params.slide}`)
            return "keep";
        }   
    }
    var info = {
        "type":type(),
    }
    res.send(info)
})

app.get('/slide/:presid/:slide', (req, res) =>{
    try {
        res.sendFile(findFile(req.params.presid, req.params.slide))
    } catch(err){
        res.send("Slide not found")
        console.log(`[info] "${req.params.presid}"-presentation missing slide ${req.params.slide}`)
    }
})

function findFile(presid, slide){
    const directoryToSearch = __dirname + `/cdn/${presid}`; // Replace with the directory you want to search in
    const fileNameToSearch = slide; // Replace with the desired file name (without extension)
    // console.log(directoryToSearch)
    const files = fs.readdirSync(directoryToSearch);
    
    for (const file of files) {
      const filePath = path.join(directoryToSearch, file);
      const baseName = path.basename(file, path.extname(file));
    
      if (baseName.toLowerCase() === fileNameToSearch.toLowerCase()) {
        return filePath; 
      }   
    }
    console.log("file not found")
}

wss.on('connection', (ws) => {
    ws.send(slide)
    // console.log('Websocket connected')

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            const { event, data } = parsedMessage;
        
            if (event === 'register') {
              const clientName = data;
    
              // Store the WebSocket connection with the client name
            //   clients.set(clientName, ws);
          
              console.log(`Client ${clientName} connected`);
              return;
            }
            if(event === 'slide'){
                console.log(`Recieved: ${data}`);
                slide = Number(`${data}`)
                wss.clients.forEach((client) => {
                    // console.log("i")
                    // if(client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(Number(`${data}`));
                        // console.log(`${message}`);
                        // console.log('send' + message)
                    // }
                });
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }

    })
        ws.on('close', (code, reason) => {
        //   const disconnectedClient = Array.from(clients.entries()).find(([name, client]) => client === ws);
        //   if (disconnectedClient) {
        //   const clientName = disconnectedClient;
        //   console.log(disconnectedClient)
        //   console.log(`Client ${clientName} disconnected`);
        //   clients.delete(clientName); // Remove the entry
        // }
    }) 
})

server.listen(3000, () => {
    console.log('Server is running on port 3000')
})
