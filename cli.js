#!/usr/bin/env node
'use strict';

var moduleUsage = require('module-usage'),
    npmGet = require('npm-get'),
    editor = require('string-editor'),
    prompt = require('inquirer').prompt,
    Queue = require('push-queue'),
    App = require('help-version');

var path = require('path');


var app = App([
  'Usage:  module-users <pkgname>',
  '',
  'Scans npm registry for modules depending on <pkgname> and opens them in',
  '$EDITOR.'
].join('\n'));


(function main (argv) {
  if (argv.length != 1) {
    return app.help(1);
  }

  var enqueue = Queue(function (usage, next) {
    console.log('Opening %s...', usage.dependant);

    npmGet(usage.dependant, usage.file, function (err, _, content) {
      if (err) throw err;

      var displayName = path.join(usage.dependant, usage.file)
            .replace(RegExp(path.sep, 'g'), '|');

      editor(content, displayName, function (err) {
        if (err) throw err;
        showPrompt(next);
      });
    });
  });

  moduleUsage(argv[0]).on('data', enqueue);
}(process.argv.slice(2)));


function showPrompt (next) {
  prompt({
    type: 'confirm',
    name: 'answer',
    message: 'Show next module',
    default: true
  }, function (a) {
    if (a.answer) {
      next();
    }
  });
}
