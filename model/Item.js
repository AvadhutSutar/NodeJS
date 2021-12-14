const mongoose = require("mongoose");

const GrocerySchema = new mongoose.Schema({
  item_name: { type: String},
  done: { type: mongoose.SchemaTypes.Boolean, required: true },
  user: { type: mongoose.SchemaTypes.ObjectId, ref: "user " }
});

module.exports = mongoose.model("item", GrocerySchema);


