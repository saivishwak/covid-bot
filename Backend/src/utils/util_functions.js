/*  --------- All Utils functions for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to LinkedPhone. Any use of this code outside LinkedPhone is not
    allowed.
*/

// Import libraries
const dialogflow = require("@google-cloud/dialogflow");

//Utils import
const logger = require("./logger.js");

module.exports.dialogflowConversation = function dialogflowConversation(sessionId, context, message, timeZone) {
  /* DialogflowConseration helper function
      this function is a promise which sends API request to dialogflow (using client Library)
      to detect the intent and the dialogflow call's a webhook whoose response is return to us.
  
      After we get the response we send a message to client with the fullfillment text
    */
  return new Promise((resolve, reject) => {
    /* Dialogflow ProjectID */
    const projectId = "covidbot-emeb";

    /* Initate new SessionCLient obj */
    const sessionClient = new dialogflow.SessionsClient();

    /* SessionClient.projectAgentSessionPath return a string which will be sent to Dialogflow API */
    let sessionPath;
    try {
      sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    } catch (err) {
      logger(err);
    }

    /* Parametes for sending to dialogflow API */
    const request = {
      session: sessionPath,
      queryParams: {
        contexts: JSON.parse(context),
        timeZone,
      },
      queryInput: {
        text: {
          // The query to send to the dialogflow agent
          text: message,
          // The language used by the client (en-US)
          languageCode: "en-US",
        },
      },
    };
    /* Send API request to dialogflow with input parameters */
    sessionClient
      .detectIntent(request)
      .then((response) => {
        /* Log when promise is returned from Dialogflow API */
        logger("Detected intent", response[0].intent);

        const result = response[0].queryResult;
        //logger("****** output context *****", JSON.stringify(result.outputContexts));
        logger(`  Query: ${result.queryText}`);
        logger(`  Response: ${result.fulfillmentText}`);

        /* resolve the result */
        resolve(result);
      })
      .catch((err) => {
        /* reject if any error occurs */
        logger("error :", err);
        reject(err);
      });
  });
};
