require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./model/user");
const Item = require("./model/Item");
const auth = require("./middleAuth/auth");

const app = express();

app.use(express.json({ limit: "50mb" }));

app.post("/register", async (req, res) => {
  try {
    
    const { first_name, last_name, email, password } = req.body; //********  Get user input*******/

    /************************  Validate user input************/
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }

    //**************************** */ check if user already exist*****************************/
    
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    /**************Encrypt user password using bcrypt **********/
    encryptedPassword = await bcrypt.hash(password, 10);

    // Store  user info in our database
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(), 
      password: encryptedPassword,
    });

    // ********************Create token*************//s
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      // {
      //   expiresIn: "2h",
      // }
    );
    user.token = token;
    res.cookie("token", token).json({ id: user._id, email: user.email });
  } catch (err) {
    console.log(err);
  }
});

/**************Login************************************/

app.post("/login", async (req, res) => {
  try {
    /************  user input ************/
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    //***************** */ Check for existing user*************//
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      //**********************  Create token*****************//
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

     
      user.token = token;
      res.cookie("token", token).json(user);
    }
    //res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
});

//api for checking user login or not
app.get("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome To Grocery App ");
});

//*******************Add new item for logged in User************//
app.post("/items", async (req, res) => {
  
  const payload = jwt.verify(
    req.header("x-access-token"), process.env.TOKEN_KEY);

  const newItem = req.body.item_name;
  if (!(newItem)) {
    res.status(404).json({ error: "missing item title" });
  }

  /*************Enter Item details in Database******************/
  const item = await Item.create({
    newItem,
    done: false,
    user: payload.id
  });
  res.status(200).json({ item: item });
});


//*********************Get Item List for Logged In User */
app.get("/items", (req, res) => {
  const payload = jwt.verify(
    req.header("x-access-token"),
    process.env.TOKEN_KEY
  );
  Item.where({ user: payload.id }).find((err, items) => {
    res.json(items);
  });
});

app.post("/item-status", (req, res) => {
  console.log(req.body);
  const payload = jwt.verify(
    req.headers["x-access-token"],
    process.env.TOKEN_KEY
  );
  Item.updateOne(
    {
      _id: req.body.id,
      user: payload.id,
    },
    {
      done: req.body.done,
    }
  ).then(() => {
    res
      .sendStatus(200)
      .json({ item: `Item with ${req.body.id} status updated` });
  });
});

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

module.exports = app;
