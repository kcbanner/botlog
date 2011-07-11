var mongoose = require('mongoose');
var settings = require('./settings');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Post = new Schema({
  date: {type: Date, required: true},
  type: {type: String, required: true},
  title: {type: String, required: true},
  link: {type: String, required: true},
  text: {type: String, default: ''}
});

Post.index({date: 1});

mongoose.model('Post', Post);

exports.Post = mongoose.model('Post');