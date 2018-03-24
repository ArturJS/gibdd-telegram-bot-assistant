var request = require('request'),
    TelegramAPI = require('./telegram-bot.api'),
    welcomeMessage =
        'Привет! \r\n \r\n' +
        'Этот Telegram bot создан для удобной отправки обращений о нарушениях правил дорожного движения.\r\n' +
        'Достаточно 1 раз ввести свои персональные данные и в последующем можно будет только прикреплять фотографии и описание. \r\n' +
        'При необходимости вы всегда можете исправить свои данные.\r\n \r\n' +
        'Для ввода данных и/или подачи обращения нажмите кнопку продолжить.' +
        'Обращаем ваше внимание на то, что отправляя обращение, вы соглашаетесь на обработку персональных данных сервисом ГИБДД',
    nextButton = { title: 'Далее' },
    cancelButton = { title: 'X Cancel' };

class UserBot {
    constructor() {
        this.telegramAPI = new TelegramAPI();
        this.time = 1500; //long-polling
        this.setHandlers();
    }

    startBot() {
        var checkFunc = this.getMessageChecker();
        this.initUsers();
        this.timer = setInterval(checkFunc, this.time);
    }

    stopBot() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    initUsers() {
        // getUsersFromDB
        this.users = {};
    }

    setInterceptor(result, success, failure) {
        if (result && result.then) {
            result.then(() => {
                this.interceptorHandler = success;
            });
        } else {
            this.interceptorHandler = failure;
        }
    }

    async processCancelButton(param, chat_id) {
        if (param === cancelButton.title) {
            var reply = await this.telegramAPI.botReply(chat_id, 'Отменено');
            if (reply) {
                this.setToInitial(chat_id);
            }
            reply.then(() => {});
            return true;
        }
        return false;
    }

    setToInitial(chat_id) {
        this.interceptorHandler = null;
        this.handlers.start(chat_id);
    }

    setHandlers() {
        var that = this;
        this.handlers = {
            start: async function(chat_id) {
                var reply = await that.telegramAPI.botReply(
                    chat_id,
                    welcomeMessage,
                    [[nextButton]]
                );

                console.log(chat_id, reply);
            }
        };
    }

    getMessageChecker() {
        var url = this.telegramAPI.getHost() + 'getUpdates',
            that = this,
            lastUpdateId = null;
        return function() {
            if (lastUpdateId !== that.updateId) {
                request
                    .get(url + '?offset=' + that.updateId)
                    .on('response', function(response, data) {
                        //
                        response.on('data', function(data) {
                            that.processResponse(data);
                        });
                    })
                    .on('error', function(err) {
                        console.log('error!!');
                        lastUpdateId = null;
                    });
                lastUpdateId = that.updateId ? that.updateId : null;
            }
        };
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

            console.log(username);
            console.log(this.users);
            console.log(lastCommand.message.text);

            if (this.users[username]) {
                this.users[username].interceptorHandler(
                    lastCommand.message.chat.id,
                    lastCommand.message.text,
                    lastCommand.message
                );
                return;
            } else if (lastCommand.message.text === '/start') {
                this.handlers.start(chat_id);
                return;
            }
        }
    }
}

module.exports = UserBot;
