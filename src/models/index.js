const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(module.filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/db-config')[env];
const db = {};
const sequelize = new Sequelize(config);

const notIndexJS = filename =>
    filename.indexOf('.') !== 0 &&
    filename !== basename &&
    filename.slice(-3) === '.js';

fs
    .readdirSync(__dirname)
    .filter(notIndexJS)
    .forEach(file => {
        const model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
