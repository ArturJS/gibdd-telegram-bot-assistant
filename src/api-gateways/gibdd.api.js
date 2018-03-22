const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // see also https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagegotourl-options
    await page.goto('https://xn--90adear.xn--p1ai/request_main', {
        waitUntil: 'networkidle0'
    });
    await page.screenshot({ path: 'gibdd-start-newPage.png' });

    await browser.close();
})();
