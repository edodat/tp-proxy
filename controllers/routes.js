/**
 * Proxy routes controller
 *
 * User: Etienne Dodat
 * Date: 14/10/13
 */

////////////////////
// INITIALIZATION //
////////////////////

var bus = require('./bus.js');

/////////////
// PRIVATE //
/////////////

var routingTable = {
    'www.tp.com': {
        type: 'www',
        host: 'localhost',
        port: 8000,
        status: 'active'
    },
    'io.tp.com':{
        type: 'io',
        host: 'localhost',
        port: 8083,
        status: 'active'
    }
};

function getSubdomain(type, companyKey){
    return companyKey+'.'+type+'.tp.com';
}

function saveRoute(type, companyKey, host ,port, status){
    var subdomain = getSubdomain(type, companyKey);
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
    var subdomain = getSubdomain(type, companyKey);
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

////////////
// PUBLIC //
////////////

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
        //TODO "success" 202 (Accepted) or "error" 504 (Gateway Timeout) ?
        res.writeHead(504, {"Content-Type": "text/plain"});
        res.write('Instance starting...');
        res.end();

    // unknown route
    } else {
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write('Server not found');
        res.end();
    }
};

/**
 * Listener called when an API agent sends info for a company.
 */
module.exports.onAgentCompany = function(message){
    // route to 'app' is always active
    saveRoute('app', message.company, 'localhost', 8080, 'active');

    // route to 'api' depends on agent status
    var status = (message.status == 'running') ? 'active' : 'standby';
    saveRoute('api', message.company, message.host, message.port, status);
};

/**
 * Listener called when an API agent shuts down.
 */
module.exports.onAgentShutdown = function(message){
    removeRoutes('api', message.host);
};
