module.exports = (app) => {
  const informations = require("../controllers/botsettings.controller");
  const auth = require("../controllers/auth.controller");
  var router = require("express").Router();

  //* Find user by name -- Tested: GOOD
  router.get("/", auth.protect, informations.getInformation);

  router.post("/createinfo", auth.protect, informations.createInformation);

  router.put("/updateinfo", auth.protect, informations.updateInformation);

  router.delete("/deleteinfo", auth.protect, informations.deleteInformation);

  app.use("/api/botsettings", router);
};