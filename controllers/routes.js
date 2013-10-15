/**
 * Proxy routes controller
 *
 * User: Etienne Dodat
 * Date: 14/10/13
 */

////////////////////
// INITIALIZATION //
////////////////////

/////////////
// PRIVATE //
/////////////

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

function createRoute(type, companyKey, host ,port){
    var subdomain = companyKey+'.'+type+'.tp.com';
    var route = {
        company: companyKey,
        host: host,
        port: port
    };
    routingTable[subdomain] = route;
    console.log('[PROXY] Added route', subdomain, '->', route.host+':'+route.port);
}

function removeRoute(type, companyKey){
    var subdomain = companyKey+'.'+type+'.tp.com';
    delete routingTable[subdomain];
    console.log('[PROXY] Removed route for subdomain', subdomain);
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
    if (routingTable[hostname]) {
        proxy.proxyRequest(req, res, routingTable[hostname]);
    } else {
        res.send(404, 'Server not found');
    }
};

/**
 * Listener called when an API agent sends info for a company.
 */
module.exports.onAgentCompany = function(message){
    if (message.status == 'running'){
        createRoute('api', message.company, message.host, message.port);
        createRoute('app', message.company, 'localhost', 8080);
    } else {
        removeRoute('api', message.company);
        removeRoute('app', message.company);
    }
};
