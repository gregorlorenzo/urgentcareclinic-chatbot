require('dotenv').config()
const express = require("express");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const cookieParser = require("cookie-parser");
const dbConfig = require("./config/db.config");
const db = require("./models");
const { requireAuth, checkUser } = require("./middlewares/auth.middleware");

const app = express();
app.set("views", "./views");
app.set("view engine", "ejs");

//Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

db.mongoose
  .connect(dbConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

// Routes
app.get("*", checkUser);
app.get("/", (req, res) => {
  res.render("login");
});
app.get("/faq", (req, res) => {
  res.render("faq");
});
app.get("/index", requireAuth, (req, res) => {
  res.render("index");
});
app.get("/appointments", requireAuth, (req, res) => {
  res.render("appointments");
});
app.get("/doctors", requireAuth, (req, res) => {
  res.render("doctors");
});
app.get("/calendar", requireAuth, (req, res) => {
  res.render("calendar");
});
app.get("/settings", requireAuth, (req, res) => {
  res.render("settings");
});
app.get("/announcement", requireAuth, (req, res) => {
  res.render("announcement");
});
app.get("/chatbot", requireAuth, (req, res) => {
  res.render("chatbot");
});
app.get("/user", requireAuth, (req, res) => {
  res.render("user");
});
app.get("/settings", requireAuth, (req, res) => {
  res.render("settings");
});

require("./routes/auth.routes")(app);
require("./routes/chatbot.routes")(app);
require("./routes/appointment.routes")(app);
require("./routes/doctor.routes")(app);
require("./routes/announcement.routes")(app);
require("./routes/botsettings.routes")(app);
require("./routes/user.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
