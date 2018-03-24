var request = require('request'),
    maxPhotoTextLength = 200;

var requestWrapper = params => {
    return new Promise((resolve, reject) => {
        console.log('promise');
        console.log(params);
        request.post(
            params,
            function(err, response, body) {
                console.log('resolve');
                resolve(err, response, body);
            },
            function(err) {
                console.log('error', err);
                reject(err);
            }
        );
    });
};

class TelegramBotAPI {
    constructor() {
        this.token = '579299516:AAFO3KZyZ8IDdKbJXnNmcC5LdbHTDXtXIYw'; //move to settings
        this.host = 'https://api.telegram.org/bot' + this.token + '/';
    }

    getHost() {
        return this.host;
    }

    async botReply(chat_id, message, keyboardButtons, isInline) {
        //ответ бота на сообщение
        //chat_id = id чата с юзером
        //message = сообщене
        //keyboardButtons = кнопки для ответа
        //isInline = true - клавиатура прямо в сообщении, false - клава в области ответа
        var form = {
            chat_id: chat_id,
            text: message
        };
        if (keyboardButtons) {
            form.reply_markup = isInline
                ? JSON.stringify(this.createReplyKeyboard(keyboardButtons))
                : JSON.stringify(this.createChatKeyboard(keyboardButtons));
        }

        return await requestWrapper({
            url: this.host + 'sendMessage',
            form: form
        });
    }

    async updateMessage(prop) {
        var url = this.host + 'editMessageText';
        return await requestWrapper({
            url: url,
            form: prop
        });
    }

    async answerCallbackQuery(queryId, message) {
        return await requestWrapper({
            url: this.host + 'answerCallbackQuery',
            form: {
                callback_query_id: queryId,
                text: message
            }
        });
    }

    async editMessageReplyMarkup(channelId, postId, keyboard) {
        if (!keyboard) {
            return;
        }
        return await requestWrapper({
            url: this.host + 'editMessageReplyMarkup',
            form: {
                chat_id: channelId,
                message_id: postId,
                reply_markup: keyboard
            }
        });
    }

    async postData(chat_id, data, keyboardButtons) {
        var that = this,
            data = Object.assign({}, data),
            message = data.message || '',
            sendNext = false,
            method = 'sendMessage',
            propertiesObject = {
                chat_id: chat_id
            };

        console.log(data);
        if (data.photo) {
            method = 'sendPhoto';
            propertiesObject.photo = data.photo;
            if (message && message.length > maxPhotoTextLength) {
                sendNext = true;
            } else {
                propertiesObject.caption = message;
            }
        } else {
            propertiesObject.text = message;
        }

        var url = this.host + method;
        if (!sendNext) {
            var reply_markup = [];
            if (keyboardButtons) {
                reply_markup = reply_markup.concat(
                    this.createReplyKeyboard(keyboardButtons).inline_keyboard
                );
            }
            if (reply_markup[0]) {
                propertiesObject.reply_markup = JSON.stringify({
                    inline_keyboard: reply_markup
                });
            }
        }
        var res = await requestWrapper({
            url: url,
            form: propertiesObject
        });

        if (res) {
            var date = new Date();
            console.log(message + ' ' + date);
            delete data.photo;
            sendNext
                ? that.postData(channel_id, data, type, keyboardButtons)
                : null;
        }
    }

    createChatKeyboard(keyboardButtons) {
        var processFn = function(item, i, arr) {
            var button = {
                text: item.title || ''
            };
            return button;
        };
        return this.createKeyboard(keyboardButtons, processFn);
    }

    createBotReplyKeyboard(keyboardButtons) {
        var processFn = function(item, i, arr) {
            var but = {
                val: item.value,
                t: 'bot'
            };
            var button = {
                text: item.title,
                callback_data: JSON.stringify(but)
            };
            return button;
        };

        return this.createKeyboard(keyboardButtons, processFn, true);
    }

    createReplyKeyboard(keyboardButtons, updateParams) {
        var processFn = function(item, i, arr) {
            var but = {
                val: item.value,
                t: 'vote'
            };
            var count = updateParams ? updateParams[item.value] || 0 : 0;
            var button = {
                text: item.title + ' ' + count,
                callback_data: JSON.stringify(but)
            };
            return button;
        };
        return this.createKeyboard(keyboardButtons, processFn, true);
    }

    createKeyboard(keyboardButtons, processFn, isInline) {
        if (keyboardButtons && keyboardButtons.length) {
            var keyboards = [];
            keyboardButtons.forEach(function(el) {
                var keyboard = el.map(processFn);
                keyboards.push(keyboard);
            });

            var reply_markup = isInline
                ? {
                      inline_keyboard: keyboards
                  }
                : {
                      keyboard: keyboards,
                      resize_keyboard: true,
                      one_time_keyboard: true
                  };
            return reply_markup;
        }
        return {
            remove_keyboard: true
        };
    }
}

module.exports = TelegramBotAPI;
