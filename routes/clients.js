const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const company = require('../middleware/company');
const validator = require("../middleware/validate");
const validateObjectId = require("../middleware/validateObjectId");
const imgUploader = require("../middleware/storageSettings.js")("Clients");
const { Client, validate } = require("../models/client");
const pagiCheck = require("../middleware/paginations");
const { CleanObject, DeleteImage } = require('../middleware/util');
const c = require("config");

const nid_f = 'nid_front';
const nid_b = 'nid_back';
const profile = 'profile';

var pUpload = imgUploader.fields([
    { name: nid_f, maxCount: 1 },
    { name: nid_b, maxCount: 1 },
    { name: profile, maxCount: 1 },
]);


/* Create a Client for request method = POST*/
router.post("/", pUpload, [auth, company, validator(validate)], async (req, res) => {
    //Check if file type problem occured
    if (req.fileValidationError) {
        DeleteImage(req.files);
        return res.status(404).send("File type not supported");
    } else if(!req.files || !req.files[nid_f] || !req.files[nid_b] || !req.files[profile]){
        return res.status(406).send("Required images not found");
    }

    //Check if Clients exists into database, if then remove images from space
    let db_client = await Client.findOne({
        client_nid_number: req.body.client_nid_number.trim(),
    });
    if (db_client) {
        if (req.files) DeleteImage(req.files);
        return res
            .status(400)
            .send(`Client with this nid \'${req.body.client_nid_number}\' already exist`);
    }

    let client = CleanObject({ ...req.body });
    client = new Client(client);
    //Add images path and thumb path to client image
    if (req.files) {
        if (req.files[nid_f]) {
            const th = req.files[nid_f][0];
            client.nid_front_url = th.destination + th.filename;
        }
        if (req.files[nid_b]) {
            const th = req.files[nid_b][0];
            client.nid_back_url = th.destination + th.filename;
        }
        if (req.files[profile]) {
            const th = req.files[profile][0];
            client.profile_url = th.destination + th.filename;
        }
    }
    client = await client.save(client);
    res.send(
        _.pick(client, [
            "_id",
            "client_name",
            "client_father",
            "clinet_phone",
            "client_email",
            "client_username",
        ])
    );
})

/*READ all Client for request with method = GET*/
router.get("/", pagiCheck, async (req, res) => {
    const param = req.query.param ? req.query.param.replace(/\W/g, '') : '';

    var query = param
        ? {
            $or: [
                { client_name: { $regex: param } },
                { clinet_phone: { $regex: param } },
                { client_email: { $regex: param } },
                { client_username: { $regex: param } }
            ],
        }
        : {};
    const options = {
        select: "client_name client_father clinet_phone client_email client_username",
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
    };
    const clients = await Client.paginate(query, options);
    res.send(clients);
});

/*READ a Client for request with id, method = GET*/
router.get("/:id", validateObjectId, async (req, res) => {
    const client = await Client.findById(req.params.id);
    if (!client)
        return res.status(404).send("The client with the given ID not found");
    res.send(client);
});

