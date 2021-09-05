const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const company = require('../middleware/company');
const validator = require("../middleware/validate");
const pagiCheck = require("../middleware/paginations");
const validateObjectId = require("../middleware/validateObjectId");
const { Package, validate } = require('../models/package');
const { Company } = require('../models/company');

/*Create a Package for request method = "POST" */
router.post("/", [auth, company, validator(validate)], async (req, res) => {
    const { serial, name } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).send("Company with provided id not found");

    let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

    let dbPackage = await Package.findOne({ 'company._id': req.user.companyId, slug })
    if (dbPackage)
        return res.status(400).send(`Package/Class with this name \"${name}\" already exist`);

    let package = new Package({ company: { _id: company._id, name: company.name, slug: company.slug }, serial, name, slug });

    package = await package.save();
    res.send(package);
})

/*READ all package for request with method = GET*/
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
    const packages = await Package.paginate(query, options);
    res.send(packages);
});

/*READ a Package for request with id, method = GET*/
router.get("/:id", [auth, company, validateObjectId], async (req, res) => {
    const package = await Package.findById(req.params.id);
    if (!package)
        return res.status(404).send("The package with the given ID was not found");

    if (package.company._id !== req.user.companyId)
        return res.status(401).send("Access denied, this data doesn't belongs to you");

    res.send(package);
});

/*Update a Package for request with id, method = PUT*/
router.put("/:id", [auth, company, validateObjectId, validator(validate)],
    async (req, res) => {
        const { serial, name } = req.body;

        let package = await Package.findById(req.params.id);
        if (!package) {
            return res.status(404).send("The Package with the given ID was not found");
        }

        if (package.company._id !== req.user.companyId)
            return res.status(401).send("Access denied, this data doesn't belongs to you");

        let slug = name.trim().replace(/\s+/g, "-").toLowerCase();

        await Package.updateOne(
            { _id: package._id },
            {
                $set: { name, slug, serial },
            }
        );
        package = await Package.findById(req.params.id);
        res.send(package);
    }
);

/*DELETE a Package for request with id, method = DELETE*/
router.delete("/:id", [auth, company, validateObjectId], async (req, res) => {
    //TODO: make sure this package belongs to this user and this package doesn't contain any student/person
    const package = await Package.findByIdAndRemove(req.params.id);

    if (!package)
        return res.status(404).send("The Package with the given ID was not found");

    res.send(package);
});


module.exports = router;