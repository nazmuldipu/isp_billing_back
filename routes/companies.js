const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validator = require("../middleware/validate");
const pagiCheck = require("../middleware/paginations");
const validateObjectId = require("../middleware/validateObjectId");
const { Company, validate } = require('../models/company');

/*Create a Company for request method = POST*/
router.post("/", [auth, admin, validator(validate)], async (req, res) => {
    let name = req.body.name.trim();
    let slug = name.replace(/\s+/g, "-").toLowerCase();
    const { name_bd, contact_person, phone, web, per_month, max_entity, sms_quota } = req.body;

    let dbCompany = await Company.findOne({ slug });
    if (dbCompany)
        return res.status(400).send(`Company with this name \"${name}\" already exist`);

    let company = new Company({ name, slug, name_bd, contact_person, phone, web, per_month, max_entity, sms_quota });

    company = await company.save();
    res.send(company);
})

/*Read companies with request method = GET*/
router.get("/", [auth, admin, pagiCheck], async (req, res) => {
    const param = req.query.param ? req.query.param.replace(/\W/g, "") : '';

    var query = param
        ? {
            $or: [
                { name: { $regex: param } },
                { phone: { $regex: param } },
                { contact_person: { $regex: param } },
            ],
        }
        : {};

    const options = {
        select: "name name_bd contact_person phone web max_entity sms_quota per_month",
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
    };
    const companies = await Company.paginate(query, options);
    res.send(companies);
})

/*READ a Company for request with id, method = GET*/
router.get("/:id", [auth, admin, validateObjectId], async (req, res) => {
    const company = await Company.findById(req.params.id);
    if (!company)
        return res.status(404).send("The company with the given ID was not found");
    res.send(company);
});

/*Update a User for request with id, method = PUT*/
router.put("/:id", [auth, admin, validateObjectId, validator(validate)],
    async (req, res) => {
        let company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).send("The Company with the given ID was not found");
        }

        let name = req.body.name.trim();
        let slug = name.replace(/\s+/g, "-").toLowerCase();
        const { name_bd, contact_person, phone, web, per_month, max_entity, sms_quota } = req.body;

        await Company.updateOne(
            { _id: company._id },
            {
                $set: { name, slug, name_bd, contact_person, phone, web, per_month, max_entity, sms_quota },
            }
        );
        company = await Company.findById(req.params.id);
        res.send(company);
    }
);

/*DELETE a Company for request with id, method = DELETE*/
router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
    const company = await Company.findByIdAndRemove(req.params.id);

    if (!company)
        return res.status(404).send("The company with the given ID was not found");

    res.send(company);
});

/*BUY SMS for a company for request method = PATCH*/
router.patch("/buysms/:id", [auth, admin, validateObjectId], async (req, res) => {
    let company = await Company.findById(req.params.id);
    if (!company) {
        return res.status(404).send("The Company with the given ID was not found");
    }
    const sms_quota = company.sms_quota + req.body.sms_quota;
    await Company.updateOne(
        { _id: company._id },
        {
            $set: { sms_quota },
        }
    );

    company = await Company.findById(req.params.id);
    res.send(company);
})

/*SET MAX LIMIT for a company for request method = PATCH*/
router.patch("/maxlimit/:id", [auth, admin, validateObjectId], async (req, res) => {
    let company = await Company.findById(req.params.id);
    if (!company) {
        return res.status(404).send("The Company with the given ID was not found");
    }
    const max_entity = req.body.max_entity;
    await Company.updateOne(
        { _id: company._id },
        {
            $set: { max_entity },
        }
    );

    company = await Company.findById(req.params.id);
    res.send(company);
})
module.exports = router;