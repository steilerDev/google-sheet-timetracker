const { GoogleSpreadsheet } = require('google-spreadsheet');
const { User } = require('./User');
const { validateModel } = require('./Util');

const MODEL = require('../config/model.json');

class DataProvider {
    constructor(conf, credentials, log) {
        this._log = log;
        this._conf = conf;
        this._credentials = credentials;
        this._users = [];

        try {

            this._log.info(`Loading Data Provider...`);

            this._loadSheet()
                .then(() => this._loadUsers()
                    .then(() => {
                        this._log.info(`Successfully loaded Data Provider with ${this._users.length} active users!`);
                    })
                );
        } catch(err) {
            this._log.fatal(`Unable to load Data Provider: ${err}`);
        }
    }

    getUsers() {
        let users = [];
        this._users.forEach(user => {
            users.push({
                firstName: user.firstName,
                lastName: user.lastName,
                uid: user.uid
            })
        });
        return users;
    }

    getUser(id) {
        let user = this._users[id];
        if(user) {
            this._log.debug(`Serving user with ID ${id} (${user._toString()}`);
            return user.serialize();
        } else {
            this._log.warn(`Unable to find user with id ${id}`);
            throw new Error(`Unable to find user with id ${id}`);
        }
    }

    createEntry(uid, types) {
        let user = this._users[uid];
        if(user) {
            this._log.debug(`Found user with ID ${uid} (${user._toString()}`);
            const now = new Date(Date.now());
            const nowDate = now.getDate();
            const nowMonth = now.getMonth();
            const nowYear = now.getFullYear();
            types.forEach(element => {
                this._log.debug(`Creating entry of type ${element} for ${nowDate}.${nowMonth}.${nowYear}`);
                user.addEntry(element, nowDate, nowMonth, nowYear);
            });
        } else {
            this._log.warn(`Unable to find user with id ${id}`);
            throw new Error(`Unable to find user with id ${id}`);
        }
    }

    async _loadSheet() {
        this._log.debug(`Loading Google Sheet (ID: ${this._conf.sheetId})...`);
        this._doc = new GoogleSpreadsheet(this._conf.sheetId);
        try {
            await this._doc.useServiceAccountAuth(this._credentials);
            await this._doc.loadInfo(); // loads document properties and worksheets
            this._log.debug(`Successfully loaded Google Sheet (ID: ${this._doc.spreadsheetId}, Name: ${this._doc.title})`);
        } catch(err) {
            throw new Error(`Unable to load google sheet (ID: ${this._conf.sheetID}): ${err}`);
        }
    }

    async _loadUsers() {
        this._log.debug(`Loading users...`);
        const userTable = this._doc.sheetsByIndex[0];
        await validateModel.bind(this)(userTable, MODEL);
        await userTable.updateProperties({title: "users"});

        const userRows = await userTable.getRows();
        userRows.forEach(userEntry => {
            let newUser = new User(userEntry, this._doc, this._log);
            if(newUser.status === "active") {
                this._users[newUser.uid] = newUser;
            } else {
                this._log.info(`Omitting user ${newUser.firstName} ${newUser.lastName} due to status ${newUser.status}`);
            }
        });
        this._log.debug(`Successfully loaded ${this._users.length} users`)
    }
}

module.exports = {DataProvider};