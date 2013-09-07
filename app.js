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
    hostnameOnly: true,
    router: {
        'api.tp.com': '127.0.0.1:8081',
        'app.tp.com': '127.0.0.1:8080'
    },
    https: {
        key: fs.readFileSync('ssl/key.pem', 'utf8'),
        cert: fs.readFileSync('ssl/cert.pem', 'utf8')
    }
};

//////////////////
// START SERVER //
//////////////////

var proxyServer = httpProxy.createServer(options);
proxyServer.listen(process.env.PORT || 443, function(){
    console.log('Proxy server listening on port ' + proxyServer.address().port);
});
