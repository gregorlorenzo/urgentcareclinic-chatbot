module.exports = (app) => {
  const announcements = require("../controllers/announcement.controller");
  const auth = require("../controllers/auth.controller");
  var router = require("express").Router();

  //* Find user by name -- Tested: GOOD
  router.get("/", auth.protect, announcements.getAnnouncement);

  router.post(
    "/postannouncement",
    auth.protect,
    announcements.postAnnouncement
  );

  app.use("/api/announcements", router);
};