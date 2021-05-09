const mongoose = require("mongoose");
const Joi = require("joi");
const mongoosePaginate = require('mongoose-paginate-v2');

const companySchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 3 },
    slug: { type: String, unique: true, minlength: 3 },
    name_bd: { type: String, required: true },
    contact_person: { type: String, required: true },
    phone: {
        type: String /*required by default**/,
        required: true,
        validate: {
            validator: function (v) {
                var re = /^01[3-9][ ]?[0-9]{2}[ ]?[0-9]{3}[ ]?[0-9]{3}$/;
                return v == null || v.trim().length < 1 || re.test(v);
            },
            message: "Provided phone number is invalid.",
        },
    },
    web: { type: String },
    max_entity: { type: Number, required: true, default: 0 },
    sms_quota: { type: Number, required: true, default: 0 },
    per_month: { type: Number, default: 0 },
    balance: { type: Number, default: 0, },
    createdAt: { type: Date, required: true, default: Date.now, },
});

companySchema.plugin(mongoosePaginate);
const Company = mongoose.model("Company", companySchema);

function validateCompany(company) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        name_bd: Joi.string().min(3).max(50).required(),
        contact_person: Joi.string().required(),
        phone: Joi.string()
            .length(11)
            .regex(/^01[3-9][ ]?[0-9]{2}[ ]?[0-9]{3}[ ]?[0-9]{3}$/)
            .required(),
        web: Joi.string(),
        max_entity: Joi.number(),
        sms_quota: Joi.number(),
        per_month: Joi.number().min(0).required(),
    });
    return schema.validate(company);
}

exports.Company = Company;
exports.validate = validateCompany;