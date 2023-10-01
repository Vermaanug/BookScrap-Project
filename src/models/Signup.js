const mongoose = require("mongoose")

const SignUp = mongoose.Schema({
    Firstname:{
        type:String,
        require:true
    },
    Lastname:{
        type:String,
        require:true
    },
    Username:{
        type:String,
        require:true
    },
    Email:{
        type:String,
        require:true
    },
    Password:{
        type:String,
        require:true
    }
})

const User = new mongoose.model('User', SignUp);

module.exports = User;