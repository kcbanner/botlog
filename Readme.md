# botLog

Lightweight XMMP/node/MongoDB powered microblogging.

Posts can be created and deleted through messages to an XMPP bot.
When posts are updated a single html and xml file are generated.
Posts are store in a MongoDB database.

## Usage

Copy `settings.js.default` to `settings.js`, and change to fit your
configuration.

Start the bot:

    $ ./bot.sh

Send it messages! Send `help` for a command list and usage information.

Point your webserver at the public_html/ directory.

## Dependencies

MongoDB needs to be running.

Modules, install with `npm`

  * csv
  * dateformat
  * jade
  * mongoose 
  * node-stringprep
  * node-xmpp

## License

botLog is licensed under the GPL v3.0. Please see `LICENSE` for a copy
of the license.