const cloudinary = require("../../config/cloudinary");

const imageUpload = {};

imageUpload.avatar = async (req, res) => {
    try {
        if (!req.files || !req.files.avatar) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const file = req.files.avatar;
        const uploadResult = await cloudinary.uploader.upload(
            file.tempFilePath,
            {
                folder: "profile_pics",
                public_id: `avatar_${Date.now()}`,
                resource_type: "image",
            }
        );
        return res.status(200).json({ avatarUrl: uploadResult.secure_url });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Image upload failed" });
    }
};

imageUpload.thumbail = async (req, res) => {
    try {
        if (!req.files || !req.files.thumbnail) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const file = req.files.thumbnail;
        const uploadResult = await cloudinary.uploader.upload(
            file.tempFilePath,
            {
                folder: "thumbnails",
                public_id: `thumbnail_${Date.now()}`,
                resource_type: "image",
            }
        );
        return res.status(200).json({ thumbnailUrl: uploadResult.secure_url });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Image upload failed" });
    }
};

module.exports = imageUpload;
