const sequelize = require("sequelize"),
      config = require("config");

const database = new sequelize(config.get("db.name"),
                               config.get("db.username"),
                               config.get("db.password"), {
                                   host: config.get("db.host"),
                                   dialect: config.get("db.dialect"),
                                   storage: config.get("db.sqlite_file"),
                                   logging: false
                               });

const people = database.define("people", {
    id: { type: sequelize.INTEGER, primaryKey: true },
    last_name: sequelize.STRING,
    given_name: sequelize.STRING,
    is_male: sequelize.BOOLEAN,
    is_dead: { type: sequelize.BOOLEAN, defaultValue: false },
    birth_date: sequelize.DATEONLY,
    death_date: sequelize.DATEONLY
});

const family = database.define("family", {
    id: { type: sequelize.INTEGER, primaryKey: true },
    father_id: { type: sequelize.INTEGER, references: { model: people, key: "id" } },
    mother_id: { type: sequelize.INTEGER, references: { model: people, key: "id" } },
    marriage_date: sequelize.DATEONLY
});

const children = database.define("children", {
    id: { type: sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    family_id: { type: sequelize.INTEGER, references: { model: family, key: "id" } },
    child_id: { type: sequelize.INTEGER, references: { model: people, key: "id" } },
});

let promises = [people.sync(), family.sync(), children.sync()];
var cached_tree = [];

module.exports.importTree = function(peopleData, familyData, childrenData) {
    let peoplePromises = [];
    for (let i = 0; i < peopleData.length; i++) {
        peoplePromises.push(people.create(peopleData[i]));
    }
    
    Promise.all(peoplePromises).then(() => {
        let familyPromises = [];
        for (let i = 0; i < familyData.length; i++) {
            familyPromises.push(family.create(familyData[i]));
        }

        Promise.all(familyPromises).then(() => {
            for (let i = 0; i < childrenData.length; i++) {
                children.create(childrenData[i]);
            }
        });
    });
}

module.exports.getJsonTree = function() {
    return cached_tree;
}

function createNodePerson(data) {
    return {
        name: data.given_name + " " + data.last_name,
        class: (data.is_male ? "male" : "female"),
        extra: data
    };
}

/* TODO: Make this work without introducing race conditions:
   somehow update the update when the recursion is finished,
   which is easier said than done w/ callbacks and promises */

function recurseGenerateTree(tree_root, person_id) {
    people.findOne({ where: { id: person_id } }).then(person_result => {
        let person = createNodePerson(person_result.dataValues);
        
        family.findOne({ where: {
            [sequelize.Op.or]: [
                { father_id: person_id },
                { mother_id: person_id } ]
        }}).then(family_result => {
            if (family_result != null) {
                let spouse_id;
                if (family_result.dataValues.father_id == person_id) {
                    spouse_id = family_result.dataValues.mother_id;
                } else {
                    spouse_id = family_result.dataValues.father_id;
                }
                
                person.extra.spouse_id = spouse_id;
                people.findOne({ where: { id: spouse_id } }).then(spouse_result => {
                    person.marriages = [{
                        spouse: createNodePerson(spouse_result.dataValues),
                        children: []
                    }];
                    person.marriages[0].spouse.extra.spouse_id = person_id;
                    //console.log(person.marriages[0].spouse);
                    
                    tree_root.push(person);
                    children.findAll({ where: { family_id: family_result.dataValues.id } }).then(child_result => {
                        for (let child = 0; child < child_result.length; child++) {
                            recurseGenerateTree(person.marriages[0].children, child_result[child].dataValues.child_id);
                        }
                    });
                });
            } else {
                tree_root.push(person);
            }
        });
    });
}

module.exports.cacheJsonTree = function() {
    cached_tree = [];
    recurseGenerateTree(cached_tree, config.get("tree.start_person"));
}
