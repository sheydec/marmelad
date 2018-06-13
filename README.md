# 🍇 marmelad-A101

[a101-badge]:                 https://img.shields.io/badge/marmelad-a101-blue.svg
[postcss-momentum-scrolling]: https://www.npmjs.com/package/postcss-momentum-scrolling
[postcss-easing-gradients]:   https://www.npmjs.com/package/postcss-easing-gradients
[postcss-focus]:              https://www.npmjs.com/package/postcss-focus
[postcss-flexbugs-fixes]:     https://www.npmjs.com/package/postcss-flexbugs-fixes
[postcss-inline-svg]:         https://www.npmjs.com/package/postcss-inline-svg
[postcss-preset-env]:         https://www.npmjs.com/package/postcss-preset-env

![Dev Status][a101-badge]

Сборщик статичных сайтов на базе Gulp

## Внимание a101

Это тестовая ветка сборщика проектов. Для удобства разработки и непрерывности рабочих процессов на старой версии, название и алиас для командной строки переименованы в кодовое имя `a101`

### Установка a101

Для установки необходимо клонировать репозиторий в собственную папку. Для удобства можно установить сборщик рядом с **marmelad**, но в папку с другим названием

```shell
git clone https://gitlab.com/tazau/marmelad.git marmelad-a101
cd marmelad-a101
git checkout develop
npm i && npm link
```

Сборщик установится в системе под названием `a101`. Далее можно эксперементировать и не бояться сломать рабочую версию сборщика **marmelad** (из `master` ветки).

## Содержание

- [Подготовка / Установка](#-Подготовка-Установка)
  - [ПО](#ПО)
  - [.editorconfig](#editorconfig)
  - [Установка gulp4](#Установка-gulp4)
- [Шаблонизатор](#Шаблонизатор)

## 🍳 Подготовка / Установка

### ПО

- NodeJS не ниже `8.9.1`
- Gulp CLI не ниже `2.0.0` (необходим для работы с [gulp 4](#Установка-gulp4))
- Прямые руки и светлые мысли 😆

### .editorconfig

Плагины для поддержки `.editorconfig`:

- Sublime Text 3 [editorconfig-sublime](https://github.com/sindresorhus/editorconfig-sublime)
- VSCode [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

### Установка gulp4

Перед установкой необходимо проверить версию `Gulp CLI`, небходима версия не ниже `2.0.0`

```shell
gulp -v
[13:25:58] CLI version 2.0.1
```

В случае если выводится версия `3.9.1` или ниже, то необходимо переустановить `gulp` глобально

```shell
npm rm -g gulp
npm install -g gulp-cli
gulp -v
[13:25:58] CLI version 2.0.1
```

## Подготовка

### .editorconfig

Для поддержки редактором `.editorconfig` необходимо установить плагины:

- Sublime Text 3 [editorconfig-sublime](https://github.com/sindresorhus/editorconfig-sublime)
- VSCode [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

*актуально и для разработки самого `marmelad`*

## Шаблонизатор

Официальная документация [nunjucks](https://mozilla.github.io/nunjucks/).

- [Nunjucks](https://mozilla.github.io/nunjucks/)
- posthtml-[bem](https://github.com/rajdee/posthtml-bem/#modifiers)
- posthtml-[postcss](https://github.com/posthtml/posthtml-postcss)
- Фильтр [limitTo](https://gist.github.com/yunusga/1c5236331ddb6caa41a2a71928ac408a)

## Создание проекта

Есть два способа создания проекта

- `a101 init` - установится в текущую папку
- `a101 init new-project` - установится в папку `new-project`

## Стили

Сбощик поддерживает работу с `sass`, `scss`, `stylus`, `less`

### Плагины PostCSS

- [postcss-focus]
- [postcss-flexbugs-fixes]
- [postcss-momentum-scrolling]
- [postcss-easing-gradients]
- [postcss-inline-svg]
- [postcss-preset-env]
