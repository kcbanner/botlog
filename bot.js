var fs = require('fs');
var csv = require('csv');
var jade = require('jade');
var xmpp = require('node-xmpp');
var mongoose = require('mongoose');
var date_format = require('dateformat');

var settings = require('./settings');
var models = require('./models');

var db =  mongoose.connect('mongodb://localhost/' + settings.db);

var client = new xmpp.Client({
  jid: settings.username,
  password: settings.password,
  host: settings.host
});

function publish(callback) {
  models.Post.find({}, {}, {sort: {date: -1}}, function(err, posts) {
    if (err) {
      throw err;
    }

    var previous_date_txt;
    posts.forEach(function(post) {
      var date_txt = date_format(post.date, 'mmm dd');
      if (date_txt != previous_date_txt) {
        post.date_txt = date_txt;
      }

      previous_date_txt = date_txt;

      //
      // RFC 822 date used in RSS feed
      //
      
      post.date_822 = date_format(post.date, 'ddd, dd mmm yyyy HH:MM:ss o');
    });
    
    jade.renderFile(
      'index.jade',
      {
        locals: {
          posts: posts,
          title: settings.title,
          tagline: settings.tagline
        }
      },  function(err, html) {
        if (err) {
          throw err;
        }
        
        fs.writeFile('./public_html/index.html', html, function(err) {
          callback && callback();
        });
      });

    jade.renderFile(
      'rss.jade',
      {
        locals: {
          title: settings.title,
          url: settings.url,
          tagline: settings.tagline,
          date: new Date(),
          posts: posts
        }
      },
      function(err, html) {
        if (err) {
          throw err;
        }
        
        fs.writeFile('./public_html/feed.xml', html, function(err) {
          if (err) {
            throw err;
          }
        });
      });
  });
}

client.on('online', function () {
  console.log('online');
  
  //
  // Update presence
  //     
  
  var presence = new xmpp.Element('presence', {});
  presence.c('show').t('chat');
  presence.c('status').t('Online');
  client.send(presence);

  //
  // Send notification to all admins
  //

  if (settings.admin_notification) {
    for (admin in settings.admins) {  
      var message = new xmpp.Element('message', {
        to: settings.admins[admin],
        type: 'chat'
      });
      message.c('body').t('AwesomeBot online');

      client.send(message);
    }
  }
});

var commands = {
  help: {
    usage: null,
    command: function(args, callback) {
      var help_str = 'Commands: \n';

      //
      // Build usage strings for all commands
      //
      
      for (command in commands) {
        if (commands.hasOwnProperty(command)) {
          if (commands[command].usage) {
            help_str += command+ commands[command].usage + '\n';
          }
        }
      }
      
      callback(help_str);
    }
  },
  remove: {
    usage: ' <title> : Remove the post with title = `title`',
    command: function(args, callback) {
      if (args.length < 2) {
        callback('You must enter a post title');
        return;
      }

      var title = args.slice(1).join(' ');
      
      models.Post.remove({title: title}, function(err, removed) {
        if (err) {
          throw err;
        }

        if (removed > 0) {
          publish(function() {
            callback('Post "' + title + '" removed');
          });
        } else {
          callback('Post "' + title + '" not found');
        }
      });
    }
  },
  list: {
    usage: ' [count] : List `count` messages',
    command: function(args, callback) {      
      models.Post.find({}, {}, {sort: {date: -1}}, function(err, posts) {
        var result = '';
        var num = args[1] || 10;

        posts.forEach(function(post, i) {
          if (i < num) {
            result += i + ': ' + post.title + '\n';
          }
        });

        callback(result);
      });
    }
  },
  post: {
    usage: ' <type>,<title>,<link>[,text] : Create post',
    command: function(args, callback) {
      var fields = args.slice(1).join(' ').split(',');
      
      var post = new models.Post();
      post.date = new Date();
      
      if (fields.length < 3) {
        callback('Enter at least 3 arguments');
        return;
      }
      
      post.type = fields[0];
      post.title = fields[1];
      post.link = fields[2];
      post.text = fields[3] || '';
      
      post.save(function(err) {
        if (err) {
          throw err;
        }
        
        publish(function() {
          callback('Posted "' + post.title + '"');
        });
      });
    }
  }
};

client.on('stanza', function (stanza) {
  if (stanza.is('message') && stanza.attrs.type !== 'error') {
    var sender = new xmpp.JID(stanza.attrs.from);

    if (settings.admins.indexOf(sender.bare().toString()) != -1) {      
      var body = stanza.getChild('body');

      //
      // Only respond to stanzas with a body (ignore typing, progress, etc).
      //
      
      if (body) {
        var args = body.getText().split(' ');
        var response = new xmpp.Element('message', {
          to: stanza.attrs.from,
          type: 'chat'
        });

        var command = commands[args[0]];
        if (command) {
          command.command(args, function(result) {
            response.c('body').t(result);
            client.send(response);            
          });
        }
      }
    }
  };
});

client.on('error', function(e) {
  console.log(e);
});