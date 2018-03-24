const BrowserSession = require('./helpers/browser-session');
const db = require('../../models/index.js');

class GibddApi {
    createBrowserSession() {
        return new BrowserSession();
    }
}

module.exports = new GibddApi();
