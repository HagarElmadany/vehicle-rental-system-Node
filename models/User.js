const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Email is invalid'],
        trim: true
    },
    password: {
        type: String,
        //required: [true, 'Password is required'],
        password: {
            type: String,
            required: false  // allow null for Google signups
        },
        googleId: {
            type: String,
            required: false
        },

        minlength: [6, 'Password must be at least 6 characters']
    },
    role: { type: String, enum: ['admin', 'agent', 'client'], default: 'client', required: true },
},
{
    timestamps: true,
});




module.exports = mongoose.model('User', userSchema);