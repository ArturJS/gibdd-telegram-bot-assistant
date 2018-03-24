const BrowserSession = require('./helpers/browser-session');
const db = require('../../models/index.js');

class GibddApi {
    async sendRequest() {
        const browserSession = new BrowserSession();

        await browserSession.create();

        const userData = await db.User.find({
            email: 'test@user.com'
        });

        await browserSession.sendRequest({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            region: '64', // Саратовская область
            subdivision: '54', // Гибдд по Саратовской области
            requestDescription: 'Некоторое описание...',
            captchaText: 'Каптча текст'
        }); // todo get user data from db and chatBot

        await browserSession.destroy();
    }
}

module.exports = new GibddApi();
