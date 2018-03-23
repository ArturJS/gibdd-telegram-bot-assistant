const puppeteer = require('puppeteer');

const sleep = async delay => {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
};

const waitForReload = async page => {
    return new Promise(resolve => {
        page.once('load', resolve);
    });
};

class GibddApi {
    async sendRequest() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        console.log('Open the page...');
        // see also https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagegotourl-options
        await page.goto('https://xn--90adear.xn--p1ai/request_main', {
            waitUntil: 'networkidle0'
        });

        console.log('Click checkbox "С информацией ознакомлен"...');
        await page.click('.ln-content-holder form label.checkbox');

        console.log('Click button "Подать обращение"...');
        await page.click('.ln-content-holder form .u-form__sbt');

        console.log('Waiting for navigation...');
        await waitForReload(page); // page.waitForNavigation not working if page reload happens

        console.log('Make screenshot...');
        await page.screenshot({ path: 'gibdd-start-newPage.png' });

        // TODO capture Captcha element for screenshot https://gist.github.com/malyw/b4e8284e42fdaeceab9a67a9b0263743

        console.log('Close the browser...');
        await browser.close();
    }
}

module.exports = new GibddApi();
