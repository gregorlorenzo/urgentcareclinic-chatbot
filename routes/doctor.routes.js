module.exports = (app) => {
  const doctors = require("../controllers/doctor.controller");
  const auth = require("../controllers/auth.controller");
  var router = require("express").Router();

  //* Retrieve Doctor -- Tested: GOOD
  router.get("/", auth.protect, doctors.retrieveDoctors);

  router.post("/createdoctor", auth.protect, doctors.createDoctor);

  router.put("/updateschedule", auth.protect, doctors.updateSchedule);

  router.put("/updateinfo", auth.protect, doctors.updateInfo);

  router.delete("/deletedoctor", auth.protect, doctors.deleteDoctor);

  app.use("/api/doctors", router);
};