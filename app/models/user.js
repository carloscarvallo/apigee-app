var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

module.exports = mongoose.model('User', new Schema({
    id: ObjectId,
    name: String,
    password: String,
    email: { type: String, unique: true }
}));