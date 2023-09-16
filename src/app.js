const express = require("express");
require("./db/connection");
const path = require("path");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const User = require("./models/Signup");
const crypto = require('crypto');
const session = require('express-session');

const secretKey = crypto.randomBytes(32).toString('hex');

const app = express();
const port = process.env.PORT || 3000;

const staticpath = path.join(__dirname, "../public");
const templatePath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");
app.use(express.static(staticpath));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
}));


app.set("view engine", "hbs");
app.set("views", templatePath);
hbs.registerPartials(partialsPath);


// MiddleWare 
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    // User is authenticated, proceed to the next middleware or route
    return next();
  }
  // User is not authenticated, redirect to a login page or handle unauthorized access
  res.redirect("/login"); // Redirect to your login page
}


app.get('/', (req, res) => {
  res.render('index', {
    isAuthenticated: req.session.isAuthenticated || false,
    username: req.session.username || '',
  });
});


app.get("/Browse", (req, res) => {
  res.render("Browse", {
    isAuthenticated: req.session.isAuthenticated || false,
    username: req.session.username || '',
  });
});

app.get("/Sell", (req, res) => {
  res.render("Sell", {
    isAuthenticated: req.session.isAuthenticated || false,
    username: req.session.username || '',
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/Signup", (req, res) => {
  res.render("Signup");
});

// Sign Up Api
app.post("/Signup", async (req, res) => {
  const data = {
    Username: req.body.username,
    Email: req.body.email,
    Password: req.body.password,
  };

  try {
    const newUser = await User.create(data);
    res.status(201).json({ message: "Successfully signed up" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "An error occurred during sign-up" });
  }
});

// Login Api
app.post("/login", async (req, res) => {
  const username = req.body.Username;
  const password = req.body.password;

  try {
    const foundResult = await User.findOne({ Username: username });

    if (foundResult && foundResult.Password === password) {
      req.session.isAuthenticated = true;
      req.session.username = foundResult.Username;

      res.redirect("/");
    } else {
      res.send("Invalid Username or Password");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred during login");
  }
});

// Logout 
app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    // Redirect the user to the login page or any other page after logout
    res.redirect("/login");
  });
});


app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});
