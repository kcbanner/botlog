var csv = require('csv');
var mongoose = require('mongoose');

var settings = require('../settings');
var models = require('../models');

var db =  mongoose.connect('mongodb://localhost/' + settings.db);

var args = process.argv.slice(2);
if (args.length == 0) {
  console.log('usage: import_csv.js <csvfile>');
  process.exit(1);
}

//
// Load and save all posts from CSV
//

csv().fromPath(args[0], {columns: true}).on('data', function(data, index) {
  var post = new models.Post();
  post.date = new Date(data.date);
  post.type = data.type;
  post.title = data.title;
  post.link = data.link;
  post.text = data.text || '';

  post.save(function(err) {
    if (err) {
      throw err;
    }

    console.log(index);
  });
}).on('error', function(err) {
  console.log(err);
});