const TelegramBot = require('node-telegram-bot-api');
const Utils = require('./utils');
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
        this.token = '579299516:AAFO3KZyZ8IDdKbJXnNmcC5LdbHTDXtXIYw';
        this.telegramBot = new TelegramBot(this.token, { polling: true });
        this.utils = new Utils();
        this.setHandlers();
        this.initUsers();
    }

    initUsers() {
        // getUsersFromDB
        this.users = {};
    }

    async processError(errorText, chat_id, username) {
        var reply = await this.telegramBot.sendMessage(
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
            var reply = await this.telegramBot.sendMessage(chat_id, 'Отменено');
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
                const buttons = JSON.stringify(
                    this.utils.createChatKeyboard([[nextButton]])
                );
                var reply = await this.telegramBot.sendMessage(
                    chat_id,
                    'Чтобы отправить обращение нажмите Далее',
                    { reply_markup: buttons }
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
                const buttons = JSON.stringify(
                    this.utils.createChatKeyboard([[nextButton]])
                );
                var reply = await this.telegramBot.sendMessage(
                    chat_id,
                    welcomeMessage,
                    { reply_markup: buttons }
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
                const buttons = JSON.stringify(
                    this.utils.createChatKeyboard([[cancelButton]])
                );
                // send a message to the chat acknowledging receipt of their message
                var reply = await this.telegramBot.sendMessage(
                    chat_id,
                    'Введит имя и фамилию',
                    { reply_markup: buttons }
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
                    const buttons = JSON.stringify(
                        this.utils.createChatKeyboard([[cancelButton]])
                    );
                    var reply = await this.telegramBot.sendMessage(
                        chat_id,
                        'Введит email для ответа',
                        { reply_markup: buttons }
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
                    const buttons = JSON.stringify(
                        this.utils.createChatKeyboard([[cancelButton]])
                    );
                    // send a message to the chat acknowledging receipt of their message
                    var reply = await this.telegramBot.sendMessage(
                        chat_id,
                        'Введите текст обращения',
                        { reply_markup: buttons }
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
                    const buttons = JSON.stringify(
                        this.utils.createChatKeyboard([[cancelButton]])
                    );
                    // send a message to the chat acknowledging receipt of their message
                    var reply = await this.telegramBot.sendMessage(
                        chat_id,
                        'Прикрепите фото',
                        { reply_markup: buttons }
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
                    const buttons = JSON.stringify(
                        this.utils.createChatKeyboard([[cancelButton]])
                    );
                    // send a message to the chat acknowledging receipt of their message
                    var reply = await this.telegramBot.sendMessage(
                        chat_id,
                        'Подождем капчу',
                        { reply_markup: buttons }
                    );
                    this.users[username].photo = message.photo[0].file_id;

                    await this.navigateToFormPage(username);

                    try {
                        const buffer = await this.getCaptcha(username); // here is form-data

                        console.log('sending captcha...');
                        // send captcha to user
                        await this.telegramBot.sendPhoto(chat_id, buffer);
                    } catch (err) {
                        console.log('ERRRor when processing captcha!!!');
                        console.log(err);
                    }

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

    startBot() {
        this.telegramBot.on('message', msg => {
            const chatId = msg.chat.id;
            this.processResponse(msg);
        });
    }

    processResponse(data) {
        console.log(data);
        console.log('HEREEEE');
        var lastCommand = { message: data };

        if (
            lastCommand &&
            lastCommand.message &&
            lastCommand.message.from &&
            lastCommand.message.from.username
        ) {
            var username = lastCommand.message.from.username,
                chat_id = lastCommand.message.chat.id;
            console.log('HEREEEE2');
            if (this.users[username]) {
                this.users[username].interceptorHandler(
                    chat_id,
                    lastCommand.message.text,
                    username,
                    lastCommand.message
                );
                return;
            } else if (lastCommand.message.text === '/start') {
                console.log('HEREEEE3');
                this.handlers.start(chat_id, username);
                return;
            }
        }
    }
}

module.exports = UserBot;
