const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const company = require('../middleware/company');
const validator = require("../middleware/validate");
const pagiCheck = require("../middleware/paginations");
const validateObjectId = require("../middleware/validateObjectId");
const { Person, validate } = require('../models/person');
const { Group } = require('../models/group');
const { Company } = require('../models/company');

/*Create a Person for request method = "POST" */
router.post("/", [auth, company, validator(validate)], async (req, res) => {
    const { serial, name, groupId } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).send("Company with provided id not found");

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).send("Group with provided id not found");

    let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

    let dbPerson = await Person.findOne({ 'group._id': groupId, slug, serial })
    if (dbPerson)
        return res.status(400).send(`Person/Student with this name \"${name}\" already exist`);

    let person = new Person({ company: { _id: company._id, name: company.name, slug: company.slug }, group: { _id: group._id, name: group.name, slug: group.slug }, serial, name, slug });

    person = await person.save();
    res.send(person);
})

/*READ all person for request with method = GET*/
router.get("/", [auth, company, pagiCheck], async (req, res) => {
    const param = req.query.param ? req.query.param.replace(/\W/g, "") : '';

    var query = param
        ? {
            $and: [
                { "company._id": req.user.companyId, },
                {
                    $or: [
                        { name: { $regex: param } },
                    ],
                },
            ],
        }
        : { "company._id": req.user.companyId, };

    const options = {
        select: "name serial group",
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
    };
    const persons = await Person.paginate(query, options);
    res.send(persons);
});

/*READ all person for request with method = GET*/
router.get("/group/:id", [auth, company, pagiCheck], async (req, res) => {
    const param = req.query.param ? req.query.param.replace(/\W/g, "") : '';

    var query = param
        ? {
            $and: [
                { "company._id": req.user.companyId, },
                { "group._id": req.params.id, },
                {
                    $or: [
                        { name: { $regex: param } },
                    ],
                },
            ],
        }
        : { "company._id": req.user.companyId, "group._id": req.params.id, };

    const options = {
        select: "name serial group",
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
    };
    const persons = await Person.paginate(query, options);
    res.send(persons);
});

/*READ a Person for request with id, method = GET*/
router.get("/:id", [auth, company, validateObjectId], async (req, res) => {
    const person = await Person.findById(req.params.id);
    if (!person)
        return res.status(404).send("The person with the given ID was not found");

    if (person.company._id !== req.user.companyId)
        return res.status(401).send("Access denied, this data doesn't belongs to you");

    res.send(person);
});

/*Update a Person for request with id, method = PUT*/
router.put("/:id", [auth, company, validateObjectId, validator(validate)],
    async (req, res) => {
        const { serial, name, groupId } = req.body;

        let person = await Person.findById(req.params.id);
        if (!person) {
            return res.status(404).send("The Person with the given ID was not found");
        }

        if (person.company._id !== req.user.companyId)
            return res.status(401).send("Access denied, this data doesn't belongs to you");

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).send("Group with provided id not found");

        let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

        await Person.updateOne(
            { _id: person._id },
            {
                $set: { name, slug, serial, group: { _id: group._id, name: group.name, slug: group.slug } },
            }
        );
        person = await Person.findById(req.params.id);
        res.send(person);
    }
);

/*DELETE a Person for request with id, method = DELETE*/
router.delete("/:id", [auth, company, validateObjectId], async (req, res) => {
    //TODO: make sure this person belongs to this user 
    const person = await Person.findByIdAndRemove(req.params.id);

    if (!person)
        return res.status(404).send("The Person with the given ID was not found");

    res.send(person);
});

module.exports = router;