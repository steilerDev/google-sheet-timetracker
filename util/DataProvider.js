const { GoogleSpreadsheet } = require('google-spreadsheet');
const { User } = require('./User');
const { validateModel } = require('./Util');

const MODEL = require('../config/model.json');

class DataProvider {
    constructor(conf, credentials, log) {
        this._log = log;
        this._conf = conf;
        this._credentials = credentials;
        this.sync();
    }

    sync() {
        this._users = [];
        try {
            this._log.info(`Syncing data provider...`);
            this._loadSheet()
                .then(() => this._loadUsers()
                    .then(() => {
                        this._log.info(`Successfully synced data provider with ${this._users.length} active users!`);
                    })
                );
        } catch(err) {
            this._log.fatal(`Unable to sync data provider: ${err}`);
            throw new Error(`Unable to sync data provider: ${err}`);
        }
    }

    getUsers() {
        let users = [];
        this._users.forEach(element => users.push(element));
        return users;
    }

    getUser(id) {
        let user = this._users[id];
        if(user) {
            this._log.debug(`Serving user with ID ${id} (${user.toString()}`);
            return user;
        } else {
            this._log.error(`Unable to find user with id ${id}`);
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
        userTable.updateProperties({title: "users"});

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