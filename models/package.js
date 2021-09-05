
const mongoose = require("mongoose");
const Joi = require("joi");
const mongoosePaginate = require('mongoose-paginate-v2');
const { objSchema } = require('./common_schemas')

const packageSchema = new mongoose.Schema({
    company: { type: objSchema, required: true },
    serial: { type: Number, required: true },
    name: { type: String, required: true, minlength: 3 },
    slug: { type: String, minlength: 3 },
    createdAt: { type: Date, required: true, default: Date.now, },
});

packageSchema.plugin(mongoosePaginate);
const Package = mongoose.model("Package", packageSchema);

function validatePackage(package) {
    const schema = Joi.object({
        serial: Joi.number().min(0).required(),
        name: Joi.string().min(3).max(50).required(),
    });
    return schema.validate(package);
}

exports.Package = Package;
exports.validate = validatePackage;