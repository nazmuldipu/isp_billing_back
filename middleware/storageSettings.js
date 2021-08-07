const fs = require("fs");
const path = require("path");
const multer = require("multer");

//TODO: 1) Create error message for image maxCount - if maximum number of image is exceed
module.exports = function (destination) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const path = `../images/${destination}/`;
      fs.mkdirSync(path, { recursive: true });
      cb(null, path);
    },
    filename: function (req, file, cb) {
      return cb(
        null,
        file.fieldname +
          "-" +
          Math.floor(Math.random() * 1000) +
          "-" +
          Date.now() +
          path.extname(file.originalname)
      );
    },
  });

  /* defined filter */
  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype == "image/svg+xml" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/png"
    ) {
      cb(null, true);
    } else {
      req.fileValidationError = "Forbidden extension";
      cb(null, false, req.fileValidationError);
    }
  };
  return multer({ storage: storage, fileFilter: fileFilter });
};
