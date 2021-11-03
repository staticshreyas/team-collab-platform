const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const ProjectSchema = new Schema({
  projectName: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  teamMembers: [
    {
      email: {
        type: String
      },
      name: {
        type: String
      },
      uid:{
          type: String
      },
      src:{
          type:String
      },
      role:{
          type:String
      }
    }
  ],
  dueDate: {
    type: Date,
    default: Date.now
  },
  budget:{
      type:String
  },
  ownerName:{
      type:String
  }
});

module.exports = Project = mongoose.model("projects", ProjectSchema);