module.exports = app => {
    const chatbotController = require("../controllers/chatbot.controller");
    var router = require("express").Router();

    // Route for chatbot 
    router.post("/", chatbotController.main);

    // Route for admin 
    app.use('/webhook', router);
};