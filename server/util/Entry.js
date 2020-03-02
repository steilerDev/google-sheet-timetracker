const ENTRY_STATUS = {
    ACCEPTED: "accepted",
    UNCONFIRMED: "unconfirmed",
    REJECTED: "rejected"
};

const MODEL = require('../../config/model');

class Entry {
    constructor(log) {
        this._log = log;
    }

    initFromRow(dataRow) {
        this._rawData = dataRow;
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

    acceptEntry() {
        this._updateStatus(ENTRY_STATUS.ACCEPTED);
    }

    rejectEntry() {
        this._updateStatus(ENTRY_STATUS.REJECTED);
    }

    isUnconfirmed() {
        return this._status === ENTRY_STATUS.UNCONFIRMED;
    }

    _updateStatus(newStatus) {
        if(this._status === ENTRY_STATUS.ACCEPTED) {
            throw new Error(`Unable to update status of confirmed entries: ${this.toString()}`);
        } else {
            this._log.debug(`Updating status of entry ${this.toString()} to ${newStatus}`);
            this._status = newStatus;
            this._rawData[MODEL.entries_sheet.status] = newStatus;
            this._rawData.save()
                .then(() => {
                    this._log.info(`Successfully updated status of entry ${this.toString()} to ${newStatus}`);
                }).catch((err) => {
                throw new Error(`Unable to update status of entry ${this.toString()} to ${newStatus}: ${err}`);
            });
        }
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