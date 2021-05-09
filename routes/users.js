const _ = require("lodash");
const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const { User, validate, validateProfile } = require("../models/user");
const validateObjectId = require("../middleware/validateObjectId");
const validator = require("../middleware/validate");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const pagiCheck = require("../middleware/paginations");
// const { sendOTP } = require('../services/smsService');

//------------------User profile-----------------
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

//------------------REGISTER-----------------
router.post("/", [validator(validate)], async (req, res) => {
  //Phone validation
  let dbUser = await User.findOne({ phone: req.body.phone });
  if (dbUser)
    return res
      .status(400)
      .send(`User with this phone \'${req.body.phone}\'already register`);

  let user = new User(_.pick(req.body, ["name", "phone", "password"]));

  //Email validation
  let email = req.body.email;
  if (email && email.length) {
    let dbUser = await User.findOne({ email: req.body.email });
    if (dbUser)
      return res
        .status(400)
        .send(`User with this email \'${req.body.email}\'already register`);

    user.email = email;
  }

  user.otp = Math.random().toFixed(6).substr(`-${6}`);
  user.active = false;
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user.role = "USER";
  await user.save(user);
  // sendOTP('+88' + user.phone, user.otp);
  // console.log('+88' + user.phone, user.otp);

  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["_id", "name", "phone", "email"]));
});

/*Update user profile self with id, method = PUT*/
router.put("/update", [auth, validator(validateProfile)], async (req, res) => {
  const user = await User.findById(req.user._id);
  const resp = await User.updateOne(
    { _id: user._id },
    {
      $set: {
        name: req.body.name,
        email: req.body.email,
        cus_add1: req.body.cus_add1,
        cus_add2: req.body.cus_add2,
        cus_city: req.body.cus_city,
        cus_country: req.body.cus_country,
        deliveryInstruction: req.body.deliveryInstruction,
      },
    }
  );
  res.send(resp);
})

/*Update user profile self with id, method = PUT*/
router.put("/updateProfile/:id", [auth, admin, validator(validateProfile)], async (req, res) => {
  let user = await User.findById(req.params.id);
  const resp = await User.updateOne(
    { _id: user._id },
    {
      $set: {
        name: req.body.name,
        email: req.body.email,
        cus_add1: req.body.cus_add1,
        cus_add2: req.body.cus_add2,
        cus_city: req.body.cus_city,
        cus_country: req.body.cus_country,
        deliveryInstruction: req.body.deliveryInstruction,
      },
    }
  );

  user = await User.findById(req.params.id);
  res.send(user);
})

/*Update a User for request with id, method = PUT*/
router.put("/:id", [auth, admin, validateObjectId, validator(validate)],
  async (req, res) => {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("The User with the given ID was not found");
    }
    user = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          role: req.body.role ? req.body.role : "USER",
        },
      }
    );
    res.send(user);
  }
);

/*READ all user for request with method = GET*/
router.get("/", [auth, admin, pagiCheck], async (req, res) => {
  const param = req.query.param ? req.query.param.replace(/\W/g, "") : '';

  var query = param
    ? {
      $or: [
        { name: { $regex: param } },
        { phone: { $regex: param } },
        { email: { $regex: param } },
      ],
    }
    : {};

  const options = {
    select: "name phone email role active",
    sort: req.query.sort,
    page: req.query.page,
    limit: req.query.limit,
  };
  const users = await User.paginate(query, options);
  res.send(users);
});

/*READ a User for request with id, method = GET*/
router.get("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).send("The user with the given ID was not found");
  res.send(user);
});

/*ACTIVE toggle user for method = PATCH*/
router.patch("/activate/:id", [auth, admin, validateObjectId], async (req, res) => {
  //Check if product exists
  let user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).send("The user with the given ID was not found");

  if (user.active) {
    user.active = false;
  } else {
    user.active = true;
  }
  await user.save();
  res.send(user);
}
);

router.patch('/otpActivate', async (req, res) => {
  const user = await User.findOne({ "phone": req.body.phone });
  if (!user) return res.status(404).send("The user with the given phone, not found");
  if (user.otp !== req.body.otp) return res.status(403).send("OTP didn't matched!");
  await User.updateOne({ phone: user.phone }, { $set: { active: true } });
  res.send({ message: "user activated" });
})

// router.patch('/sendOTP/:phone', async (req, res) => {
//   const user = await User.findOne({ "phone": req.params.phone });
//   if (!user) return res.status(404).send("The user with the given phone, not found");
//   const otp = Math.random().toFixed(6).substr(`-${6}`);
//   await User.updateOne({ phone: user.phone }, { $set: { active: false, otp } });
//   sendOTP('+88' + user.phone, otp);
//   res.send({ message: "otp sent" });
// })

router.patch('/password-reset', async (req, res) => {
  const user = await User.findOne({ "phone": req.body.phone });
  if (!user) return res.status(404).send("The user with the given phone, not found");
  if (user.otp !== req.body.otp) return res.status(403).send("OTP didn't matched!");

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(req.body.password, salt);
  await User.updateOne({ phone: user.phone }, { $set: { active: true, password } });
  res.send({ message: "password reset successfully" });
})

/*CHANGE password from admin with method = PATCH*/
router.patch("/change-password/:id", [auth, admin, validateObjectId], async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user)
    return res.status(404).send("The user with the given ID was not found");

  const newPassword = req.body.password;
  if (!newPassword) return res.status(400).send("New password required");

  //Change password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  await user.save(user);

  res.send(_.pick(user, ["_id", "name", "phone", "email"]));
}
);

/*CHANGE password from user himself with method = PUT*/
router.patch("/changePassword", [auth], async (req, res) => {
  if (!req.body.oldPassword || !req.body.newPassword)
    return res
      .status(404)
      .send("Request parameter oldPassword or newPassword is missing");

  const user = await User.findById(req.user._id);
  if (!user || user._name) {
    return res.status(404).send("The user with the token was not found");
  }

  const validPassword = await bcrypt.compare(
    req.body.oldPassword,
    user.password
  );
  if (!validPassword) {
    return res.status(401).send("Old Password not correct");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.newPassword, salt);
  await user.save(user);

  res.send(user);
});

module.exports = router;