/*UPDATE a Client for request with id, method = PUT*/
router.put(
    "/:id",
    pUpload,
    [auth, company, validator(validate), validateObjectId],
    async (req, res) => {
        //Check if file type problem occured
        if (req.fileValidationError) {
            DeleteImage(req.files);
            return res.status(404).send("File type not supported");
        }
        const client_nid_number = req.body.client_nid_number;
        const dbClient = await Client.findOne({ client_nid_number });
        if (dbClient && dbClient._id.toString() !== req.params.id.toString())
            return res
                .status(403)
                .send(
                    "The Client with this nid already exists for another client"
                );

        //If image provided then
        let nid_front_url = '';
        let nid_back_url = '';
        let profile_url = '';

        if (req.files) {
            if (req.files[nid_f]) {
                const th = req.files[nid_f][0];
                nid_front_url = th.destination + th.filename;
            }
            if (req.files[nid_b]) {
                const th = req.files[nid_b][0];
                nid_back_url = th.destination + th.filename;
            }
            if (req.files[profile]) {
                const th = req.files[profile][0];
                profile_url = th.destination + th.filename;
            }
        }

        let client = await Client.findById(req.params.id);

        if (!client) {
            DeleteImage(req.files);
            return res
                .status(404)
                .send("The Client with the given ID not found");
        }

        //If Client already contain image and new image provided, then delete old image
        if (nid_front_url.length > 2) {
            if (client.nid_front_url.length > 2) {
                fs.unlink(client.nid_front_url, (err) => {
                    if (err) return res.status(404).send(err);
                });
            }
        } else {
            nid_front_url = client.nid_front_url;
        }

        if (nid_back_url.length > 2) {
            if (client.nid_back_url.length > 2) {
                fs.unlink(client.nid_back_url, (err) => {
                    if (err) return res.status(404).send(err);
                });
            }
        } else {
            nid_back_url = client.nid_back_url
        }

        if (profile_url.length > 2) {
            if (client.profile_url.length > 2) {
                fs.unlink(client.profile_url, (err) => {
                    if (err) return res.status(404).send(err);
                });
            }
        } else {
            profile_url = client.profile_url
        }
        const newBody = CleanObject({ ...req.body });
        const newClient = { ...client.toJSON(), ...newBody, client_nid_number, nid_front_url, nid_back_url, profile_url };
        client = await Client.updateOne(
            { _id: client._id },
            {
                $set: { ...newClient },
            }
        );

        res.send(client);
    }
);

/*DELETE a Client for request with id, method = DELETE*/
router.delete("/:id", [auth, company, validateObjectId], async (req, res) => {
    const client = await Client.findByIdAndRemove(req.params.id);

    if (!client)
        return res.status(404).send("The client with the given ID was not found");

    if (client.nid_front_url.length > 0) {
        const oldImageLink = client.nid_front_url;
        fs.unlink(oldImageLink, (err) => {
            if (err) console.log("Client old image deleting error");
        });
    }

    if (client.nid_back_url.length > 0) {
        const oldImageLink = client.nid_back_url;
        fs.unlink(oldImageLink, (err) => {
            if (err) console.log("Client old image deleting error");
        });
    }

    if (client.profile_url.length > 0) {
        const oldImageLink = client.profile_url;
        fs.unlink(oldImageLink, (err) => {
            if (err) console.log("Client old image deleting error");
        });
    }

    res.send(client);
});

/* READ profile/:id a image for client = GET*/
router.get("/profile/:id", validateObjectId, async (req, res) => {
  //Check if client exists
  const client = await Client.findById(req.params.id);
  if (!client || !client.profile_url)
    return res.status(404).send("The client with the given ID was not found");

  //Check if client contain image
  if (client.profile_url.length < 1)
    return res
      .status(404)
      .send("The client with the given ID doesn't contain any profile image");

  const profileUrl = path.join(__dirname, "..", client.profile_url);
  res.sendFile(profileUrl);
});

/* READ nidFront/:id a image for client = GET*/
router.get("/nidFront/:id", validateObjectId, async (req, res) => {
    //Check if client exists
    const client = await Client.findById(req.params.id);
    if (!client || !client.nid_front_url)
      return res.status(404).send("The client with the given ID was not found");
  
    //Check if client contain image
    if (client.nid_front_url.length < 1)
      return res
        .status(404)
        .send("The client with the given ID doesn't contain any profile image");
  
    const nid_front_url = path.join(__dirname, "..", client.nid_front_url);
    res.sendFile(nid_front_url);
});

/* READ nidBack/:id a image for client = GET*/
router.get("/nidBack/:id", validateObjectId, async (req, res) => {
    //Check if client exists
    const client = await Client.findById(req.params.id);
    if (!client || !client.nid_back_url)
      return res.status(404).send("The client with the given ID was not found");
  
    //Check if client contain image
    if (client.nid_back_url.length < 1)
      return res
        .status(404)
        .send("The client with the given ID doesn't contain any profile image");
  
    const nid_back_url = path.join(__dirname, "..", client.nid_back_url);
    res.sendFile(nid_back_url);
});

module.exports = router;