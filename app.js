/**
 * Main application script
 *
 * User: Etienne Dodat
 * Date: 29/08/13
 */

////////////////////
// INITIALIZATION //
////////////////////

var httpProxy = require('http-proxy')
    fs = require('fs');


///////////////////
// CONFIGURATION //
///////////////////

var options = {
    https: {
        key: fs.readFileSync('ssl/key.pem', 'utf8'),
        cert: fs.readFileSync('ssl/cert.pem', 'utf8')
    }
};

var routingTable = {
    'www.tp.com': {
        host: 'localhost',
        port: 8000
    },
    'api.tp.com': {
        host: 'localhost',
        port: 8081
    },
    'app.tp.com':{
        host: 'localhost',
        port: 8080
    },
    'io.tp.com':{
        host: 'localhost',
        port: 8083
    }
};

var customHandler = function (req, res, proxy){
    var hostname = req.headers.host.split(':')[0];
    if (routingTable[hostname]) {
        proxy.proxyRequest(req, res, routingTable[hostname]);
    } else {
        res.send(404, 'Server not found');
    }

};

//////////////////
// START SERVER //
//////////////////

var proxyServer = httpProxy.createServer(options, customHandler);
proxyServer.listen(process.env.PORT || 443, function(){
    console.log('Proxy HTTPS server listening on port ' + proxyServer.address().port);
});
