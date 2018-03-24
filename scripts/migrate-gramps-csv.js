const fs = require("fs"),
      family_db = require("../family-db.js");

const male_string = "mężczyzna";
const female_string = "kobieta";

function parseIdString(string) {
    return parseInt(string.substring(2, 6));
}

function parseDate(string) {
    var split = string.split("-");
    return new Date(parseInt(split[0]), parseInt(split[1]) - 1, parseInt(split[2]));
}

function parseCsv(csvData) {
    var rows = csvData.split(/\r?\n/); /* Handle stupid windows carriage returns */
    var retData = [];
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i].trim()
            .split(',')
            .map(x => x.replace(/"/g, ""));

        if (row.length > 0) {
            retData.push(row);
        }
    }
    return retData;
}

var dataTablesRaw = fs.readFileSync(process.argv[2], "UTF-8").split(/\r?\n\r?\n/);
var dataTables = []

for (let i = 0; i < dataTablesRaw.length; i++) {
    dataTables.push(parseCsv(dataTablesRaw[i]));
}

var people = [];
var families = [];
var children = [];

/* Populate persons table */

for (let i = 1; i < dataTables[0].length; i++) {
    let personObject = {};
    
    personObject["id"] = parseIdString(dataTables[0][i][0]);
    personObject["given_name"] = dataTables[0][i][2];
    personObject["last_name"] = dataTables[0][i][1];
    
    if (dataTables[0][i][7] == male_string) {
        personObject["is_male"] = true;
    } else {
        personObject["is_male"] = false;
    }
    
    if (dataTables[0][i][8]) {
        personObject["birth_date"] = parseDate(dataTables[0][i][8]);
    }
    if (dataTables[0][i][14]) {
        personObject["death_date"] = parseDate(dataTables[0][i][14]);
    }

    people.push(personObject);
}

/* Populate families table */

for (let i = 1; i < dataTables[1].length; i++) {
    let familyObject = {};

    familyObject["id"] = parseIdString(dataTables[1][i][0]);
    familyObject["mother_id"] = parseIdString(dataTables[1][i][2]);
    familyObject["father_id"] = parseIdString(dataTables[1][i][1]);
    
    if (dataTables[1][i][3]) {
        familyObject["marriage_date"] = parseIdString(dataTables[1][i][3]);
    }

    families.push(familyObject);
}

/* Populate children table */

for (let i = 1; i < dataTables[2].length; i++) {
    let childObject = {};

    childObject["family_id"] = parseIdString(dataTables[2][i][0]);
    childObject["child_id"] = parseIdString(dataTables[2][i][1]);
    children.push(childObject);
}

family_db.importTree(people, families, children);
