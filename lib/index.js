#! /usr/bin/env node

const program = require('commander');

const { version } = require('../package.json');

program
    .name('code-quality-cli')
    .description('CLI tool for Linter, Prettier, and EditorConfig initialization')
    .version(version);

program
    .command('setup')
    .description('Setup Linter, Prettier, and EditorConfig configuration files')
    .option('--tslint', 'Setup TSLint configuration file')
    .option('--prettier', 'Setup Prettier configuration file')
    .option('--editorconfig', 'Setup EditorConfig configuration file')
    .option('--dry-run', 'Run the command without making any changes')
    .action(require('../lib/commands/init'));

program.parse(process.argv);
