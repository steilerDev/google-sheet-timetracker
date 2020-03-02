const { DataProvider } = require('./util/DataProvider');
const { API } = require('./util/API');

const conf = require('../config/config.json');
const credentials = require('../config/credentials.json');
const info = require('./package.json');

const log = require('simple-node-logger').createSimpleLogger();
if(conf.debug) {
    log.setLevel('debug');
} else {
    log.setLevel('info');
}

log.info(`Welcome to ${info.name} by ${info.author.name} (${info.author.email}) v. ${info.version}`);

const dataProvider = new DataProvider(conf, credentials, log);
const api = new API(dataProvider, conf, log);

api.listen();

