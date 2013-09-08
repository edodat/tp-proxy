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
    'api.tp.com': {
        host: 'localhost',
        port: 8081
    },
    'app.tp.com':{
        host: 'localhost',
        port: 8080
    }
};

var customHandler = function (req, res, proxy){
    if (req.headers.host) {
        proxy.proxyRequest(req, res, routingTable[req.headers.host]);
    } else {
        res.send(401);
    }

};

//////////////////
// START SERVER //
//////////////////

var proxyServer = httpProxy.createServer(options, customHandler);
proxyServer.listen(process.env.PORT || 443, function(){
    console.log('Proxy server listening on port ' + proxyServer.address().port);
});
