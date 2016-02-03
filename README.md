[![npm](https://nodei.co/npm/module-users.png)](https://npmjs.com/package/module-users)

# module-users

[![Dependency Status][david-badge]][david]

> See how a module is used in npm.

This is a small wrapper around [module-usage] that shows its findings in $EDITOR. Explore dependent modules with more context.

[module-usage]: https://github.com/juliangruber/module-usage

[david]: https://david-dm.org/eush77/module-users
[david-badge]: https://david-dm.org/eush77/module-users.png

## CLI

```
$ module-users <pkgname>
```

Scans npm registry for modules that depend on `<pkgname>` and downloads and opens them in $EDITOR, one after another.

## Install

```
npm install module-users
```

## License

MIT
