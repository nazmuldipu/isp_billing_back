const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoosePaginate = require('mongoose-paginate-v2');
const { objSchema } = require('./common_schemas')

const clientSchema = new mongoose.Schema({
    client_id: { type: String, required: true },
    client_type: { type: String, required: true },
    client_nid_number: { type: String, required: true },
    client_name: { type: String, required: true, minlength: 3 },
    client_father: { type: String, required: true, minlength: 3 },
    clinet_phone: { type: String, required: true, minlength: 3 },
    client_phone_alternate: { type: String },
    client_email: { type: String, required: true, minlength: 3 },
    client_dob: { type: String, required: true },
    client_gender: { type: String, required: true },
    client_occupation: { type: String, required: true },
    client_username: { type: String, required: true },
    client_password: { type: String },
    client_house_no: { type: String },
    client_flat_no: { type: String },
    client_road_no: { type: String },
    client_police_station: { type: String },
    client_present_address: { type: String },
    client_permanent_address: { type: String, required: true },
    client_address_lat: { type: Number },
    client_address_long: { type: Number },
    
    connection_type: { type: String, required: true },
    connection_package: { type: String, required: true },
    cable_type: { type: String, required: true },
    cable_required: { type: String },
    ip_address: { type: String },
    mac_address: { type: String },
    send_login_sms: { type: Boolean, default: false },

    signup_fee: { type: Number },
    discount: { type: Number },
    extra: { type: Number },
    payment_method: { type: String, required: true },
    payment_deadline: { type: Number },
    billing_deadline: { type: Number },
    termination_date: { type: Number },

    agent: { type: String },
    zone: { type: String, required: true },
    box: { type: String },
    network: { type: String },
    bill_collector: { type: String },
    technician: { type: String },

    nid_front_url: { type: String, required: true },
    nid_back_url: { type: String, required: true },
    profile_url: { type: String, required: true },
    note: { type: String },

    createdAt: { type: Date, required: true, default: Date.now, },
});

clientSchema.plugin(mongoosePaginate);
const Client = mongoose.model("Client", clientSchema);

function validateClient(client) {
    const schema = Joi.object({
        client_id: Joi.string().required().label("Client ID"),
        client_type: Joi.string().required().label("Client Type"),
        client_nid_number: Joi.string().required().label("NID number"),
        client_name: Joi.string().required().label("Client Name"),
        client_father: Joi.string().required().label("Client Father"),
        clinet_phone: Joi.string().required().label("Phone"),
        client_phone_alternate: Joi.string().allow(null).allow('').label("Client Alternate Phone"),
        client_email: Joi.string().email().required().label("Email"),
        client_dob: Joi.string().required().label("Date Of Birth"),
        client_gender: Joi.string().required().label("Gender"),
        client_occupation: Joi.string().required().label("Occupation"),
        client_username: Joi.string().required().label("Client Username"),
        client_password: Joi.string().allow(null).allow('').label("Client Password"),
        client_house_no: Joi.string().allow(null).allow('').label("House no"),
        client_flat_no: Joi.string().allow(null).allow('').label("Flat no"),
        client_road_no: Joi.string().allow(null).allow('').label("Road no"),
        client_police_station: Joi.string().allow(null).allow('').label("Police station"),
        client_present_address: Joi.string().allow(null).allow('').label("Present Address"),
        client_permanent_address: Joi.string()
            .required()
            .label("Permanent Address"),
        client_address_lat: Joi.number().allow(null).allow('').label("Address Latitude"),
        client_address_long: Joi.number().allow(null).allow('').label("Address Longitude"),

        connection_type: Joi.string().required().label("Connection Type"),
        connection_package: Joi.string().required().label("Package"),
        cable_type: Joi.string().required().label("Cable Type"),
        cable_required: Joi.string().allow(null).allow('').label("Cable required"),
        ip_address: Joi.string().allow(null).allow('').label("IP Address"),
        mac_address: Joi.string().allow(null).allow('').label("Mac Address"),
        send_login_sms: Joi.boolean().allow(null).allow('').label("Send Login SMS"),

        signup_fee: Joi.number().allow(null).allow('').label("Signup Fee"),
        discount: Joi.number().allow(null).allow('').label("Discount"),
        extra: Joi.number().allow(null).allow('').label("Extra"),
        payment_method: Joi.string().required().label("Payment Method"),
        payment_deadline: Joi.string().allow(null).allow('').label("Payment Deadline"),
        billing_deadline: Joi.string().allow(null).allow('').label("Billing Deadline"),
        termination_date: Joi.string().allow(null).allow('').label("Termination Date"),

        agent: Joi.string().allow(null).allow('').label("Agent"),
        zone: Joi.string().required().label("Zone"),
        box: Joi.string().allow(null).allow('').label("Box"),
        network: Joi.string().allow(null).allow('').label("Network"),
        bill_collector: Joi.string().allow(null).allow('').label("Bill Collector"),
        technician: Joi.string().allow(null).allow('').label("Technician"),

        note: Joi.string().allow(null).allow('').label("Note"),
    });
    return schema.validate(client);
}

exports.Client = Client;
exports.validate = validateClient;