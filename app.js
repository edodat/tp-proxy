/**
 * Main application script
 *
 * User: Etienne Dodat
 * Date: 29/08/13
 */

////////////////////
// INITIALIZATION //
////////////////////

var httpProxy = require('http-proxy'),
    fs = require('fs');

var bus = require('./controllers/bus.js');

var controllers = require('./controllers');

///////////////////
// CONFIGURATION //
///////////////////

var options = {
    https: {
        key: fs.readFileSync('ssl/key.pem', 'utf8'),
        cert: fs.readFileSync('ssl/cert.pem', 'utf8')
    }
};

///////////////////////////
// SERVICE BUS LISTENERS //
///////////////////////////

bus.initialize(function(){

    bus.on('agent.company', controllers.routes.onAgentCompany);
    bus.on('agent.shutdown', controllers.routes.onAgentShutdown);

    bus.discover();
});


//////////////////
// START SERVER //
//////////////////

controllers.routes.initialize();

var proxyServer = httpProxy.createServer(options, controllers.routes.processRequest);

proxyServer.listen(process.env.PORT || 443, function(){
    console.log('Proxy HTTPS server listening on port ' + proxyServer.address().port);
});
