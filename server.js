var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');


var dictionary = null;

var dictionaryHandler = (request, response) => {
    var u = url.parse(request.url);

    if (u.pathname == '/') {
            response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            response.end('<p style="text-align: center;">Это голоссарий терминов.</p><hr/><p style="text-align: center;"><a href="./mindmap">Mindmap</a></p>');
        return;
    } 

    if (u.pathname == '/readyz') {
        if (dictionary) {
            response.writeHead(200);
            response.end('OK');
        } else {
            response.writeHead(404);
            response.end('Not Loaded');
        }
        return;
    }

     if (u.pathname == '/mindmap') {
        fs.readFile("./mindmap.html", function (err,data) {
            response.writeHead(200, {'Content-Type': 'text/html' });
            response.end(data)});
            return;
    }

    var key = '';
    if (u.pathname.length > 0) {
        key = u.pathname.substr(1).toUpperCase(); 
    }
    var def = dictionary[key];
    
    if (!def) {
        response.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});
        response.end(key + '<hr>' +'was not found');
        return;
    }
    response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    response.end(key + '<hr>' + def);
}

var downloadDictionary = (url, file, callback) => {
  var stream = fs.createWriteStream(file);
  var req = https.get(url, function(res) {
    res.pipe(stream);
    stream.on('finish', function() {
      stream.close(callback);
      console.log('dictionary downloaded');
    });
  }).on('error', function(err) {
    fs.unlink(file);
    if (callback) cb(err.message);
  });
};

var loadDictionary = (file, callback) => {
    fs.readFile(file, (err, data) => {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        dictionary = JSON.parse(data);
        console.log('dictionary loaded.');
        callback();
    })
};

downloadDictionary('https://raw.githubusercontent.com/shchitaev/dictionary-server/master/dictionary.json', 'dictionary.json', (err) => {
    if (err) {
        console.log(err);
        return;
    }
    loadDictionary('dictionary.json', (err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('ready to serve');
    });
});

const server = http.createServer(dictionaryHandler);

server.listen(8080, (err) => {  
  if (err) {
    return console.log('error starting server: ' + err);
  }

  console.log('server is listening on 8080');
});
