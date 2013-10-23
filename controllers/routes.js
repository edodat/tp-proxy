/**
 * Proxy routes controller
 *
 * User: Etienne Dodat
 * Date: 14/10/13
 */

////////////////////
// INITIALIZATION //
////////////////////

var fs = require('fs');

var network = require('../config/network.js');

var bus = require('./bus.js');

/////////////
// PRIVATE //
/////////////

// Hashmap to store proxy routes ( hostname => {type, company, host, port, status} )
var routingTable = {};

function saveRoute(type, companyKey, host ,port, status){
    var subdomain = network.getSubdomain(type, companyKey);
    var route = {
        type: type,
        company: companyKey,
        host: host,
        port: port,
        status: status
    };
    routingTable[subdomain] = route;
    console.log('[PROXY] Added', status, 'route', subdomain, '->', route.host+':'+route.port);
}

function removeRoute(type, companyKey){
    var subdomain = network.getSubdomain(type, companyKey);
    delete routingTable[subdomain];
    console.log('[PROXY] Removed route for subdomain', subdomain);
}

function removeRoutes(type, host){
    for (var subdomain in routingTable){
        if (routingTable[subdomain].type == type && routingTable[subdomain].host == host){
            delete routingTable[subdomain];
            console.log('[PROXY] Removed route for subdomain', subdomain);
        }
    }
}

function isXHR(req){
    var val = req.headers['X-Requested-With'] || req.headers['x-requested-with'] || '';
    return 'xmlhttprequest' == val.toLowerCase();
}

////////////
// PUBLIC //
////////////

/**
 * Initializes proxy default routes.
 */
module.exports.initialize = function(){
    saveRoute('www', null, network.WWW.HOST, network.WWW.PORT, 'active');
    saveRoute('io', null, network.IO.HOST, network.IO.PORT, 'active');
};

/**
 * Custom handler to process incoming request.
 * Either proxies it or rejects it.
 *
 * @param req
 * @param res
 * @param proxy
 */
module.exports.processRequest = function (req, res, proxy){
    var hostname = req.headers.host.split(':')[0];

    // active route
    if (routingTable[hostname] && routingTable[hostname].status == 'active') {
        proxy.proxyRequest(req, res, routingTable[hostname]);

    // standby route
    } else if (routingTable[hostname] && routingTable[hostname].status == 'standby') {
        bus.publishRun(routingTable[hostname].host, routingTable[hostname].company);
        if (isXHR(req)) {
            res.writeHead(504, {"Content-Type": "text/plain"});
            res.write('Instance starting...');
            res.end();
        } else {
            var view = __dirname+'/../public/starting.html';
            fs.readFile(view, function(err, html) {
                if(err) {
                    console.log('[PROXY] Error : Cannot access file', view);
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.write('<h1>Your private instance is starting. Please retry in a few moments..</h1>');
                    res.end();
                    return;
                }
                res.writeHead(200, {"Content-Type": "text/html"});
                res.write(html);
                res.end();
            });
        }

    // unknown route
    } else {
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write('Server not found');
        res.end();
    }
};

/**
 * Listener called when an APP agent sends info for a company.
 */
module.exports.onAgentCompany = function(message){
    // route to 'app' depends on agent status
    var status = (message.status == 'running') ? 'active' : 'standby';
    saveRoute('app', message.company, message.host, message.port, status);
};

/**
 * Listener called when an APP agent shuts down.
 */
module.exports.onAgentShutdown = function(message){
    removeRoutes('app', message.host);
};
