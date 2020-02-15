const MODEL = require('../config/model.json');
const {validateModel, validateValue} = require('./Util');
const {Entry} = require('./Entry');

class User {
    constructor(dataRow, doc, log) {
        this._log = log;
        this._rawData = dataRow;
        this._doc = doc;

        try {
            this._log.debug(`Loading user...`);
            this._loadUser()
                .then(() => this._loadEntries()
                    .then(() => {
                        this._log.debug(`Successfully loaded user ${this._toString()} with ${this.dataEntries.length} data entries!`);
                    })
                )
        } catch(err) {
            throw new Error(`Unable to load user ${this._toString()}: ${err}`);
        }
    }

    async _loadUser() {
        this.firstName = this._rawData[MODEL.first_name];
        validateValue.bind(this)(this.firstName, MODEL.first_name);

        this.lastName = this._rawData[MODEL.last_name];
        validateValue.bind(this)(this.lastName, MODEL.last_name);

        this.uid = this._rawData[MODEL.uid];
        validateValue.bind(this)(this.uid, MODEL.uid);

        // Getting status of user
        this.signUpDate = this._rawData[MODEL.signup_date];
        validateValue.bind(this)(this.signUpDate, MODEL.signup_date);
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
            this._log.warn(`No entries sheet ID found for user ${this._toString()}, creating new sheet`);
            this.entriesSheet= await this._doc.addSheet({
                title: this.uid
            });
            await this.entriesSheet.setHeaderRow([
                MODEL.entries_sheet.date,
                MODEL.entries_sheet.type_of_action,
                MODEL.entries_sheet.confirmed
            ]);
            this._rawData[MODEL.entries_sheet_id] = this.entriesSheet.sheetId;
            this.entriesSheetId = this.entriesSheet.sheetId;
            this._rawData.save().then(() => {
                this._log.debug(`Successfully saved new entries sheet for user ${this._toString()} with ID ${this.entriesSheetId}`);
            });
        }

        if(!this.entriesSheet) {
            throw new Error(`Unable to load data sheet with id ${this.entriesSheetId}`);
        }

        this._log.debug(`Successfully loaded user ${this._toString()}`);
    }

    async _loadEntries() {
        this.dataEntries = [];
        this._log.debug(`Loading data entries for user ${this._toString()}...`);
        await validateModel.bind(this)(this.entriesSheet, MODEL.entries_sheet);

        const entryRows = await this.entriesSheet.getRows();
        entryRows.forEach(entry => {
            this.dataEntries.push(new Entry(entry, this._log))
        });
        this._log.debug(`Successfully loaded ${this.dataEntries.length} data entries for user ${this._toString()}`)
    }


    _toString() {
        return `${this.firstName} ${this.lastName} (UID: ${this.uid}, Status ${this.status})`
    }
}

module.exports = {User};