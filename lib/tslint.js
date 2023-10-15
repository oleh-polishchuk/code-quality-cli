#! /usr/bin/env node

import * as fs from 'fs';
import { program } from 'commander';
import init from './commands/init-tslint.js';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

program
    .name('fashioncloud-tslint')
    .description('A CLI tool to setup TSLint')
    .version(packageJson.version);

program
    .command('init')
    .description('Initialize TSLint')
    .option('--dry-run', 'Run the command without making any changes')
    .action(init);

program.parse(process.argv);
