var request = require('request'),
    maxPhotoTextLength = 200;

var requestWrapper = async params => {
    return new Promise((resolve, reject) => {
        request.post(
            params,
            function(err, response, body) {
                console.log('resolve');
                resolve(body);
            },
            function(err) {
                console.log('error', err);
                reject(err);
            }
        );
    });
};

class Utils {
    constructor() {}

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

module.exports = Utils;
