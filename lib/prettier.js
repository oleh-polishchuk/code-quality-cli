#! /usr/bin/env node

import * as fs from 'fs';
import { program } from 'commander';
import init from './commands/init-prettier.js';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

program
    .name('fashioncloud-prettier')
    .description('A CLI tool to setup Prettier')
    .version(packageJson.version);

program
    .command('init')
    .description('Initialize Prettier')
    .option('--dry-run', 'Run the command without making any changes', false)
    .action(init);

program.parse(process.argv);
