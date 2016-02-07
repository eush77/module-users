#!/usr/bin/env node
'use strict';

var moduleUsage = require('module-usage'),
    npmGet = require('npm-get'),
    editor = require('string-editor'),
    prompt = require('inquirer').prompt,
    minimist = require('minimist'),
    die = require('or-die'),
    Queue = require('push-queue'),
    App = require('help-version');

var path = require('path');


var app = App([
  'Usage:  module-users <pkgname>',
  '',
  'Scans npm registry for modules that depend on <pkgname> and downloads',
  'and opens them in $EDITOR, one after another.',
  '',
  'Options:',
  '  -y  Always show next module (no prompt).',
  '      With `-y`, the only way to gracefully exit is to return non-zero',
  '      code from the editor.'
].join('\n'));


var opts = minimist(process.argv.slice(2), {
  alias: {
    yes: 'y'
  }
});


(function main (opts, argv) {
  if (argv.length != 1) {
    return app.help(1);
  }
  if (opts.yes) {
    showPrompt = function (moduleName, callbacks) {
      callbacks.open();
    };
  }

  // Last module name, includes package name and path inside package.
  // Used to filter multiple uses inside a single file.
  var lastModuleName;

  // Either nullish or string. If string, indicates a package name to skip.
  var skipPackageName;

  var enqueue = Queue(function (usage, next) {
    var packageName = usage.dependant;
    var moduleName = path.join(packageName, usage.file);

    if (packageName == skipPackageName || moduleName == lastModuleName) {
      return next();
    }
    lastModuleName = moduleName;

    showPrompt(moduleName, {
      open: open,
      quit: process.exit,
      skipPackage: skipPackage
    });

    function skipPackage () {
      skipPackageName = packageName;
      next();
    }

    function open () {
      npmGet(packageName, usage.file, function (err, _, content) {
        if (err) throw err;

        var displayName = moduleName.replace(RegExp(path.sep, 'g'), '_');

        editor(content, displayName, function (err) {
          if (err && /non-zero exit code/.test(err.message)) {
            return process.exit();
          }
          if (err) {
            return die(err.toString());
          }
          next();
        });
      });
    }
  });

  moduleUsage(argv[0]).on('data', enqueue);
}(opts, opts._));


// Show prompt and call a callback depending on the user input.
function showPrompt (moduleName, callbacks) {
  prompt({
    type: 'expand',
    name: 'answer',
    message: 'Open ' + moduleName,
    choices: [{
      name: 'Open',
      value: 'open',
      key: 'o'
    }, {
      name: 'Quit',
      value: 'quit',
      key: 'q'
    }, {
      name: 'Skip this package',
      short: 'Skip package',  // Doesn't work as of 0.11.4.
      value: 'skipPackage',
      key: 's'
    }]
  }, function (a) {
    var callback = callbacks[a.answer];

    if (typeof callback != 'function') {
      throw Error('Unimplemented: ' + a.answer);
    }

    return callback();
  });
}
