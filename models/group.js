const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoosePaginate = require('mongoose-paginate-v2');
const { objSchema } = require('./common_schemas')

const groupSchema = new mongoose.Schema({
    company: { type: objSchema, required: true },
    serial: { type: Number, required: true },
    name: { type: String, required: true, minlength: 3 },
    slug: { type: String, minlength: 3 },
    createdAt: { type: Date, required: true, default: Date.now, },
});

groupSchema.plugin(mongoosePaginate);
const Group = mongoose.model("Group", groupSchema);

function validateGroup(group) {
    const schema = Joi.object({
        serial: Joi.number().min(0).required(),
        name: Joi.string().min(3).max(50).required(),
    });
    return schema.validate(group);
}

exports.Group = Group;
exports.validate = validateGroup;