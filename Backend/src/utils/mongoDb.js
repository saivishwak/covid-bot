/*  --------- MongoDB Schemas for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const mongoose = require("mongoose");

// DB config
const connectionUrl = "mongodb+srv://";
mongoose.connect(connectionUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Db schemas
/* schema for hospitalData */
const hospitalTableDataSchema = new mongoose.Schema({
  "Hospital Name": String,
  Location: String,
  Zone: String,
  "Regular Beds": String,
  "Oxygen Beds": String,
  "ICU Beds": String,
  Phone: String,
  "Last Checked": String,
});

const hospitalDataSchema = new mongoose.Schema({
  "city/district": String,
  resources: Array,
  data: [hospitalTableDataSchema],
});

const toalCountSchema = new mongoose.Schema({
  id: String,
  Active: String,
  Discharged: String,
  Deaths: String,
});

const hospitalDataMongo = mongoose.model("hospital_Data", hospitalDataSchema, "hospital_Data");
const toalCountDataMongo = mongoose.model("totalCount_Data", toalCountSchema, "totalCount_Data");
const db = mongoose.connection;

module.exports.db = db;
module.exports.schema = hospitalDataMongo;
module.exports.totalCountSchema = toalCountDataMongo;
module.exports.mongoose = mongoose;
