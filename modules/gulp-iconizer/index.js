/*
 * gulp-iconizer
 * Licensed under the MIT license.
 */

const fs = require('fs');
const through = require('through2');
const gutil = require('gulp-util');

/**
 * Оборачивает SVG иконку в блок с классом для анимации вращения
 *
 * @param {string} html HTML код SVG иконки
 * @param {string} classes список CSS классов
 * @returns {string} HTML код
 */
function wrapSpinner(html, classes, opts) {
  if (classes.indexOf('spinner') > -1) {
    return `<${opts.tag} class="svg-icon${opts._beml.elemPrefix}spinner">${html}</${opts.tag}>`;
  }

  return html;
}

/**
 * Возвращает подготовленный HTML код иконки
 *
 * @param {string} name название иконки
 * @param {Object} opts опции для иконки
 * @returns {string} HTML код
 */
function icon(name, opts) {
  const size = opts.size ? `svg-icon${opts._beml.modPrefix}${opts.size}` : '';
  const classes = `svg-icon svg-icon${opts._beml.modPrefix}${name} ${size} ${opts.class}`.trim();
  const iconHtml = `<svg class="svg-icon${opts._beml.elemPrefix}link"><use xlink:href="#${name}" /></svg>`;

  return `<${opts.tag} class="${classes}">${wrapSpinner(iconHtml, classes, opts)}</${opts.tag}>`;
}


/**
 * Возвращает объект параметров полученный из строки с атрибутами иконки
 *
 * @param {string} attrs атрибуты иконки
 * @returns {Object} объект полученный из строки с атрибутами иконки
 */
function buildParamsFromAttrs(attrs) {
  const params = {
    tag: 'div',
    class: '',
  };
  const attrsRegexp = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/gi;
  const match = attrs.match(attrsRegexp);

  let attr = null;
  let value = null;

  if (match) {
    match.forEach((param) => {
      [attr, value] = param.split('=');
      params[attr] = value.replace(/'|"/g, '');
    });
  }

  return params;
}

/**
 * Замена шаблонов иконок на HTML код
 *
 * @param {string} source HTML код с шаблоками иконок
 * @returns {string} HTML c уже обработанными шаблонами иконок
 */
function replaceIconTags(source, opts) {
  // TODO: тут с регекспами надо поработать
  const iconRegexp = /<icon\s+([-=\w\d\c{}'"\s]+)\s*\/?>|<\/icon>/gi;
  const iconsInHtml = source.match(iconRegexp);

  let html = source;
  let params = {};

  if (iconsInHtml) {
    iconsInHtml.forEach((iconSource) => {
      params = buildParamsFromAttrs(iconSource.match(/\s(\w+?)="(.+?)*"/gi)[0]);

      Object.assign(params, opts);

      html = html.replace(iconSource, icon(params.name, params));
    });
  }

  return html;
}


/**
 * Возвращает текст c уже обработанными шаблонами иконок
 *
 * @param {string} src текст с шаблонами иконок
 * @param {Object} options опции модуля
 */
function iconizeHtml(src, opts) {
  let sprite = fs.readFileSync(opts.path).toString();
  let html = src.toString();

  if (html.indexOf(sprite) === -1) {
    sprite = sprite.replace(/\n/g, '');
    sprite = sprite.replace(/<defs[\s\S]*?\/defs><path[\s\S]*?\s+?d=/g, '<path d=');
    sprite = sprite.replace(/<style[\s\S]*?\/style><path[\s\S]*?\s+?d=/g, '<path d=');
    sprite = sprite.replace(/\sfill[\s\S]*?(['"])[\s\S]*?\1/g, '');
    sprite = sprite.replace(/(['"])[\s\S]*?\1/, match => `${match}class="app-svg-sprite"`);
    html = html.replace(/<body.*?>/, match => `${match}\n\n${sprite}\n`);
  }

  return replaceIconTags(html, opts);
}

/**
 * Превращаем шаблоны иконок в HTML код :)
 */
module.exports = function iconizer(opts) {
  return through.obj(function obj(file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('gulp-iconizer', 'Streaming not supported'));
      return;
    }

    try {
      file.contents = Buffer.from(iconizeHtml(file.contents, opts));
      this.push(file);
    } catch (err) {
      this.emit('error', new gutil.PluginError('gulp-iconizer', err));
    }

    cb();
  });
};
