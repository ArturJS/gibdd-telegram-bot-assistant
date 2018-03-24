const TelegramAPI = require('./telegram-bot.api');
const welcomeMessage =
    'Привет! \r\n \r\n' +
    'Этот Telegram bot создан для удобной отправки обращений о нарушениях правил дорожного движения.\r\n' +
    'Достаточно 1 раз ввести свои персональные данные и в последующем можно будет только прикреплять фотографии и описание. \r\n' +
    'При необходимости вы всегда можете исправить свои данные.\r\n \r\n' +
    'Для ввода данных и/или подачи обращения нажмите кнопку продолжить.' +
    'Обращаем ваше внимание на то, что отправляя обращение, вы соглашаетесь на обработку персональных данных сервисом ГИБДД';
const nextButton = { title: 'Далее' };
const cancelButton = { title: 'X Cancel' };
const request = require('request-promise');
const gibddApi = require('../gibdd-api/gibdd.api');
const db = require('../../models/index.js');

const sleep = async delay => {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
};

class UserBot {
    constructor() {
        this.telegramAPI = new TelegramAPI();
        this.time = 1500; //long-polling
        this.setHandlers();
        this.initUsers();
    }

    async startBot() {
        this.isWorking = true;
        this.hasStopped = false;

        while (this.isWorking) {
            await this.waitForUpdate();
        }

        this.hasStopped = true;
    }

    async waitForBotIsStopped() {
        return new Promise(resolve => {
            const intervalId = setInterval(() => {
                if (this.hasStopped) {
                    clearInterval(intervalId);
                    resolve();
                }
            }, 1000);
        });
    }

    async stopBot() {
        this.isWorking = false;

        await this.waitForBotIsStopped();
    }

    initUsers() {
        // getUsersFromDB
        this.users = {};
    }

    async processError(errorText, chat_id, username) {
        var reply = await this.telegramAPI.botReply(
            chat_id,
            errorText || 'Ошибка'
        );
        if (reply) {
            this.setToInitial(chat_id, username);
        }
    }

    setToInitial(chat_id, username) {
        this.handlers.initial(chat_id, username);
    }

    async processCancelButton(param, chat_id, username) {
        console.log(param);
        if (param === cancelButton.title) {
            var reply = await this.telegramAPI.botReply(chat_id, 'Отменено');
            if (reply) {
                this.setToInitial(chat_id, username);
            }
            return true;
        }
        return false;
    }

    setToInitial(chat_id, username) {
        this.handlers.initial(chat_id, username);
    }

