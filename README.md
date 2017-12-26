# marmelad <sup>[4.13.5](https://github.com/yunusga/marmelad/blob/master/CHANGELOG.md#4135-21092017)</sup>

[![GitHub tag](https://img.shields.io/github/tag/yunusga/marmelad.svg)](https://github.com/yunusga/marmelad/releases/tag/v4.13.5) [![license](https://img.shields.io/github/license/yunusga/marmelad.svg)](https://github.com/yunusga/marmelad/blob/master/LICENSE)

> Сборщик статичных сайтов на базе Gulp

## Содержание

- [Подготовка](#Подготовка)
- [Для Староверов](#Для-Староверов)
- [Шаблоны](#Шаблоны)

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
