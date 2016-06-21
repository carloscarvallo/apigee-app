var mongoose = require('mongoose'),
      Schema = mongoose.Schema;
      ObjectId = Schema.ObjectId;

module.exports = mongoose.model('User', new Schema({
    id: ObjectId,
    name: String,
    password: String,
    email: { type: String, unique: true }
}));