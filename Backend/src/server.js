/*  --------- Main Source File for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const express = require("express");
const https = require("https");
const http = require("http");
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/.env" });

// Utils Import
const { db } = require("./utils/mongoDb.js");
const logger = require("./utils/logger.js");

/* Runtine Mode */
logger("**** Runtime Mode ****  --> ", process.env.NODE_ENV);

// Initialize Express
const app = express();

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes import
const dialogflowRoutes = require("./routes/index.js")();

// DB connection initialize
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  logger("**** Mongo DB is connected ****");
});

// Homepoage Route
app.get("/api", (req, res) => {
  // res.send("DialogFlow API");
  res.status(200).send("welcome to ByteBook.co dialogflow API services");
});

//Use routes
app.use(dialogflowRoutes);

// PORT
const PORT = process.env.PORT || 9000;

// create http server
const server = http.createServer(app);

// Listener
server.listen(PORT, () => logger(`Listening on port ${PORT}`));
