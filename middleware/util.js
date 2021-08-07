const fs = require("fs");

const cleanObject = (object) => {
    object = JSON.stringify(object, replaceUndefinedOrNull);
    return JSON.parse(object);
}

function replaceUndefinedOrNull(key, value) {
    if (value === null || value === undefined || value === "") {
        return undefined;
    }

    return value;
}


const deleteImages = (files) => {
    for (var keys in files) {
        for (th of files[keys]) {
            const ipath = th.destination + th.filename;
            fs.unlink(ipath, (err) => {
                if (err) return err;
            });
        }
    }
    return;
}

exports.CleanObject = cleanObject;
exports.DeleteImage = deleteImages;