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
    getDirectories(__dirname + `/cdn/`).forEach((directory)=>{
        var files = fs.readdirSync(__dirname+ `/cdn/${directory}`).sort();
        var file = files[files.length - 1]
        try{
        preslength = Math.max(preslength, Number(path.basename(file, path.extname(file)).split("-")[0]))
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

function lastSlide(presid, slide){
    let lastSlide = 0;

        fs.readdirSync(__dirname+ `/cdn/${presid}`).forEach((file)=>{
            try{
            if(path.extname(file) == ".keep"){return;}
            lastSlide = Math.min(slide-1, Math.max(Number(path.basename(file, path.extname(file)).split("-")[0]), lastSlide));
            } catch (err) {
                throw new Error("invalid presentation")
            }
        });
    console.log(lastSlide);
    return lastSlide;
}

app.get('/reset/', (req, res) => {
    wss.clients.forEach((client) => {
        // console.log("i")
        // if(client !== ws && client.readyState === WebSocket.OPEN) {
            client.send("reset");
            // console.log(`${message}`);
            // console.log('send' + message)
        // }
    });
})

app.get('/slideinfo/:presid/:slide', (req, res) => {
    let file = findFile(req.params.presid, req.params.slide)
    let lastFile;
    if(file == undefined){
        lastFile = lastSlide(req.params.presid, req.params.slide);
        res.send({
            "slide": req.params.slide,
            "lastSlide": lastFile,
            "type":"keep",
            "src": `/slide/${req.params.presid}/${req.params.slide}`,
            "transition": {
                in: false,
                out: false,
                blend: false,
                "lengthIn": 1,
                "lengthOut": 1,
            },
        })
        return
    }
    //console.log(path.extname(findFile(req.params.presid, req.params.slide)));
    // console.log(path.basename(file, path.extname(file)).split("-"))
    var type = ()=>{ 
        try{
        switch(path.extname(file)){
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
            case ".keep":
                return "keep"
                break
            default:
                return "img"
                break;
        }
        } catch(err){
            console.log(`[info] "${req.params.presid}"-presentation missing slide ${req.params.slide}`)
            return "keep";
        }   
    }
    // yes please 🏳️‍🌈
    var transition = () => {
        let In = false;
        let Out = false;
        let blend = false;
        switch(path.basename(file, path.extname(file)).split("-")[1]){
                case "in":
                    In = true;
                    break;
                case "out":
                    Out = true;
                    break;
                case "inout":
                    In = true
                    Out = true
                    break;
                case "blend":
                    blend = true;
                    break;
                case "inblend":
                    In = true;
                    blend = true;        lastFile = lastSlide(req.params.presid, req.params.slide);

                    break;
                default:
                    break;
            }
        return({
            "blend" : blend,
            "in" : In,
            "out": Out,
        })
        }
    var transitionLengthIn = () => {
        var length =  Number(path.basename(file, path.extname(file)).split("-")[2]);
        if(isNaN(length)){
            return 1;
        } else {
            return length;
        }
    } 
    var transitionLengthOut = () => {
        var length =  Number(path.basename(file, path.extname(file)).split("-")[3]);
        if(isNaN(length)){
            return 1;
        } else {
            return length;
        }
    }
    var transInfo = transition()
    res.send({
        "slide": req.params.slide,
        "lastSlide": lastSlide(req.params.presid, req.params.slide),
        "type": type(),
        "src": `/slide/${req.params.presid}/${req.params.slide}`,
        "transition": {
            in: transInfo.in,
            out: transInfo.out,
            blend: transInfo.blend,
            "lengthIn": transitionLengthIn(),
            "lengthOut": transitionLengthOut(),
        },
    })
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
    
      if (baseName.toLowerCase().split("-")[0] === fileNameToSearch.toLowerCase()) {
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
