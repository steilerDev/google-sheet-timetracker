const ENTRY_STATUS = {
    ACCEPTED: "accepted",
    UNCONFIRMED: "unconfirmed",
    DECLINED: "declined"
};

const MODEL = require('../config/model');

class Entry {
    constructor(entriesSheet, log) {
        this._entriesSheet = entriesSheet;
        this._log = log;
    }

    initFromRow(dataRow) {
        this._type = dataRow[MODEL.entries_sheet.type_of_action];
        this._status = dataRow[MODEL.entries_sheet.status];
        this._id = dataRow.rowIndex;
        let date = dataRow[MODEL.entries_sheet.date].split(".");
        this._date = parseInt(date[0]);
        this._month = parseInt(date[1]);
        this._year = parseInt(date[2]);
        return this;
    }

    initFromParams(type, date, month, year) {
        this._log.debug(`Initializing new entry from parameters: Type ${type} on ${date}.${month}.${year}`);
        this._type = type;
        this._date = date;
        this._month = month;
        this._year = year;

        this._status = ENTRY_STATUS.UNCONFIRMED;
        return this;
    }

    confirmEntry() {

    }

    toString() {
        return `${this._type} (ID: ${this._id} on ${this._date}.${this._month}.${this._year} (Status: ${this._status})`;
    }


    toJSON(worksheet) {
        if(worksheet) {
            let json = {};
            json[MODEL.entries_sheet.type_of_action] = this._type;
            json[MODEL.entries_sheet.status] = this._status;
            json[MODEL.entries_sheet.date] = `${this._date}.${this._month}.${this._year}`;
            return json;
        } else {
            return {
                type: this._type,
                id: this._id,
                status: this._status,
                entryDate: {
                    date: this._date,
                    month: this._month,
                    year: this._year
                }
            };
        }
    }
}

module.exports = {Entry};