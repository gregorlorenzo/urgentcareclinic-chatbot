const db = require("../models");
const config = require("../config/auth.config");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = db.user;

exports.getUser = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Invalid token" });
    }

    try {
        const currentUserId = jwt.verify(token, config.secret).id;
        const users = await User.find({ _id: { $ne: mongoose.Types.ObjectId(currentUserId) } })
            .select("-password")
            .lean();

        res.json(users);
    } catch (err) {
        return res.status(500).json({ message: err });
    }
};

exports.getCurrentUser = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Invalid token" });
    }

    try {
        const currentUserId = jwt.verify(token, config.secret).id;
        const user = await User.findById(currentUserId).select('-password').lean();

        if (!user) {
            return res.status(400).json({ message: 'Cannot find user' });
        }

        res.json(user);
    } catch (err) {
        return res.status(500).json({ message: err });
    }
};

exports.deleteUser = async (req, res) => {
    const { id, key } = req.body;

    if (key !== process.env.ACCESS_KEY) {
        return res.status(401).json({ message: 'Invalid Access Key' });
    }

    try {
        const user = await User.remove({ _id: id });
        return res.json(user);
    } catch (err) {
        return res.status(500).json({ message: 'Something went wrong.' });
    }
};
