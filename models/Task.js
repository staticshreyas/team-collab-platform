const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const TaskSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: "projects",
    required: true
  },
  taskName: {
    type: String,
    required: true
  },
  dateDue: {
    type: Date
  },
  assignee:[ {
        name:{
            type: String
        },
        uid:{
            type:String
        },
        src:{
          type:String
        }
  }],
  taskStatus:{
      type:String
  }
});
module.exports = Task = mongoose.model("tasks", TaskSchema);