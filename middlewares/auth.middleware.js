const config = require("../config/auth.config");
const jwt = require('jsonwebtoken');
const db = require("../models");
const User = db.user;

const requireAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    jwt.verify(token, config.secret, (err, decodedToken) => {
      if (err) {
        res.redirect('/');
      } else {
        next();
      }
    });
  } else {
    res.redirect('/');
  }
};

const checkUser = async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decodedToken = await jwt.verify(token, config.secret);
      const user = await User.findById(decodedToken.id);
      res.locals.user = user;
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  next();
};

module.exports = { requireAuth, checkUser };