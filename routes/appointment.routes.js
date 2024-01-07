module.exports = (app) => {
  const appointments = require("../controllers/appointment.controller");
  const auth = require("../controllers/auth.controller");
  var router = require("express").Router();

  //* Retrieve Appointments -- Tested: GOOD
  router.get("/", appointments.retrieveAppointments);

  router.get(
    "/activeappointments",
    auth.protect,
    appointments.retrieveActiveAppointments
  );

  router.get(
    "/pendingappointments",
    auth.protect,
    appointments.retrievePendingAppointments
  );

  router.get(
    "/completedappointments",
    auth.protect,
    appointments.retrieveCompletedAppointments
  );

  router.get(
    "/cancelledappointments",
    auth.protect,
    appointments.retrieveCancelledAppointments
  );

  router.put(
    "/retrieveappointmentsrange",
    auth.protect,
    appointments.retrieveAppointmentsRange
  );

  //* Find user by name -- Tested: GOOD
  router.get("/user", auth.protect, appointments.findAppointmentByName);

  //* Update appointment status -- Tested: GOOD
  router.put(
    "/updatestatus",
    auth.protect,
    appointments.updateAppointmentStatus
  );

  router.put(
    "/actionappointment",
    auth.protect,
    appointments.actionAppointment
  );

  app.use("/api/appointments", router);
};