const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Joi = require("joi");
const mongoosePaginate = require("mongoose-paginate-v2");
const { objSchema } = require('./common_schemas')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 50, },
  phone: {
    type: String /*required by default**/,
    validate: {
      validator: function (v) {
        var re = /^01[3-9][ ]?[0-9]{2}[ ]?[0-9]{3}[ ]?[0-9]{3}$/;
        return v == null || v.trim().length < 1 || re.test(v);
      },
      message: "Provided phone number is invalid.",
    }, index: { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
  },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, minlength: 5, maxlength: 1024, },
  role: { type: String, required: true, },
  createdAt: { type: Date, required: true, default: Date.now },
  active: { type: Boolean, default: false },
  company: objSchema
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, role: this.role },
    config.get("jwtPrivateKey")
  );
  return token;
};

userSchema.plugin(mongoosePaginate);
const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(60).email().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01[3-9][ ]?[0-9]{2}[ ]?[0-9]{3}[ ]?[0-9]{3}$/)
      .allow(null).allow(""),
    password: Joi.string().min(5).max(255).required(),
    role: Joi.string(),
  });
  return schema.validate(user);
}

exports.User = User;
exports.validate = validateUser;
