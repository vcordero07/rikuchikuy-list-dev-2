"use strict";
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const morgan = require("morgan");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const flash = require("express-flash");

const { router: usersRouter } = require("./users/user.index");
const { router: listsRouter } = require("./lists/list.index");
const { router: itemsRouter } = require("./items/item.index");
const {
  router: authRouter,
  localStrategy,
  jwtStrategy
} = require("./auth/auth.index");
const { router: urlRouter } = require("./url/url.index");

mongoose.Promise = global.Promise;

const {
  PORT,
  DATABASE_URL,
  SENDGRID_USER,
  SENDGRID_PWD,
  MAIL_FROM,
  JWT_SECRET
} = require("./config");

const app = express();

app.use(morgan("common"));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use("/api/auth/", authRouter);
app.use("/api/users/", usersRouter);
app.use("/api/lists/", listsRouter);
app.use("/api/lists/", itemsRouter);
app.use("/api/url/", urlRouter);

const jwtAuth = passport.authenticate("jwt", { session: false });

app.get("/api/protected", jwtAuth, (req, res) => {
  return res.json({ data: "fisterra" });
});

app.use("*", (req, res) => {
  return res.status(404).json({ message: "Not Found" });
});

let server;

function runServer() {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(PORT, () => {
          //console.log(`Your app is listening on port ${PORT}`);
          resolve();
        })
        .on("error", err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      //console.log(`Closing server`);
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}
module.exports = { app, runServer, closeServer };
