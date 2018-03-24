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

    async sendRequest(requestData = {}) {
        await this._openStartGibddPage();

        await this._acceptTermsAndConditions();

        await this._fillInForm(requestData);

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

    async _fillInForm({
        firstName,
        lastName,
        email,
        region,
        subdivision,
        requestDescription,
        captchaText
    }) {
        // "Регион"
        await this.page.evaluate(region => {
            document.querySelector(
                'form[id="request"] select[name="region_code"]'
            ).value = region;
        }, region);

        // "Подразделение"
        await this.page.evaluate(subdivision => {
            document.querySelector(
                'form[id="request"] select[id="subunit_check"]'
            ).value = subdivision;
        }, subdivision);

        // "Фамилия"
        await this.page.evaluate(lastName => {
            document.querySelector('#surname_check').value = lastName;
        }, lastName);

        // "Имя"
        await this.page.evaluate(firstName => {
            document.querySelector('#firstname_check').value = firstName;
        }, firstName);

        // "Адрес электронной почты"
        await this.page.evaluate(email => {
            document.querySelector('#email_check').value = email;
        }, email);

        // "Текст обращения"
        await this.page.evaluate(requestDescription => {
            document.querySelector(
                'form[id="request"] textarea[name="message"]'
            ).value = requestDescription;
        }, requestDescription);

        // TODO file upload
        // "Прикрепить файл"
        // await page.evaluate((files) => {
        //     document.querySelector('form[id="request"] input[id="fileupload-input"]').value = files;
        // }, files);

        // "Введите текст с изображения" (Каптча)
        await this.page.evaluate(captchaText => {
            document.querySelector(
                'form[id="request"] input[name="captcha"]'
            ).value = captchaText;
        }, captchaText);
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
