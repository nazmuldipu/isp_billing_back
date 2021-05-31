const mongoose = require("mongoose");

const objSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, required: true, minlength: 3, maxlength: 50 },
    slug: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, required: true },
    slug: { type: String },
    phone: {
        type: String,
        validate: {
            validator: function (v) {
                var re = /^01[3-9][ ]?[0-9]{2}[ ]?[0-9]{3}[ ]?[0-9]{3}$/;
                return v == null || v.trim().length < 1 || re.test(v);
            },
            message: "Provided phone number is invalid.",
        },
    },
});

exports.objSchema = objSchema;