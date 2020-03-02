const MODEL = require('../config/model.json');
const {validateModel, validateValue} = require('./Util');
const {Entry} = require('./Entry');

class User {
    constructor(dataRow, doc, log) {
        this._log = log;
        this._rawData = dataRow;
        this._doc = doc;
        this.sync();
    }

    sync() {
        try {
            this._log.debug(`Syncing user...`);
            this.dataEntries = [];
            this._loadUser()
                .then(() => this._loadEntries()
                    .then(() => {
                        this._log.debug(`Successfully synced user ${this.toString()} with ${this.dataEntries.length} data entries!`);
                    })
                )
        } catch(err) {
            throw new Error(`Unable to sync user ${this.toString()}: ${err}`);
        }
    }

    createEntry(types) {
        const now = new Date(Date.now());
        const nowDate = now.getDate();
        const nowMonth = now.getMonth();
        const nowYear = now.getFullYear();

        let newEntries = [];

        types.forEach(element => {
            this._log.debug(`Creating entry of type ${element} on ${nowDate}.${nowMonth}.${nowYear} for user ${this.toString()}`);
            try {
                let newEntry = new Entry(this._log)
                    .initFromParams(element, nowDate, nowMonth, nowYear);
                newEntries.push(newEntry.toJSON(true));
                this._log.debug(`Successfully created new entry for user ${this.toString()}: ${newEntry.toString()}`);
            } catch (err) {
                throw new Error(`Unable to create new entry for user ${this.toString()}: ${err}`);
            }
        });

        this.entriesSheet.addRows(newEntries).then((newRows) => {
            newRows.forEach((element) => {
                this.dataEntries.push(new Entry(this._log).initFromRow(element));
            });
            this._log.info(`Successful added ${newRows.length} new entries for user ${this.toString()}`);
        }).catch((err) => {
            throw new Error(`Unable to add entries for user ${this.toString()}: ${err}`);
        });
    }

    getEntry(id) {
        let searchList = this.dataEntries.filter(value => parseInt(value._id) === parseInt(id));
        if(searchList.length === 1) {
            return searchList[0];
        } else {
            throw new Error(`Unable to get entry with id ${id} for user ${this.toString()}: Search list returned not exactly one item, but ${searchList.length}`);
        }
    }

    getUnconfirmedEntries() {
        return this.dataEntries.filter(entry => entry.isUnconfirmed());
    }

    async _loadUser() {
        this.firstName = this._rawData[MODEL.first_name];
        validateValue.bind(this)(this.firstName, MODEL.first_name);

        this.lastName = this._rawData[MODEL.last_name];
        validateValue.bind(this)(this.lastName, MODEL.last_name);

        this.uid = this._rawData[MODEL.uid];
        validateValue.bind(this)(this.uid, MODEL.uid);

        // Getting status of user
        validateValue.bind(this)(this._rawData[MODEL.signup_date], MODEL.signup_date);
        const signUpDateData = this._rawData[MODEL.signup_date].split(" ")[0].split(".");
        this.signUpDate = new Date();
        this.signUpDate.setUTCDate(parseInt(signUpDateData[0]));
        this.signUpDate.setUTCMonth(parseInt(signUpDateData[1]));
        this.signUpDate.setUTCFullYear(parseInt(signUpDateData[2]));
        if(isNaN(this.signUpDate.getTime())) {
            throw new Error(`Unable to parse signUpDate ${this._rawData[MODEL.signup_date]}`)
        } else {
            this._log.debug(`Parsed signup date from ${this._rawData[MODEL.signup_date]} to Day: ${this.signUpDate.getUTCDate()}, Month: ${this.signUpDate.getUTCMonth()}, Year: ${this.signUpDate.getUTCFullYear()}`);
        }
        this.signOffDate = this._rawData[MODEL.signoff_date];
        validateValue.bind(this)(this.signOffDate, MODEL.signoff_date, true);
        this.membershipType = this._rawData[MODEL.membership_type];
        validateValue.bind(this)(this.membershipType, MODEL.membership_type);
        if(this.signOffDate) {
            this.status = "inactive";
        } else if (this.membershipType === "Fördermitglied") {
            this.status = "support";
        } else {
            this.status = "active";
        }

        // Getting data_sheet for user
        this.entriesSheetId = this._rawData[MODEL.entries_sheet_id];
        validateValue.bind(this)(this.entriesSheetId, MODEL.entries_sheet_id, true);
        if(this.entriesSheetId) {
            this.entriesSheet = this._doc.sheetsById[this.entriesSheetId];
        } else {
            this._log.warn(`No entries sheet ID found for user ${this.toString()}`);
        }

        if(!this.entriesSheet) {
            this._log.warn(`No entries sheet loaded so far for user ${this.toString()}, creating new one...`);
            this.entriesSheet= await this._doc.addSheet({
                title: this.uid
            });
            await this.entriesSheet.setHeaderRow([
                MODEL.entries_sheet.date,
                MODEL.entries_sheet.type_of_action,
                MODEL.entries_sheet.status
            ]);
            this._rawData[MODEL.entries_sheet_id] = this.entriesSheet.sheetId;
            this.entriesSheetId = this.entriesSheet.sheetId;
            this._rawData.save().then(() => {
                this._log.debug(`Successfully saved new entries sheet for user ${this.toString()} with ID ${this.entriesSheetId}`);
            });
        }

        if(!this.entriesSheet) {
            throw new Error(`Unable to load data sheet with id ${this.entriesSheetId}`);
        }

        this._log.debug(`Successfully loaded user ${this.toString()}`);
    }

    async _loadEntries() {
        this._log.debug(`Loading data entries for user ${this.toString()}...`);
        await validateModel.bind(this)(this.entriesSheet, MODEL.entries_sheet);

        const entryRows = await this.entriesSheet.getRows();
        entryRows.forEach(entry => {
            let newEntry = new Entry(this._log)
                .initFromRow(entry);
            this.dataEntries.push(newEntry);
        });
        this._log.debug(`Successfully loaded ${this.dataEntries.length} data entries for user ${this.toString()}`)
    }


    toString() {
        return `${this.firstName} ${this.lastName} (UID: ${this.uid}, Status ${this.status}, ${this.dataEntries.length} data entries)`
    }

    toJSON(short) {
        let json = {
            firstName: this.firstName,
            lastName: this.lastName,
            uid: this.uid,
            status: this.status,
            signUpDate: {
                day: this.signUpDate.getUTCDate(),
                month: this.signUpDate.getUTCMonth(),
                year: this.signUpDate.getUTCFullYear(),
            }
        };
        if(!short) {
            json.dataEntries = [];
            this.dataEntries.forEach(entry => {
                json.dataEntries.push(entry.toJSON());
            });
        }
        return json;
    }
}

module.exports = {User};