// Generated by CoffeeScript 1.7.1
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = function(BasePlugin) {
    var SassPlugin, TaskGroup, fs, safeps;
    safeps = require('safeps');
    fs = require('fs');
    TaskGroup = require('taskgroup').TaskGroup;
    return SassPlugin = (function(_super) {
      __extends(SassPlugin, _super);

      function SassPlugin() {
        return SassPlugin.__super__.constructor.apply(this, arguments);
      }

      SassPlugin.prototype.name = 'sass';

      SassPlugin.prototype.config = {
        sassPath: null,
        scssPath: null,
        compass: null,
        debugInfo: false,
        sourcemap: false,
        outputStyle: 'compressed',
        requireLibraries: null,
        renderUnderscoreStylesheets: false,
        environments: {
          development: {
            outputStyle: 'expanded'
          }
        }
      };

      SassPlugin.prototype.locale = {
        sassNotInstalled: 'SASS does not appear to be available on your system',
        scssNotInstalled: 'SCSS does not appear to be available on your system'
      };

      SassPlugin.prototype.generateBefore = function(opts, next) {
        var config, tasks;
        config = this.config;
        tasks = new TaskGroup().setConfig({
          concurrency: 0
        }).once('complete', next);
        if (config.compass == null) {
          tasks.addTask(function(complete) {
            return safeps.getExecPath('compass', function(err, path) {
              config.compass = path != null;
              return complete();
            });
          });
        }
        ['sass', 'scss'].forEach(function(thing) {
          if (config[thing + 'Path'] == null) {
            return tasks.addTask(function(complete) {
              return safeps.getExecPath(thing, function(err, path) {
                config[thing + 'Path'] = path != null ? path : false;
                return complete();
              });
            });
          }
        });
        return tasks.run();
      };

      SassPlugin.prototype.extendCollections = function(opts) {
        var config, docpad;
        config = this.config;
        docpad = this.docpad;
        if (config.renderUnderscoreStylesheets === false) {
          this.underscoreStylesheets = docpad.getDatabase().findAllLive({
            filename: /^_(.*?)\.(?:scss|sass)/
          });
          return this.underscoreStylesheets.on('add', function(model) {
            return model.set({
              render: false,
              write: false
            });
          });
        }
      };

      SassPlugin.prototype.render = function(opts, next) {
        var command, commandOpts, config, execPath, file, fullDirPath, inExtension, locale, name, outExtension, _i, _len, _ref;
        config = this.config;
        locale = this.locale;
        inExtension = opts.inExtension, outExtension = opts.outExtension, file = opts.file;
        if ((inExtension === 'sass' || inExtension === 'scss') && (outExtension === 'css' || outExtension === null)) {
          fullDirPath = file.get('fullDirPath');
          commandOpts = {};
          execPath = config[inExtension + 'Path'];
          if (!execPath) {
            return next(new Error(locale[inExtension + 'NotInstalled']));
          }
          if (opts.content.indexOf('@import') !== -1) {
            file.setMetaDefaults({
              'referencesOthers': true
            });
          }
          command = [].concat(execPath);
          if (config.sourcemap) {
            command.push("" + file.attributes.fullPath + ":" + file.attributes.outPath, '--no-cache', '--update', '--sourcemap');
          } else {
            command.push('--no-cache', '--stdin');
            commandOpts.stdin = opts.content;
          }
          if (fullDirPath) {
            command.push('--load-path');
            command.push(fullDirPath);
          }
          if (config.compass) {
            command.push('--compass');
          }
          if (config.debugInfo) {
            command.push('--debug-info');
          }
          if (config.outputStyle) {
            command.push('--style');
            command.push(config.outputStyle);
          }
          if (config.requireLibraries) {
            _ref = config.requireLibraries;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              name = _ref[_i];
              command.push('--require');
              command.push(name);
            }
          }
          return safeps.spawn(command, commandOpts, function(err, stdout, stderr, code, signal) {
            if (err) {
              return next(err);
            }
            if (config.sourcemap) {
              opts.content = fs.readFileSync(file.attributes.outPath).toString();
            } else {
              opts.content = stdout;
            }
            return next();
          });
        } else {
          return next();
        }
      };

      return SassPlugin;

    })(BasePlugin);
  };

}).call(this);