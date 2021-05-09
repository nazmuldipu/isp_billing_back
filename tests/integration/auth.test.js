const request = require("supertest");
const { User } = require("../../models/user");

let server;

describe("/api/auth", () => {
  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    server.close();
    await User.remove({});
  });

  describe("POST / LOGIN", () => {
    let token;
    let name;
    let phone;
    let email;
    let password;

    const register = async () => {
      return await request(server)
        .post("/api/users")
        .send({ name, phone, email, password });
    };

    const login = async () => {
      return await request(server).post("/api/auth").send({ phone, password });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();
      name = "Akil Ahmed";
      phone = "01945456454";
      email = "akil@gmail.com";
      password = "123456";

      await register();
    });

    it("should return 400 if request phone empty", async () => {
      phone = null;
      const res = await login();
      expect(res.status).toBe(400);
    });

    it("should return 400 if request phone is invalid", async () => {
      phone = "01545465404";
      const res = await login();
      expect(res.status).toBe(400);
    });

    it("should return 400 if request password is null", async () => {
      password = null;
      const res = await login();
      expect(res.status).toBe(400);
    });

    it("should return 400 if request password is invalid", async () => {
      password = "39203923";
      const res = await login();
      expect(res.status).toBe(400);
    });

    it("should return 200 if request is valid", async () => {
      const res = await login();
      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toEqual(expect.arrayContaining(["token"]));
      expect(Object.keys(res.body).toString()).toBe("token");
    });
  });
});
