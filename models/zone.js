const mongoose = require("mongoose");
const Joi = require("joi");
const mongoosePaginate = require('mongoose-paginate-v2');
const { objSchema } = require('./common_schemas')

const zoneSchema = new mongoose.Schema({
    company: { type: objSchema, required: true },
    serial: { type: Number, required: true },
    name: { type: String, required: true, minlength: 3 },
    slug: { type: String, minlength: 3 },
    createdAt: { type: Date, required: true, default: Date.now, },
});

zoneSchema.plugin(mongoosePaginate);
const Zone = mongoose.model("Zone", zoneSchema);

function validateZone(zone) {
    const schema = Joi.object({
        serial: Joi.number().min(0).required(),
        name: Joi.string().min(3).max(50).required(),
    });
    return schema.validate(zone);
}

exports.Zone = Zone;
exports.validate = validateZone;