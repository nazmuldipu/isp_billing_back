const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoosePaginate = require('mongoose-paginate-v2');
const { objSchema } = require('./common_schemas')

const boxSchema = new mongoose.Schema({
    company: { type: objSchema, required: true },
    zone: { type: objSchema, required: true },
    serial: { type: Number, required: true },
    name: { type: String, required: true, minlength: 3 },
    slug: { type: String, minlength: 3 },
    createdAt: { type: Date, required: true, default: Date.now, },
});  

boxSchema.plugin(mongoosePaginate);
const Box = mongoose.model("Box", boxSchema);

function validateBox(box) {
    const schema = Joi.object({
        zoneId: Joi.objectId().required(),
        serial: Joi.number().min(0).required(),
        name: Joi.string().min(3).max(50).required(),
    });
    return schema.validate(box);
}

exports.Box = Box;
exports.validate = validateBox;