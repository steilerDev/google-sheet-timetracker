
async function validateModel(table, model) {
    this._log.debug(`Validating model (${JSON.stringify(model)}) against table ${table.title}`);
    await table.loadHeaderRow();
    Object.keys(model).forEach(element => {
        if(typeof model[element] === "string") {
            if(!table.headerValues.includes(element)) {
                throw new Error(`Entries table does not have required header row: ${element}: ${entriesTable.headerValues}`);
            } else {
                this._log.debug(`Found required header row ${element}`);
            }
        }
    });
    this._log.debug(`Validation for ${table.title} successful!`);
    return true;
}

function validateValue(value, descr, optional) {
    if(value === null || (!optional && (value === undefined || 0 === value.length))) {
        throw new Error(`Unable to load user, ${descr} is not defined: ${value}`);
    } else {
        this._log.debug(`Validated ${descr} for user: ${value}`);
    }
}

module.exports = {
    validateModel,
    validateValue
};