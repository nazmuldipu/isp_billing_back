const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const company = require('../middleware/company');
const validator = require("../middleware/validate");
const pagiCheck = require("../middleware/paginations");
const validateObjectId = require("../middleware/validateObjectId");
const { Group, validate } = require('../models/group');
const { Company } = require('../models/company');

/*Create a Group for request method = "POST" */
router.post("/", [auth, company, validator(validate)], async (req, res) => {
    const { serial, name } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).send("Company with provided id not found");

    let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

    let dbGroup = await Group.findOne({ 'company._id': req.user.companyId, slug })
    if (dbGroup)
        return res.status(400).send(`Group/Class with this name \"${name}\" already exist`);

    let group = new Group({ company: { _id: company._id, name: company.name, slug: company.slug }, serial, name, slug });

    group = await group.save();
    res.send(group);
})

/*READ all group for request with method = GET*/
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
        select: "name serial company",
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
    };
    const groups = await Group.paginate(query, options);
    res.send(groups);
});

/*READ a Group for request with id, method = GET*/
router.get("/:id", [auth, company, validateObjectId], async (req, res) => {
    const group = await Group.findById(req.params.id);
    if (!group)
        return res.status(404).send("The group with the given ID was not found");

    if (group.company._id !== req.user.companyId)
        return res.status(401).send("Access denied, this data doesn't belongs to you");

    res.send(group);
});

/*Update a Group for request with id, method = PUT*/
router.put("/:id", [auth, company, validateObjectId, validator(validate)],
    async (req, res) => {
        const { serial, name } = req.body;

        let group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).send("The Group with the given ID was not found");
        }

        if (group.company._id !== req.user.companyId)
            return res.status(401).send("Access denied, this data doesn't belongs to you");

        let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

        await Group.updateOne(
            { _id: group._id },
            {
                $set: { name, slug, serial },
            }
        );
        group = await Group.findById(req.params.id);
        res.send(group);
    }
);

/*DELETE a Group for request with id, method = DELETE*/
router.delete("/:id", [auth, company, validateObjectId], async (req, res) => {
    //TODO: make sure this group belongs to this user and this group doesn't contain any student/person
    const group = await Group.findByIdAndRemove(req.params.id);

    if (!group)
        return res.status(404).send("The Group with the given ID was not found");

    res.send(group);
});


module.exports = router;