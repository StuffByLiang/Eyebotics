var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
const { IamTokenManager } = require("ibm-watson/auth");

// allows environment properties to be set in a file named .env

require("dotenv").config({ silent: true });

if (!process.env.SPEECH_TO_TEXT_IAM_APIKEY) {
  console.error(
    "Missing required credentials - see https://github.com/watson-developer-cloud/node-sdk#getting-the-service-credentials"
  );
  process.exit(1);
}

var indexRouter = require("./src/backend/routes/index");

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

const sttAuthenticator = new IamTokenManager({
  apikey: process.env.SPEECH_TO_TEXT_IAM_APIKEY,
});

// speech to text token endpoint
app.use("/api/speech-to-text/token", function (req, res) {
  return sttAuthenticator
    .requestToken()
    .then(({ result }) => {
      res.json({
        accessToken: result.access_token,
        url: process.env.SPEECH_TO_TEXT_URL,
      });
    })
    .catch(console.error);
});

module.exports = app;
