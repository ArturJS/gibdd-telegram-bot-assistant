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

/**
 * Takes a screenshot of a DOM element on the page, with optional padding.
 *
 * @param {!{path:string, selector:string, padding:(number|undefined)}=} opts
 * @return {!Promise<!Buffer>}
 */
const screenshotDOMElement = async (opts = {}) => {
    const padding = 'padding' in opts ? opts.padding : 0;
    const path = 'path' in opts ? opts.path : null;
    const { page, selector } = opts;

    if (!selector) throw Error('Please provide a selector.');

    if (!page) throw Error('Please provide the page.');

    const rect = await page.evaluate(selector => {
        const element = document.querySelector(selector);

        if (!element) return null;

        const { x, y, width, height } = element.getBoundingClientRect();

        return { left: x, top: y, width, height, id: element.id };
    }, selector);

    if (!rect)
        throw Error(
            `Could not find element that matches selector: ${selector}.`
        );

    return await page.screenshot({
        path,
        clip: {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
        }
    });
};

class BrowserSession {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();
    }

    async navigateToFormPage() {
        await this._openStartGibddPage();

        await this._acceptTermsAndConditions();
    }

    async getCaptchaImage() {
        return await screenshotDOMElement({
            // path: 'captcha-image.png',
            selector: '.captcha-img',
            page: this.page
        });
    }

    async sendRequest(requestData = {}) {
        await this.fillInForm(requestData);

        await this._createFullPageScreenshot();

        // todo submit form
    }

    async fillInForm({
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

    async sendConfirmCode(confirmCode) {
        // TODO
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
