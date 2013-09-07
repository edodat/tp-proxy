/**
 * Node application launcher script with cluster support.
 *
 * This script launches app.js in children processes.
 *
 * Installation : put this script in the same directory than app.js.
 *
 * Parameters (usage: $ PARAM=VALUE node cluster-app.js) :
 *  NUM_PROC (optional) :   number of child processes created.
 *                          By default, cluster-app will use the number of CPUs for optimal resource usage.
 *
 *  Note : cluster-app will maintain the same number of children processes (automatic respawn).
 *  Note : all other parameters (eg: PORT) will be passed to app.js children processes.
 *
 * User: Etienne Dodat
 * Date: 06/09/13
 */

var cluster = require('cluster');

if (cluster.isMaster) {

    // Fork initial workers
    var numCPUs = require('os').cpus().length;
    var numProc = process.env.NUM_PROC || numCPUs;
    for (var i = 0; i < numProc; i++) {
        var worker = cluster.fork();
    }

    // Fork a new worker
    cluster.on('disconnect', function(worker) {
        console.error('worker disconnected');
        cluster.fork();
    });

    // Fork a new worker
    cluster.on('death', function(worker) {
        console.log('worker died');
        cluster.fork();
    });

} else {
    console.log('worker '+process.pid+' started');

    // LAUNCH APPLICATION IN CHILD PROCESS

    // Wrap in a domain to catch errors.
    // Documentation :  http://nodejs.org/api/domain.html.
    var domain = require('domain').create();
    domain.on('error', function(er) {
        console.error('error in worker '+process.pid, er.stack);
        // Note: we're in dangerous territory!
        // By definition, something unexpected occurred,
        // which we probably didn't want.
        // Anything can happen now!  Be very careful!
        try {
            // make sure we close down within 30 seconds
            var killtimer = setTimeout(function() {
                process.exit(1);
            }, 30000);
            // But don't keep the process open just for that!
            killtimer.unref();
            // Let the master know we're dead.  This will trigger a
            // 'disconnect' in the cluster master, and then it will fork
            // a new worker.
            cluster.worker.disconnect();
        } catch (er2) {
            // oh well, not much we can do at this point.
            console.error('Error killing worker '+process.pid, er2.stack);
        }
    });

    // Run
    domain.run(function(){
        require('./app.js');
    });

}