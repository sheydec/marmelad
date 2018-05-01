# 🍇 marmelad

> Сборщик статичных сайтов на базе Gulp

## Содержание

- [Подготовка / Установка](#-Подготовка-Установка)
  - [ПО](#ПО)
  - [.editorconfig](#editorconfig)
  - [Установка gulp4](#Установка-gulp4)
- [Для Староверов](#Для-Староверов)
- [Шаблоны](#Шаблоны)

## 🍳 Подготовка / Установка

### ПО

- NodeJS не ниже `8.9.1`
- Gulp CLI не ниже `2.0.0` (необходим для работы с [gulp 4](#Установка-gulp4))
- Прямые руки и светлые мысли 😆

### .editorconfig

Плагины для поддержки `.editorconfig`:

- Sublime Text 3 [editorconfig-sublime](https://github.com/sindresorhus/editorconfig-sublime)
- VSCode [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

*актуально и для разработки `marmelad`*

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

## Шаблоны

- [Nunjucks](https://mozilla.github.io/nunjucks/)
- posthtml-[bem](https://github.com/rajdee/posthtml-bem/#modifiers)
- posthtml-[postcss](https://github.com/posthtml/posthtml-postcss)
- Фильтр [limitTo](https://gist.github.com/yunusga/1c5236331ddb6caa41a2a71928ac408a)

## Для Староверов

Новые версии `marmelad` можно тестировать не устанавливая его глобально, т.е. не ломая привычный уклад работы :)

### Для этого необходимо

- Клонировать `marmelad` в абсолютно любую папку на ПК
- Переключится на нужную ветку, коммит или тег
- Установить все зависимости
- Запустить его в тестовой папке

#### Пример

Находясь в тестовой (`E:\user\marmelad\test>`) папке необходимо запустить локально установленный `marmelad` указав путь до него

```bash
../bin/marmelad.js

   ╔══════════════════════════════════╗
   ║                                  ║
   ║   MARMELAD v4.13.5 is Started!   ║
   ║                                  ║
   ╚══════════════════════════════════╝

```

> И, о Да, он работает :)

Иконки от автора [Dimitry Miroliubov](https://www.flaticon.com/authors/dimitry-miroliubov)

## Roadmap

- `stylus` Добавить миксин для перекрашивания инлайновых SVG иконок
