const devConnectionString =
    'postgres://jvlxrhdzojxtuq:d5d5184aacd421de8b2b4aac0d8e815c84d45244252ad7433629264f56d499a4@ec2-79-125-117-53.eu-west-1.compute.amazonaws.com:5432/damv522tlirk5c';
const { DATABASE_URL = devConnectionString } = process.env;

const dbParamsRegExp = new RegExp(
    [
        '^[^:]+://', // scheme
        '([^:]+):', // username
        '([^@]+)@', // password
        '([^:]+):', // host
        '([^/]+)\\/', // port
        '(.+)$' // database
    ].join('')
);

const [
    ,
    DB_USERNAME,
    DB_PASSWORD,
    DB_HOSTNAME,
    DB_PORT,
    DB_NAME
] = dbParamsRegExp.exec(DATABASE_URL);

module.exports = {
    development: {
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME,
        host: DB_HOSTNAME,
        port: DB_PORT,
        dialect: 'postgres',
        ssl: true,
        dialectOptions: {
            ssl: true
        }
    },
    production: {
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME,
        host: DB_HOSTNAME,
        port: DB_PORT,
        dialect: 'postgres',
        ssl: true,
        dialectOptions: {
            ssl: true
        }
    }
};
