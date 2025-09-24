const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
        res.status(401).json({ error: "Token not provided" });
    }
    try {
        let tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log("token data", tokenData);
        req.userId = tokenData.userId;
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Something Went Wrong!!!" });
    }
};

module.exports = authenticateUser;
