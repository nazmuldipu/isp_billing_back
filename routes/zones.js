const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const company = require('../middleware/company');
const validator = require("../middleware/validate");
const pagiCheck = require("../middleware/paginations");
const validateObjectId = require("../middleware/validateObjectId");
const { Zone, validate } = require('../models/zone');
const { Company } = require('../models/company');

/*Create a Zone for request method = "POST" */
router.post("/", [auth, company, validator(validate)], async (req, res) => {
    const { serial, name } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).send("Company with provided id not found");

    let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

    let dbZone = await Zone.findOne({ 'company._id': req.user.companyId, slug })
    if (dbZone)
        return res.status(400).send(`Zone/Class with this name \"${name}\" already exist`);

    let zone = new Zone({ company: { _id: company._id, name: company.name, slug: company.slug }, serial, name, slug });

    zone = await zone.save();
    res.send(zone);
})

/*READ all zone for request with method = GET*/
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
    const zones = await Zone.paginate(query, options);
    res.send(zones);
});

/*READ a Zone for request with id, method = GET*/
router.get("/:id", [auth, company, validateObjectId], async (req, res) => {
    const zone = await Zone.findById(req.params.id);
    if (!zone)
        return res.status(404).send("The zone with the given ID was not found");

    if (zone.company._id !== req.user.companyId)
        return res.status(401).send("Access denied, this data doesn't belongs to you");

    res.send(zone);
});

/*Update a Zone for request with id, method = PUT*/
router.put("/:id", [auth, company, validateObjectId, validator(validate)],
    async (req, res) => {
        const { serial, name } = req.body;

        let zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).send("The Zone with the given ID was not found");
        }

        if (zone.company._id !== req.user.companyId)
            return res.status(401).send("Access denied, this data doesn't belongs to you");

        let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

        await Zone.updateOne(
            { _id: zone._id },
            {
                $set: { name, slug, serial },
            }
        );
        zone = await Zone.findById(req.params.id);
        res.send(zone);
    }
);

/*DELETE a Zone for request with id, method = DELETE*/
router.delete("/:id", [auth, company, validateObjectId], async (req, res) => {
    //TODO: make sure this zone belongs to this user and this zone doesn't contain any student/person
    const zone = await Zone.findByIdAndRemove(req.params.id);

    if (!zone)
        return res.status(404).send("The Zone with the given ID was not found");

    res.send(zone);
});


module.exports = router;