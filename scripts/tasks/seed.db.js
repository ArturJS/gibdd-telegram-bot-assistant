const db = require('../../src/models/index.js');

(async() => {
    await db.User.findOrCreate({
        where: {
            email: 'test@user.com'
        },
        defaults: {
            email: 'test@user.com',
            telegramId: 'test_telegram_id_123',
            firstName: 'FirstName',
            lastName: 'LastName',
            region: '64 Саратовская область',
            subdivision: 'Управление ГИБДД ГУ МВД России по Саратовской области'
        }
    });
    
    console.log('Done!');

    console.log('Fetching all users...');

    const users = await db.User.findAll();

    console.log(JSON.stringify(users, null, '  '));

    await db.sequelize.close();
})();

