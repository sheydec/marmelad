const path = require('path');

const folders = {
  dist: 'static',
  storage: '',
  marmelad: 'marmelad',
  _blocks: '_blocks',
  _pages: '_pages',
  iconizer: {
    src: 'iconizer',
    icons: 'icons',
  },
  js: {
    src: 'js',
    vendors: 'vendors',
    plugins: 'plugins',
  },
  stylus: 'stylus',
  static: 'static',
};

const paths = {
  dist: path.join(folders.dist),
  storage: path.join(folders.dist, folders.storage),
  marmelad: path.join(folders.marmelad),
  _blocks: path.join(folders.marmelad, folders._blocks),
  _pages: path.join(folders.marmelad, folders._pages),
  iconizer: {
    src: path.join(folders.marmelad, folders.iconizer.src),
    icons: path.join(folders.marmelad, folders.iconizer.src, folders.iconizer.icons),
  },
  js: {
    src: path.join(folders.marmelad, folders.js.src),
    vendors: path.join(folders.marmelad, folders.js.src, folders.js.vendors),
    plugins: path.join(folders.marmelad, folders.js.src, folders.js.plugins),
  },
  stylus: path.join(folders.marmelad, folders.stylus),
  static: path.join(folders.marmelad, folders.static),
};


const app = {
  cssnano: {
    zIndex: false,
  },
  beml: {
    elemPrefix: '__',
    modPrefix: '--',
    modDlmtr: '-',
  },
  formatHtml: {
    unformatted: ['code', 'pre', 'em', 'strong', 'span', 'svg'],
    indent_inner_html: true,
    indent_char: ' ',
    indent_size: 2,
    sep: '\n',
    ocd: true,
  },
  autoprefixer: {
    browsers: [
      'Chrome >= 45',
      'Firefox ESR',
      'Edge >= 12',
      'Explorer >= 10',
      'iOS >= 9',
      'Safari >= 9',
      'Android >= 4.4',
      'Opera >= 30',
    ],
  },
  bsSP: {
    server: {
      baseDir: paths.dist,
    },
    port: 8967,
    open: false,
    directory: true,
    ghostMode: false,
    notify: true,
    logLevel: 'info',
    logPrefix: 'MARMELAD STATIC',
    logFileChanges: false,
    ui: false,
  },
  svgSprite: {
    mode: {
      symbol: { // symbol mode to build the SVG
        dest: paths.iconizer.src, // destination folder
        sprite: 'sprite.svg', // sprite name
        example: false, // Build sample page
      },
    },
    svg: {
      xmlDeclaration: false, // strip out the XML attribute
      doctypeDeclaration: false, // don't include the !DOCTYPE declaration
    },
  }
};

const bootstrap = {
  use: true,
  opts: {
    code: '4.0.0-beta.2',
    src: {
      scss: path.join(paths.marmelad, 'bootstrap', '4.0.0-beta.2', 'scss'),
      js: path.join(paths.marmelad, 'bootstrap', '4.0.0-beta.2', 'js'),
    },
    dest: {
      css: path.join(paths.storage, 'bootstrap', 'css'),
      js: path.join(paths.storage, 'bootstrap', 'js'),
    },
    sass: {
      precision: 6,
      outputStyle: 'expanded',
    },
    autoprefixer: {
      browsers: [
        "Chrome >= 45",
        "Firefox ESR",
        "Edge >= 12",
        "Explorer >= 10",
        "iOS >= 9",
        "Safari >= 9",
        "Android >= 4.4",
        "Opera >= 30"
      ],
    },
  },
};

module.exports = {
  folders,
  app,
  paths,
  bootstrap
};
