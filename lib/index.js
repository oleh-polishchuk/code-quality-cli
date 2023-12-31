#! /usr/bin/env node

import * as fs from 'fs';
import { program } from 'commander';
import init from './commands/init.js';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

program
    .name('fashioncloud-code-quality')
    .description('A CLI tool for Prettier and EditorConfig initialization')
    .version(packageJson.version);

program
    .command('init')
    .description('Initialize Prettier and EditorConfigo')
    .option('--dry-run', 'Run the command without making any changes', false)
    .action(init);

program.parse(process.argv);
