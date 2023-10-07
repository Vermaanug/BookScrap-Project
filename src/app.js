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
    Firstname: req.body.Firstname,
    Lastname: req.body.Lastname,
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
      
      // Set the isAdmin flag in the session based on the user's isAdmin property
      req.session.isAdmin = foundResult.isAdmin;

      // Redirect to the appropriate page based on isAdmin flag
      if (req.session.isAdmin) {
        res.redirect("/admin"); // Redirect admin users to the admin page
      } else {
        res.redirect("/"); // Redirect normal users to the index page
      }
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


app.get("/Dashboard", isAuthenticated, async (req, res) => {
  try {
    // Fetch books uploaded by the currently logged-in user
    const books = await Book.find({ username: req.session.username });

    // Render the profile page with the user's books
    res.render("Dashboard", {
      isAuthenticated: true,
      username: req.session.username,
      books: books,
    });
  } catch (error) {
    console.error("Error fetching user's books:", error);
    res.status(500).json({ message: "An error occurred while fetching user's books" });
  }
});

app.get('/edit-book/:id', async (req, res) => {
  try {
      // Retrieve the book information based on the _id parameter
      const bookId = req.params.id;
      
      // Retrieve book information from query parameters
      const book = await Book.findById(bookId);

      if (!book) {
        // Handle the case where the book with the given ID was not found
        res.status(404).send('Book not found');
        return;
      }

      res.render('Update', { 
          book,
          isAuthenticated: req.session.isAuthenticated || false,
          username: req.session.username || '',
      });
  } catch (error) {
      console.error('Error retrieving book data:', error);
      res.status(500).json({ message: 'An error occurred while retrieving book data' });
  }
});

app.post('/update-book', upload.single('imagePath'), isAuthenticated, async (req, res) => {
  try {
    const bookId = req.body.bookId; // Get the book ID from the form submission
    const currentImagePath = req.body.currentImagePath; // Get the current image path
    const updatedImagePath = req.file ? req.file.filename : currentImagePath;
    const updatedBookData = {
      bookname: req.body.bookname,
      standard: req.body.standard,
      number: req.body.number,
      location: req.body.location,
      pincode: req.body.pincode,
      imagePath: updatedImagePath,
    };

    // Use the bookId to update the book data in the database
    await Book.findByIdAndUpdate(bookId, updatedBookData);

    res.redirect('/Dashboard'); // Redirect back to the dashboard after updating
  } catch (error) {
    console.error('Error updating book data:', error);
    res.status(500).json({ message: 'An error occurred while updating book data' });
  }
});

app.get('/delete-book/:id', isAuthenticated, async (req, res) => {
  try {
    const bookId = req.params.id;
    
    // Find the book by ID and remove it from the database
    await Book.findByIdAndRemove(bookId);

    res.redirect('/Dashboard'); // Redirect back to the dashboard after deleting
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'An error occurred while deleting the book' });
  }
});

// Add a new route for the admin page
app.get('/admin', isAuthenticated, async (req, res) => {
  if (req.session.isAdmin) {
    try {
      // Fetch the total number of users
      const totalUsers = await User.countDocuments();

      // Fetch the number of books uploaded today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day
      const booksUploadedToday = await Book.countDocuments({
        createdAt: { $gte: today },
      });

      // Fetch the number of books deleted today
      const booksDeletedToday = await Book.countDocuments({
        deletedAt: { $gte: today },
      });

      // Render the admin dashboard page and pass the data
      res.render('admin', {
        totalUsers,
        booksUploadedToday,
        booksDeletedToday,
        isAuthenticated: req.session.isAuthenticated || false,
        username: req.session.username || '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ message: 'An error occurred while fetching data' });
    }
  } else {
    // If the user is not an admin, redirect them to a different page (e.g., index page)
    res.redirect('/');
  }
});

app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});
