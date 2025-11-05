// Load required packages
var mongoose = require('mongoose');

// user schema
var UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    pendingTasks: {
        type: [String],
        default: []
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

// Index for faster email lookups
UserSchema.index({ email: 1 });

// Export Mongoose model
module.exports = mongoose.model('User', UserSchema);
