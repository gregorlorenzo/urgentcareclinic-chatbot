module.exports = (app) => {
  const authController = require("../controllers/auth.controller");
  var router = require("express").Router();

  router.get("/signup", authController.signup_get);
  router.post("/signup", authController.signup_post);
  router.post("/adduser", authController.addUser_post);
  router.put("/changepassword", authController.change_password);
  router.get("/login", authController.login_get);
  router.post("/login", authController.login_post);
  router.get("/logout", authController.logout_get);

  app.use("/api/auth", router);
};