// Load required packages
var mongoose = require('mongoose');

// Define our task schema
var TaskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Task name is required']
    },
    description: {
        type: String,
        default: ''
    },
    deadline: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    completed: {
        type: Boolean,
        default: false
    },
    assignedUser: {
        type: String,
        default: ''
    },
    assignedUserName: {
        type: String,
        default: 'unassigned'
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

// Indexes for fast queries
TaskSchema.index({ completed: 1 });
TaskSchema.index({ assignedUser: 1 });

// Export Mongoose model
module.exports = mongoose.model('Task', TaskSchema);
