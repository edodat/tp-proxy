/**
 * Network configuration
 *
 * User: Etienne
 * Date: 16/10/13
 */

module.exports.DOMAIN_NAME = 'tp.com';

module.exports.SUBDOMAIN = {
    www:    'www',
    io:     'io',
    app:    'app'
};

module.exports.WWW = {
    HOST: 'localhost',
    PORT: 8000
};

module.exports.IO = {
    HOST: 'localhost',
    PORT: 8083
};


module.exports.getSubdomain = function (type, companyKey){
    var subdomain = module.exports.SUBDOMAIN[type]+'.'+module.exports.DOMAIN_NAME;

    if (companyKey) return companyKey+'.'+subdomain;
    else return subdomain;
}

