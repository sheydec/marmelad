const PluginError = require('plugin-error');
const replaceExtension = require('replace-ext');
const nunjucks = require('nunjucks');
const through = require('through2');

const PLUGIN_NAME = 'gulp-nunjucks-a101';

class ComponentExtension {
  constructor(paths, ext = '.html', globals = {}) {
    this.tags = [
      'component',
      'cmp',
      'cpm',
    ];
    this._paths = paths;
    this._ext = ext;
    this._globals = globals;
  }

  parse(parser, nodes) {
    const TOKEN = parser.nextToken();
    const ARGS = parser.parseSignature(null, true);

    parser.advanceAfterBlockEnd(TOKEN.value);

    return new nodes.CallExtension(this, 'run', ARGS);
  }

  run(context, name, data) {
    Object.assign(this._globals, data);
    return nunjucks.render(`${this._paths}/${name}/${name}${this._ext}`, this._globals);
  }
}

function nunjucksBuild(opts) {
  return through.obj((file, enc, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError(PLUGIN_NAME, 'Streams are not supported'));
    }

    const options = Object.assign({
      autoescape: false,
      locals: {},
      searchPaths: [],
    }, opts);

    const str = file.contents.toString('utf8');
    const data = file.data ? file.data : {};
    const fm = file.frontMatter ? file.frontMatter : {};
    const context = Object.assign({}, options.locals, data, fm);

    const loader = new nunjucks.FileSystemLoader(options.searchPaths, {
      watch: false,
      noCache: false,
    });

    let env = new nunjucks.Environment(loader, (() => {
      const envOptions = {};
      ['autoescape', 'tags'].forEach((opt) => {
        if (Object.prototype.hasOwnProperty.call(options, opt)) {
          envOptions[opt] = options[opt];
        }
      });
      return envOptions;
    })());

    if (options.setUp && typeof options.setUp === 'function') {
      env = options.setUp(env);
    }

    // env.addExtension('component', new ComponentExtension(options.locals.settings.PATHS.blocks, options.ext, options.locals));

    env.renderString(str, context, (err, res) => {
      if (err) {
        return cb(new PluginError(PLUGIN_NAME, err));
      }

      file.contents = Buffer.from(res);

      if (options.ext) {
        file.path = replaceExtension(file.path, opts.ext);
      }

      cb(null, file);
    });
  });
}

module.exports = nunjucksBuild;
