const { promisify } = require("util");
const config = require("../config/auth.config");
const jwt = require("jsonwebtoken");
const db = require("../models");
const bcrypt = require("bcryptjs");
const User = db.user;

// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { username: "", password: "" };

  // incorrect username
  if (err.message === "incorrect username") {
    errors.username = "That username is not registered";
  }

  // incorrect password
  if (err.message === "incorrect password") {
    errors.password = "That password is incorrect";
  }

  // duplicate username error
  if (err.code === 11000) {
    errors.username = "that username is already registered";
    return errors;
  }

  // validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, config.secret, {
    expiresIn: maxAge,
  });
};

// controller actions
module.exports.signup_get = (req, res) => {
  res.render("signup");
};

module.exports.login_get = (req, res) => {
  res.render("login");
};

module.exports.change_password = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Password does not match." });
  }

  try {
    const verified = jwt.verify(token, config.secret);
    const user = await User.findOne({ _id: verified.id });

    bcrypt.compare(oldPassword, user.password, async (err, result) => {
      if (result) {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(newPassword, salt);
        const updateUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { password: hash } },
          { new: true }
        );
        const { username } = updateUser;
        res
          .status(200)
          .json({ message: `${username} password updated successfully!` });
      } else {
        res.status(400).json({ message: "Old password is incorrect." });
      }
    });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

module.exports.signup_post = async (req, res) => {
  const { username, password, confirm_password, key } = req.body;

  if (!password || !confirm_password)
    return res.status(401).json({ message: "Password fields cannot be empty" });

  if (password !== confirm_password)
    return res.status(401).json({ message: "Passwords do not match" });

  if (key !== process.env.ACCESS_KEY)
    return res.status(403).json({ message: "Access Key not provided" });

  try {
    const user = await User.create({ username, password });
    const token = createToken(user._id);
    res.cookie("token", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

module.exports.addUser_post = async (req, res) => {
  const { username, password, confirm_password, key } = req.body;

  if (!password || !confirm_password) {
    return res.status(401).json({ message: "Password fields cannot be empty" });
  }

  if (password !== confirm_password) {
    return res.status(401).json({ message: "Password does not match" });
  }

  if (key !== process.env.ACCESS_KEY) {
    return res.status(403).json({ message: "Access Key not provided" });
  }

  try {
    const user = await User.create({ username, password });
    res.status(201).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

module.exports.login_post = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.login(username, password);
    const token = createToken(user.id);
    res.cookie("token", token, { httpOnly: true, maxAge: maxAgeInSeconds * 1000 });
    res.status(200).json({ userId: user.id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie("token", "", { maxAge: 1 });
  res.redirect("/");
};

module.exports.isLoggedIn = async (req, res, next) => {
  const jwtToken = req.cookies.jwt;
  if (jwtToken) {
    try {
      const decoded = await promisify(jwt.verify)(jwtToken, config.secret);
      const currentUser = await User.findById(decoded._id);
      if (currentUser) {
        res.locals.user = currentUser;
      }
    } catch (err) {
      // ignore error
    }
  }
  next();
};

const jwt = require('jsonwebtoken');
const config = require('./config');
const User = require('./User');

module.exports.protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const currentUser = jwt.verify(token, config.secret);
    const user = await User.findById(currentUser.id).select('-password').lean();

    if (!user) {
      return res.status(400).json({ message: 'Cannot find user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'Error', message: 'Invalid token! Please login again.' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'Error', message: 'Token has expired! Please login again.' });
    }
  }
};
