const gibddApi = require('./api-gateways/gibdd-api/gibdd.api');
const db = require('./models/index.js');

(async () => {
    try {
        const browserSession = gibddApi.createBrowserSession();

        await browserSession.init();
        await browserSession.navigateToFormPage();

        const imageData = await browserSession.getCaptchaImage();

        console.log('imageData', imageData);

        const userData = await db.User.find({
            where: {
                email: 'test@user.com'
            }
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

        console.log('Request done!');
    } catch (err) {
        console.error('Ohh! Here is an error:');
        console.error(err);
    }
})();
