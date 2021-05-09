const request = require("supertest");
const { Company } = require("../../models/company");
const { User } = require("../../models/user");
const mongoose = require("mongoose");
// const { delay } = require("lodash");

let server;
describe("/api/users", () => {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    beforeEach(() => {
        server = require("../../index");
    });

    afterEach(async () => {
        server.close();
        await Company.remove({});
    });

    describe("POST /", () => {
        // Define the users path, and then in each test, we change
        // one parameter that clearly aligns with the name of the
        // test.
        let name;
        let name_bd;
        let contact_person;
        let phone;
        let per_month;
        let token

        const exec = async () => {
            return await request(server)
                .post("/api/companies")
                .set("x-auth-token", token)
                .send({ name, name_bd, contact_person, phone, per_month });
        };

        beforeEach(() => {
            name = "E-Haque Coaching, Bhuigor";
            name_bd = "ই,হক কোচিং (ভূঁইগড়)";
            contact_person = "Belal";
            phone = "01394934934";
            per_month = 0;

            token = new User({ role: "ADMIN" }).generateAuthToken();
        });

        it("should return 400 if name is null", async () => {
            name = null;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if name is greater thant 50 character", async () => {
            name_bd = new Array(52).join("a");
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it("should return 400 if name_bd is null", async () => {
            name = null;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if name_bd is greater thant 50 character", async () => {
            name_bd = new Array(52).join("a");
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if contact_person is null", async () => {
            contact_person = null;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if per_month is null", async () => {
            per_month = null;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if phone is null", async () => {
            phone = null;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if phone is less than 11 degit", async () => {
            phone = "0191223964";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if phone is greather than 11 degit", async () => {
            phone = "019122396421";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 400 if phone is not valid", async () => {
            phone = "01112239643";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 200 if request is valid", async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("_id");
            expect(res.body).toHaveProperty("name", name);
            expect(res.body).toHaveProperty("name_bd", name_bd);
            expect(res.body).toHaveProperty("contact_person", contact_person);
            expect(res.body).toHaveProperty("phone", phone);
            expect(res.body).toHaveProperty("per_month", per_month);
        });
    });

    describe("GET /", () => {
        let token;

        const exec = async () => {
            return await request(server).get("/api/companies").set("x-auth-token", token);
        };

        beforeEach(() => {
            token = new User({ role: "ADMIN" }).generateAuthToken();
        });

        it("should return 400 if user is not logged in", async () => {
            token = null;
            const resp = await exec();

            expect(resp.status).toBe(400);
        });

        it("should return 403 if user is not admin", async () => {
            token = new User().generateAuthToken();
            const resp = await exec();

            expect(resp.status).toBe(403);
        });

        it("should return all users", async () => {
            const objects = [
                {
                    "name": "E-Haque Coaching, Kandapara",
                    "slug": "e-haque-coaching,-kandapara",
                    "name_bd": "ই,হক কোচিং (কান্দাপাড়া)",
                    "contact_person": "Belal",
                    "phone": "01394934934",
                    "per_month": 0
                },
                {
                    "name": "E-Haque Coaching, Bhuigor",
                    "name_bd": "ই,হক কোচিং (ভূঁইগড়)",
                    "slug": "e-haque-coaching,-bhuigor",
                    "contact_person": "Belal",
                    "phone": "01394934934",
                    "per_month": 0
                }
            ];

            await Company.collection.insertMany(objects);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.docs.length).toBe(2);
            expect(res.body.docs.some((g) => g.name === "E-Haque Coaching, Kandapara")).toBeTruthy();
            expect(res.body.docs.some((g) => g.name === "E-Haque Coaching, Bhuigor")).toBeTruthy();
        });
    });

    describe("GET /:id", () => {
        let id;
        let company;
        let token;

        const exec = async () => {
            return await request(server)
                .get(`/api/companies/${id}`)
                .set("x-auth-token", token);
        };

        beforeEach(async () => {

            const object = {
                "name": "E-Haque Coaching, Kandapara",
                "name_bd": "ই,হক কোচিং (কান্দাপাড়া)",
                "contact_person": "Belal",
                "phone": "01394934934",
                "per_month": 0
            };

            token = new User({ role: "ADMIN" }).generateAuthToken();
            const resp = await request(server).post("/api/companies/")
                .set("x-auth-token", token)
                .send(object);

            company = resp.body;
            id = resp.body._id;

        });

        it("should return 401 if user is not logged in", async () => {
            token = "";
            const resp = await exec();
            expect(resp.status).toBe(401);
        });

        it("should return 403 if user is not valid", async () => {
            token = new User({ role: "USER" }).generateAuthToken();
            const resp = await exec();
            expect(resp.status).toBe(403);
        });

        it("should return 404 if invalid id is passed", async () => {
            id = 1323;
            const res = await exec();

            expect(res.status).toBe(404);
        });

        it("should return 404 if no company with the given id exists", async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return a company if valid id is passed", async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("name", company.name);
            expect(res.body).toHaveProperty("phone", company.phone);
            expect(res.body).toHaveProperty("contact_person", company.contact_person);
        });

    });

    describe("PUT", () => {
        let id;
        let compnay;
        let token;
        let name;
        let name_bd;
        let contact_person;
        let phone;
        let web;
        let per_month;
        let sms_quota;
        let max_entity;

        const exec = async () => {
            return await request(server)
                .put(`/api/companies/${id}`)
                .set("x-auth-token", token)
                .send({ name, name_bd, contact_person, phone, web, per_month, sms_quota, max_entity });
        };

        beforeEach(async () => {
            const object = {
                "name": "E-Haque Coaching, Kandapara",
                "name_bd": "ই,হক কোচিং (কান্দাপাড়া)",
                "contact_person": "Belal",
                "phone": "01394934934",
                "per_month": 0
            };

            name = "Ali Akbar";
            name_bd = "আলি আকবর";
            contact_person = "wali ullah";
            phone = "01394934955";
            web = "www.test.com"
            per_month = 9;
            sms_quota = 10;
            max_entity = 11;

            token = new User({ role: "ADMIN" }).generateAuthToken();
            const resp = await request(server).post("/api/companies/")
                .set("x-auth-token", token)
                .send(object);

            company = resp.body;
            id = resp.body._id;

            token = new User({ role: "ADMIN" }).generateAuthToken();
        });

        it("should return 401 if user is not logged in", async () => {
            token = "";
            const resp = await exec();
            expect(resp.status).toBe(401);
        });

        it("should return 403 if user is not admin", async () => {
            token = new User({ role: "USER" }).generateAuthToken();
            const resp = await exec();
            expect(resp.status).toBe(403);
        });

        it("should return 404 if invalid id is passed", async () => {
            id = 1323;
            const res = await exec();

            expect(res.status).toBe(404);
        });

        it("should return 404 if no company with the given id exists", async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return 200 if request is valid", async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            const resp = await request(server)
                .get(`/api/companies/${id}`)
                .set("x-auth-token", token);
            expect(resp.status).toBe(200);
            expect(resp.body).toHaveProperty("name", name);
            expect(resp.body).toHaveProperty("name_bd", name_bd);
            expect(resp.body).toHaveProperty("contact_person", contact_person);
            expect(resp.body).toHaveProperty("web", web);
            expect(resp.body).toHaveProperty("per_month", per_month);
            expect(resp.body).toHaveProperty("max_entity", max_entity);
            expect(resp.body).toHaveProperty("sms_quota", sms_quota);
        });
    });

    describe("DELETE /:id", () => {
        let token;
        let company;
        let id;

        const exec = async () => {
            return await request(server)
                .delete("/api/companies/" + id)
                .set("x-auth-token", token)
                .send();
        };

        beforeEach(async () => {
            company = new Company({
                "name": "E-Haque Coaching, Kandapara",
                "slug": "e-haque",
                "name_bd": "ই,হক কোচিং (কান্দাপাড়া)",
                "contact_person": "Belal",
                "phone": "01394934934",
                "per_month": 0
            });
            await company.save();

            id = company._id;
            token = new User({ role: "ADMIN" }).generateAuthToken();
        });

        it("should return 401 if user is not logged in", async () => {
            token = "";

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            token = new User({ role: "USER" }).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it("should return 404 if id is invalid", async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it("should return 404 if no company with the given id was found", async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it("should delete the company if input is valid", async () => {
            await exec();

            const companyDb = await Company.findById(id);

            expect(companyDb).toBeNull();
        });

        it("should return the removed company", async () => {
            const res = await exec();

            expect(res.body).toHaveProperty("_id", company._id.toHexString());
            expect(res.body).toHaveProperty("name", company.name);
            expect(res.body).toHaveProperty("name_bd", company.name_bd);
        });
    });

    describe("BUY SMS /buysms/:id", () => {
        let token;
        let company;
        let id;
        let sms_quota;

        const exec = async () => {
            return await request(server)
                .patch("/api/companies/buysms/" + id)
                .set("x-auth-token", token)
                .send({ sms_quota });
        };

        beforeEach(async () => {
            company = new Company({
                "name": "E-Haque Coaching, Kandapara",
                "slug": "e-haque",
                "name_bd": "ই,হক কোচিং (কান্দাপাড়া)",
                "contact_person": "Belal",
                "phone": "01394934934",
                "per_month": 0,
                "sms_quota": 0
            });
            await company.save();
            id = company._id;

            sms_quota = 100;
            token = new User({ role: "ADMIN" }).generateAuthToken();
        });

        it("should return 401 if user is not logged in", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            token = new User({ role: "USER" }).generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 404 if id is invalid", async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return 404 if no company with the given id was found", async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return 200 and update sms_quota", async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("sms_quota", sms_quota);
        })

    })

    describe("BUY SMS /maxlimit/:id", () => {
        let token;
        let company;
        let id;
        let max_entity;

        const exec = async () => {
            return await request(server)
                .patch("/api/companies/maxlimit/" + id)
                .set("x-auth-token", token)
                .send({ max_entity });
        };

        beforeEach(async () => {
            company = new Company({
                "name": "E-Haque Coaching, Kandapara",
                "slug": "e-haque",
                "name_bd": "ই,হক কোচিং (কান্দাপাড়া)",
                "contact_person": "Belal",
                "phone": "01394934934",
                "per_month": 0,
                "sms_quota": 0,
                "max_entity": 0
            });
            await company.save();
            id = company._id;

            max_entity = 100;
            token = new User({ role: "ADMIN" }).generateAuthToken();
        });

        it("should return 401 if user is not logged in", async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            token = new User({ role: "USER" }).generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it("should return 404 if id is invalid", async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return 404 if no company with the given id was found", async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return 200 and update max_entity", async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            console.log(res.body);
            await delay(2000);
            expect(res.body).toHaveProperty("max_entity", max_entity);
        })

    })
});