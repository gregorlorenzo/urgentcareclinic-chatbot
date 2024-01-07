module.exports = app => {
  const users = require("../controllers/user.controller")
  var router = require("express").Router()

  router.get("/", users.getUser)
  router.get("/currentuser", users.getCurrentUser)
  router.delete("/deleteuser", users.deleteUser)

  app.use('/api/users', router);
}