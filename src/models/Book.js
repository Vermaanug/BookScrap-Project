const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    bookname: { 
        type: String, 
        required: true 
    },
    standard: { 
        type: String, 
        required: true 
    },
    number: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    },
    pincode: { 
        type: String, 
        required: true 
    },
    imagePath: { 
        type: String 
    },
    username : {
        type : String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date
    }
});

const Book = new  mongoose.model('Book', bookSchema);

module.exports = Book;
