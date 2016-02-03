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
    showPrompt = function (next) { next() };
  }

  var enqueue = Queue(function (usage, next) {
    console.log('Opening %s...', usage.dependant);

    npmGet(usage.dependant, usage.file, function (err, _, content) {
      if (err) throw err;

      var displayName = path.join(usage.dependant, usage.file)
            .replace(RegExp(path.sep, 'g'), '|');

      editor(content, displayName, function (err) {
        if (err && /non-zero exit code/.test(err.message)) return;
        if (err) return die(err.toString());

        showPrompt(next);
      });
    });
  });

  moduleUsage(argv[0]).on('data', enqueue);
}(opts, opts._));


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
