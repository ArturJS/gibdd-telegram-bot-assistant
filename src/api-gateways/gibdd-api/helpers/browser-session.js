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

class BrowserSession {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async create() {
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();
    }

    async sendRequest({
        firstName,
        lastName,
        email,
        region,
        subdivision,
        requestDescription
    } = {}) {
        await this._openStartGibddPage();

        await this._acceptTermsAndConditions();

        // console.log('Make screenshot...');
        // await this.page.screenshot({ path: 'gibdd-start-newPage.png' });
        await this._createFullPageScreenshot();

        // TODO capture Captcha element for screenshot https://gist.github.com/malyw/b4e8284e42fdaeceab9a67a9b0263743
    }

    async destroy() {
        console.log('Close the browser...');
        return await this.browser.close();
    }

    async _openStartGibddPage() {
        console.log('Open the page...');
        // see also https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagegotourl-options
        await this.page.goto('https://xn--90adear.xn--p1ai/request_main', {
            waitUntil: 'networkidle0'
        });
    }

    async _acceptTermsAndConditions() {
        console.log('Click checkbox "С информацией ознакомлен"...');
        await this.page.click('.ln-content-holder form label.checkbox');

        console.log('Click button "Подать обращение"...');
        await this.page.click('.ln-content-holder form .u-form__sbt');

        console.log('Waiting for navigation...');
        await waitForReload(this.page); // page.waitForNavigation not working if page reload happens
    }

    async _createFullPageScreenshot() {
        console.log('Make screenshot...');

        const { clientWidth, scrollHeight } = await this.page.$eval(
            'body',
            ({ clientWidth, scrollHeight }) => ({ clientWidth, scrollHeight })
        );

        const screenshot = await this.page.screenshot({
            clip: {
                x: 0,
                y: 0,
                width: clientWidth,
                height: scrollHeight
            },
            path: 'gibdd-start-newPage.png'
        });
    }
}

module.exports = BrowserSession;
