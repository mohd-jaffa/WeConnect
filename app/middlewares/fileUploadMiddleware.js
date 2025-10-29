const fileUpload = require("express-fileupload");

const uploadMiddleware = fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadMiddleware;
