/**
 * Service bus controller
 *
 * User: Etienne
 * Date: 01/10/13
 */

////////////////////
// INITIALIZATION //
////////////////////

var amqp = require('amqp'),
    config = require('../config/amqp.js');

/////////////
// PRIVATE //
/////////////

var connection;
var agentsExchange;
var queue;
var listeners = {};

/**
 * Initializes bus connection, exchanges and queue.
 * @param callback
 */
function initialize (callback){
    // Connect to bus
    connection = amqp.createConnection({ url: config.connectionURL });
    connection.on('ready', function() {
        console.log('[BUS] Connected to ' + connection.serverProperties.product);

        // declare "agents" AMQP exchange
        agentsExchange = connection.exchange('agents', {
            type: 'topic',
            durable: 'true'
        });

        // declare administration queue (named with agent hostname)
        queue = connection.queue('proxy', function(q){
            // Receive messages
            q.subscribe(function (message, headers, deliveryInfo) {
                console.log('[BUS] Received', deliveryInfo.routingKey, 'message:', message);
                var cb = listeners[deliveryInfo.routingKey];
                if (cb){
                    cb(message);
                } else {
                    console.log('[BUS] Routing key', deliveryInfo.routingKey, 'not handled. Message discarded.');
                }
            });

            callback(null);
        });
    });
}

/**
 * Publishes a message to the bus.
 * @param routingKey
 * @param message
 */
function publish (routingKey, message){
    console.log('[BUS] Publishing', routingKey, 'message:', message);
    agentsExchange.publish(routingKey, message);
}

////////////
// PUBLIC //
////////////

/**
 * Initializes bus connection, exchanges and queue.
 * @param callback
 */
module.exports.initialize = initialize;

/**
 * Closes connection.
 */
module.exports.close = function(){
    connection.end();
};

/**
 * Binds a listener to incoming bus messages.
 * @param routingKey
 * @param callback
 */
module.exports.on = function (routingKey, callback){
    queue.bind(agentsExchange, routingKey);
    listeners[routingKey] = callback;
    console.log('[BUS] Listening to', routingKey, 'messages');
}


/**
 * Publishes a message on startup to discover agents (instructs agents to declare themselves)
 */
module.exports.discover = function(){
    publish('proxy.discover', {  });
};

/**
 * Publishes a message to instruct server to run API instance
 */
module.exports.publishRun = function(host, companyKey){
    publish('proxy.run', { host: host, company: companyKey });
};

