const gibddApi = require('./api-gateways/gibdd-api/gibdd.api');

gibddApi
    .sendRequest()
    .then(() => {
        console.log('Request done!');
    })
    .catch(err => {
        console.error('Ohh! Here is an error:');
        console.error(err);
    });
