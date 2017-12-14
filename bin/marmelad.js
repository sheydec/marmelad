#!/usr/bin/env node

const PKG = require('../package.json');
const CLI = require('commander');


/**
 * Установка флагов/параметров для командной строки
 */
CLI
  .version(PKG.version)
  .description(PKG.description)
  .on('--help', () => {
    console.log('\n  Examples:');
    console.log();
    console.log('    $ marmelad [command] --help');
    console.log('    $ mmd [command] --help');
    console.log();
  });


// инициализация нового проекта
CLI
  .command('init')
  .description('Initialize new project')
  .action(() => {
    require('../commands/init');
  })
  .on('--help', () => {
    console.log();
  });


// старт сервера разработки
CLI
  .command('dev')
  .description('Run development server')
  .option('-a, --auth [user@password]', 'set user@password for authorization')
  .option('-c, --clipboard', 'copy server URL to clipboard on startup')
  .option('-o, --open [browser]', 'Open browser on startup')
  .action((dev) => {
    require('../modules/tci').run();
    require('../commands/dev');
  })
  .on('--help', () => {
    console.log();
  });


// релизная сборка проекта (минификация, линтеры, статика)
CLI
  .command('build')
  .description('Build production version of project')
  .on('--help', () => {
    console.log();
  });


// создание страницы
CLI
  .command('cp <name>')
  .description('Create new page')
  .action((pageName) => {
    require('../commands/cp')(pageName);
  })
  .on('--help', () => {
    console.log();
  });


// создание блока
CLI
  .command('cb <name>')
  .description('Create new block')
  .option('-t, --techs [html,js,styl]', 'Files exxtensions for new block', 'html,js,styl')
  .action((pageName, opts) => {
    require('../commands/cb')(pageName, opts.techs);
  })
  .on('--help', () => {
    console.log();
  });


// парсим аргументы командной строки (старт модуля)
CLI.parse(process.argv);

if (!CLI.args.length) {
  CLI.help();
}
