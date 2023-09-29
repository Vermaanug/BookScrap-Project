const express = require("express");
require("./db/connection");
const path = require("path");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const User = require("./models/Signup");
const crypto = require('crypto');
const session = require('express-session');
const multer = require('multer');
const Book = require('./models/Book');

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

// Storage and FileName Setting
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/uploads'); // Destination folder for uploaded images
  },
  filename: (req, file, cb) => {
      cb(null , file.originalname);
  },
});

const upload = multer({ storage : storage });

// Handle POST request to save data to the database
app.post('/submit-form', upload.single('imagePath'),  isAuthenticated ,async (req, res) => {

  try {
      // Create a new book object
      const newBookEntry = new Book({
          bookname : req.body.bookname ,
          standard : req.body.standard ,
          number : req.body.number ,
          location : req.body.location ,
          pincode : req.body.pincode ,
          imagePath: req.file ? req.file.filename : '',
          username: req.session.username,
      });

      // Save the book data to the database
      await newBookEntry.save();
      res.status(201).json({ message: 'Book entry created successfully' });
  } catch (error) {
      console.error('Error creating book entry:', error);
      res.status(500).json({ message: 'An error occurred while creating the book entry' });
  }
});

// Create a route to fetch data from the database
app.get('/Browse', async (req, res) => {
  try {
    // Fetch data from the Book collection
    const books = await Book.find(); 

    const data = {
      books,
      isAuthenticated: req.session.isAuthenticated || false,
      username: req.session.username || '',
    };

    res.render('browse', data); 
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'An error occurred while fetching data' });
  }
});

// Create a route for the dynamic book page
app.get('/book/:bookId', async (req, res) => {
  try {
    // Fetch the book details based on bookId from the database
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).send("Book not found");
    }

    // Render the "Dynamic" page with book details
    res.render('Dynamic', { 
    book,
    isAuthenticated: req.session.isAuthenticated || false,
    username: req.session.username || '' ,
  });
  } catch (error) {
    console.error('Error fetching book data:', error);
    res.status(500).json({ message: 'An error occurred while fetching book data' });
  }
});



app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});
