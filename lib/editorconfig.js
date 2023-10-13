#! /usr/bin/env node

import * as fs from 'fs';
import { program } from 'commander';
import init from './commands/init-editorconfig.js';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

program
    .name('fashioncloud-editorconfig')
    .description('A CLI tool to setup EditorConfig')
    .version(packageJson.version);

program
    .command('init')
    .description('Initialize EditorConfig')
    .option('--dry-run', 'Run the command without making any changes', false)
    .action(init);

program.parse(process.argv);
