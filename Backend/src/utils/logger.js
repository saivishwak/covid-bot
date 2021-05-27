/*  --------- logger Intents for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

module.exports = logger = function logger(helperText, message) {
  if (process.env.NODE_ENV == "DEVELOPEMENT") {
    const date = new Date();
    return console.log(`[${date.toISOString()}] ${helperText}`, message == null || "" ? "" : JSON.stringify(message));
  } else {
    return;
  }
};
