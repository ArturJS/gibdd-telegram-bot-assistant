const BrowserSession = require('./helpers/browser-session');

class GibddApi {
    async sendRequest() {
        const browserSession = new BrowserSession();

        await browserSession.create();

        await browserSession.sendRequest(); // todo get user data from db and chatBot

        await browserSession.destroy();
    }
}

module.exports = new GibddApi();
