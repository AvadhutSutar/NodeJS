const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const config = process.env;
const express = require("express");
const app = express();

app.use(cookieParser());
const verifyToken = (req, res, next) => {
  const token =
     req.header("x-access-token");
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    console.log(config.TOKEN_KEY,token,"this is the token");
    const decoded = jwt.verify(token, config.TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    console.log(err);
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;
