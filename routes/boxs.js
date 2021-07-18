const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const company = require('../middleware/company');
const validator = require("../middleware/validate");
const pagiCheck = require("../middleware/paginations");
const validateObjectId = require("../middleware/validateObjectId");
const { Box, validate } = require('../models/box');
const { Company } = require('../models/company');

/*Create a Box for request method = "POST" */
router.post("/", [auth, company, validator(validate)], async (req, res) => {
    const { serial, name } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).send("Company with provided id not found");

    let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

    let dbBox = await Box.findOne({ 'company._id': req.user.companyId, slug })
    if (dbBox)
        return res.status(400).send(`Box/Class with this name \"${name}\" already exist`);

    let box = new Box({ company: { _id: company._id, name: company.name, slug: company.slug }, serial, name, slug });

    box = await box.save();
    res.send(box);
})

/*READ all box for request with method = GET*/
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
    const boxs = await Box.paginate(query, options);
    res.send(boxs);
});

/*READ a Box for request with id, method = GET*/
router.get("/:id", [auth, company, validateObjectId], async (req, res) => {
    const box = await Box.findById(req.params.id);
    if (!box)
        return res.status(404).send("The box with the given ID was not found");

    if (box.company._id !== req.user.companyId)
        return res.status(401).send("Access denied, this data doesn't belongs to you");

    res.send(box);
});

/*Update a Box for request with id, method = PUT*/
router.put("/:id", [auth, company, validateObjectId, validator(validate)],
    async (req, res) => {
        const { serial, name } = req.body;

        let box = await Box.findById(req.params.id);
        if (!box) {
            return res.status(404).send("The Box with the given ID was not found");
        }

        if (box.company._id !== req.user.companyId)
            return res.status(401).send("Access denied, this data doesn't belongs to you");

        let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

        await Box.updateOne(
            { _id: box._id },
            {
                $set: { name, slug, serial },
            }
        );
        box = await Box.findById(req.params.id);
        res.send(box);
    }
);

/*DELETE a Box for request with id, method = DELETE*/
router.delete("/:id", [auth, company, validateObjectId], async (req, res) => {
    //TODO: make sure this box belongs to this user and this box doesn't contain any student/person
    const box = await Box.findByIdAndRemove(req.params.id);

    if (!box)
        return res.status(404).send("The Box with the given ID was not found");

    res.send(box);
});


module.exports = router;