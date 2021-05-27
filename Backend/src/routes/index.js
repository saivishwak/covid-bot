/*  --------- Dialogflow Routes for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const glob = require("glob");
const Router = require("express").Router;

// Local session data
const verifySession = [];

module.exports = () =>
  glob
    .sync("**/*.js", { cwd: `${__dirname}/` })
    .map((filename) => require(`./${filename}`))
    .filter((router) => Object.getPrototypeOf(router) == Router)
    .reduce((rootRouter, router) => rootRouter.use(router), Router({ mergeParams: true }));

module.exports.verifySession = verifySession;
