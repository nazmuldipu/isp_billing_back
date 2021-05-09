const request = require("supertest");
const { User } = require("../../models/user");
const mongoose = require("mongoose");

let server;

describe("/api/users", () => {
  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    server.close();
    await User.remove({});
  });

  describe("POST /", () => {
    // Define the users path, and then in each test, we change
    // one parameter that clearly aligns with the name of the
    // test.
    let name;
    let phone;
    let email;
    let password;

    const exec = async () => {
      return await request(server)
        .post("/api/users")
        .send({ name, phone, email, password });
    };

    beforeEach(() => {
      name = "Akil Ahmed";
      phone = "01945456454";
      email = "akil@gmail.com";
      password = "123456";
    });

    it("should return 400 if name is null", async () => {
      name = null;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if name is greater thant 50 character", async () => {
      name = new Array(52).join("a");
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

    it("should return 400 if email is less than 5 character", async () => {
      email = "abcd";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if email is greater than 60 character", async () => {
      email = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz@gmail.com";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if email is not a valid email address", async () => {
      email = "gmail.com";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if password is null", async () => {
      password = null;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if password is less than 5 character", async () => {
      password = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if password is greater than 2555 character", async () => {
      password = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 200 if request is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", name);
    });
  });

  describe("PUT", () => {
    let id;
    let user;
    let token;
    let newName;
    let newPhone;
    let newEmail;

    const exec = async () => {
      return await request(server)
        .put(`/api/users/${id}`)
        .set("x-auth-token", token)
        .send({
          name: newName,
          phone: newPhone,
          email: newEmail,
          password: "123456",
        });
    };

    beforeEach(async () => {
      newName = "updateName";
      newPhone = "01912239456";
      newEmail = "newemail@gmail.com";

      const resp = await request(server).post("/api/users").send({
        name: "name1",
        phone: "01912239643",
        email: "mail@gmail.com",
        password: "abcdef",
      });

      user = resp.body;
      id = user._id;

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

    it("should return 404 if no user with the given id exists", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 200 if request is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);

      const resp = await request(server)
        .get(`/api/users/${id}`)
        .set("x-auth-token", token);
      expect(resp.status).toBe(200);
      expect(resp.body).toHaveProperty("name", newName);
      expect(resp.body).toHaveProperty("email", newEmail);
      expect(resp.body).toHaveProperty("phone", newPhone);
    });
  });

  describe("GET /", () => {
    let token;

    const exec = async () => {
      return await request(server).get("/api/users").set("x-auth-token", token);
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
      const users = [
        {
          name: "user1",
          email: "user1@mail.com",
          phone: "01912239456",
          password: "Bhuigor",
        },
        {
          name: "user2",
          email: "user2@gmail.com",
          phone: "01912239756",
          password: "Dhanmondi",
        },
      ];

      await User.collection.insertMany(users);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.docs.length).toBe(2);
      expect(res.body.docs.some((g) => g.name === "user1")).toBeTruthy();
      expect(res.body.docs.some((g) => g.name === "user2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    let id;
    let user;
    let token;

    const exec = async () => {
      return await request(server)
        .get(`/api/users/${id}`)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      const resp = await request(server).post("/api/users").send({
        name: "name1",
        phone: "01912239643",
        email: "mail@gmail.com",
        password: "abcdef",
      });

      user = resp.body;
      id = user._id;

      token = new User({ role: "ADMIN" }).generateAuthToken();
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

    it("should return a user if valid id is passed", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", user.name);
      expect(res.body).toHaveProperty("phone", user.phone);
      expect(res.body).toHaveProperty("email", user.email);
    });

    it("should return 404 if invalid id is passed", async () => {
      id = 1323;
      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 404 if no user with the given id exists", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /change-password/:id", () => {
    let id;
    let user;
    let token;
    let password;

    const exec = async () => {
      return await request(server)
        .patch(`/api/users/change-password/${id}`)
        .set("x-auth-token", token)
        .send({ password });
    };

    beforeEach(async () => {
      token = new User({ role: "ADMIN" }).generateAuthToken();
      password = "abcdef";

      const resp = await request(server).post("/api/users").send({
        name: "name1",
        phone: "01912239643",
        email: "mail@gmail.com",
        password: "123456",
      });

      user = resp.body;
      id = user._id;
    });

    it("should return 200 and change password if request is valid", async () => {
      const resp = await exec();
      // console.log(resp.body);
      expect(resp.status).toBe(200);
    });

    it("should retrun 400 if user is not looged in", async () => {
      token = null;

      const resp = await exec();
      expect(resp.status).toBe(400);
    });

    it("should retrun 403 if user is not admin", async () => {
      token = new User({ role: "USER" }).generateAuthToken();

      const resp = await exec();
      expect(resp.status).toBe(403);
    });

    it("should return 404 if user id is invalid", async () => {
      id = 123;

      const resp = await exec();
      expect(resp.status).toBe(404);
    });

    it("should return 404 if user id is not found in database", async () => {
      id = mongoose.Types.ObjectId();
      const resp = await exec();
      expect(resp.status).toBe(404);
    });

    it("should return 400 if no password is provided", async () => {
      password = "";
      const resp = await exec();
      expect(resp.status).toBe(400);
    });
  });

  describe("PATCH /changePassword", () => {
    let id;
    let user;
    let token;
    let oldPassword;
    let newPassword;

    const exec = async () => {
      return await request(server)
        .patch(`/api/users/changePassword`)
        .set("x-auth-token", token)
        .send({ oldPassword, newPassword });
    };

    beforeEach(async () => {
      oldPassword = "123456";
      newPassword = "abcdef";

      const resp = await request(server).post("/api/users").send({
        name: "name1",
        phone: "01912239643",
        email: "mail@gmail.com",
        password: oldPassword,
      });

      user = resp.body;
      id = user._id;
      const tokenResp = await request(server).post(`/api/auth`).send({
        phone: user.phone,
        password: oldPassword,
      });

      token = tokenResp.body.token;
    });

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const resp = await exec();
      expect(resp.status).toBe(401);
    });

    it("should return 404 if user is not valid", async () => {
      token = new User({ role: "USER" }).generateAuthToken();
      const resp = await exec();
      expect(resp.status).toBe(404);
    });

    it("should return 404 if user old password is invalid", async () => {
      oldPassword = "";
      const resp = await exec();
      expect(resp.status).toBe(404);
    });

    it("should return 404 if user new password is invalid", async () => {
      newPassword = "";
      const resp = await exec();
      expect(resp.status).toBe(404);
    });

    it("should return 401 if user old password is wrong", async () => {
      oldPassword = "hsfdlkj";
      const resp = await exec();
      expect(resp.status).toBe(401);
    });

    it("should return 200 if request is valid", async () => {
      const resp = await exec();
      expect(resp.status).toBe(200);

      const tokenResp = await request(server).post(`/api/auth`).send({
        phone: user.phone,
        password: newPassword,
      });
      expect(tokenResp.status).toBe(200);
      expect(tokenResp.body).toHaveProperty("token");
    });
  });

  describe("GET /me", () => {
    let token;

    const exec = async () => {
      return await request(server)
        .get("/api/users/me")
        .set("x-auth-token", token)
        .send();
    };

    beforeEach(async () => {
      token = new User({ role: "ADMIN", }).generateAuthToken();
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 200 if client is logged in", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
  });
});
