const BrowserSession = require('./helpers/browser-session');

class GibddApi {
    createBrowserSession() {
        return new BrowserSession();
    }
}

module.exports = new GibddApi();