    setHandlers() {
        this.handlers = {
            initial: async (chat_id, username) => {
                var reply = await this.telegramAPI.botReply(
                    chat_id,
                    'Чтобы отправить обращение нажмите далее',
                    [[nextButton]]
                );

                if (reply) {
                    if (!this.users[username]) {
                        this.users[username] = {};
                    }
                    this.users[
                        username
                    ].interceptorHandler = this.handlers.askName;
                }
                console.log(chat_id, reply);
            },
            start: async (chat_id, username) => {
                var reply = await this.telegramAPI.botReply(
                    chat_id,
                    welcomeMessage,
                    [[nextButton]]
                );

                if (reply) {
                    this.users[username] = {
                        interceptorHandler: this.handlers.askName
                    };
                    console.log(this.users[username]);
                }
                console.log(chat_id, reply);
            },
            askName: async (chat_id, text, username) => {
                var reply = await this.telegramAPI.botReply(
                    chat_id,
                    'Введит имя и фамилию',
                    [[cancelButton]]
                );

                if (reply) {
                    this.users[
                        username
                    ].interceptorHandler = this.handlers.askMail;
                }
                console.log(chat_id, reply);
            },
            askMail: async (chat_id, text, username) => {
                if (await this.processCancelButton(text, chat_id)) {
                    console.log('CACELED');
                    return;
                }
                if (text && text.length > 3) {
                    console.log('text!!!!!!!!');
                    var data = text.split(/\s+/g);
                    this.users[username].name = data[0];
                    this.users[username].surname = data[1];
                    var reply = await this.telegramAPI.botReply(
                        chat_id,
                        'Введит email для ответа',
                        [[cancelButton]]
                    );

                    if (reply) {
                        this.users[
                            username
                        ].interceptorHandler = this.handlers.askCommit;
                    }
                    console.log(chat_id, reply);
                } else {
                    await this.processError('Неверно введены имя или фамилия');
                }
            },
            askCommit: async (chat_id, text, username) => {
                if (await this.processCancelButton(text, chat_id)) {
                    return;
                }

                if (text && text.length > 1) {
                    this.users[username].email = text;
                    var reply = await this.telegramAPI.botReply(
                        chat_id,
                        'Введите текст обращения',
                        [[cancelButton]]
                    );

                    if (reply) {
                        this.users[
                            username
                        ].interceptorHandler = this.handlers.askDesсription;
                    }
                    console.log(chat_id, reply);
                } else {
                    await this.processError('Неверно введены имя или фамилия');
                }
            },
            askDesсription: async (chat_id, text, username) => {
                if (await this.processCancelButton(text, chat_id)) {
                    return;
                }

                if (text && text.length > 1) {
                    this.users[username].text = text;
                    var reply = await this.telegramAPI.botReply(
                        chat_id,
                        'Прикрепите фото',
                        [[cancelButton]]
                    );

                    if (reply) {
                        this.users[
                            username
                        ].interceptorHandler = this.handlers.waitForCapcha;
                    }
                    console.log(chat_id, reply);
                } else {
                    await this.processError('Неверно введен текст');
                }
            },
            waitForCapcha: async (chat_id, text, username, message) => {
                if (await this.processCancelButton(text, chat_id)) {
                    return;
                }

                console.log(message);
                if (message && message.photo && message.photo.length) {
                    var reply = await this.telegramAPI.botReply(
                        chat_id,
                        'Подождем капчу',
                        [[cancelButton]]
                    );
                    this.users[username].photo = message.photo[0].file_id;

                    await this.navigateToFormPage(username);

                    try {
                        const captchaImageForm = await this.getCaptcha(
                            username
                        ); // here is form-data

                        console.log('Stop updates checker...');
                        await this.stopBot();

                        console.log('sending captcha...');
                        // send captcha to user
                        await captchaImageForm.send(
                            `${this.telegramAPI.getHost()}sendPhoto?chat_id=${chat_id}`
                        );
                    } catch (err) {
                        console.log('ERRRor when processing captcha!!!');
                    }

                    this.startBot();

                    if (reply) {
                        this.setToInitial(chat_id, username);
                    }
                    console.log(chat_id, reply);
                } else {
                    await this.processError('Не прикреплена картинка');
                }
            }
        };
    }

    async navigateToFormPage(username) {
        const currentUser = this.users[username];
        const browserSession = (currentUser.browserSession = gibddApi.createBrowserSession());

        await browserSession.init();
        await browserSession.navigateToFormPage();
    }

    async getCaptcha(username) {
        console.log('try to get captcha...');
        const currentUser = this.users[username];
        const { browserSession } = currentUser;

        return await browserSession.getCaptchaImage();
    }

    async waitForUpdate() {
        while (true) {
            console.log('CHECK UPDATE');
            const data = await this.checkUpdate();
            const isUpdate = this.processResponse(data);

            if (isUpdate || !this.isWorking) {
                return true;
            }

            await sleep(1500);
        }
    }

    async checkUpdate() {
        const url = this.telegramAPI.getHost() + 'getUpdates';

        try {
            const offset = this.updateId ? '?offset=' + this.updateId : '';

            return await request(url + offset);
        } catch (err) {
            // do nothing
            console.log(err);
        }
    }

    processResponse(data) {
        if (!data) {
            return;
        }
        try {
            data = JSON.parse(data);
        } catch (error) {
            console.log(error);
            return;
        }

        data = data.result;
        console.log(data);
        if (!data) {
            return;
        }

        var lastCommand = data[data.length - 1];

        if (lastCommand && lastCommand.update_id) {
            this.updateId = lastCommand.update_id + 1;
        }

        if (
            lastCommand &&
            lastCommand.message &&
            lastCommand.message.from &&
            lastCommand.message.from.username
        ) {
            var username = lastCommand.message.from.username,
                chat_id = lastCommand.message.chat.id;

            if (this.users[username]) {
                this.users[username].interceptorHandler(
                    chat_id,
                    lastCommand.message.text,
                    username,
                    lastCommand.message
                );
                return;
            } else if (lastCommand.message.text === '/start') {
                this.handlers.start(chat_id, username);
                return;
            }
        }

        return true;
    }
}

module.exports = UserBot;
