import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import logUpdate from 'log-update';
import cliSpinners from "cli-spinners";
import { promisify } from 'util';
import { exec } from 'child_process';

import TaskManager from '../utils/task-manager.js';

const init = async ({ dryRun }) => {
    // paths
    const templateName = 'tslint.json';
    const fromPath = new URL(`../templates/${templateName}`, import.meta.url);
    const toPath = path.join(process.cwd(), `./${templateName}`);

    // tasks definition
    const taskManager = new TaskManager({ dryRun, spinner: cliSpinners.boxBounce, logUpdate });

    const series = taskManager.createSeries({
        name: async () => {
            const existingEditorConfig = await promisify(fs.exists)(toPath);
            return existingEditorConfig ? 'Updating TSLint' : 'Initializing TSLint';
        },
        prefix: '[tslint]',
    });

    // running npm install before starting
    series.task({
        message: 'Running "npm install" before starting',
        fn: async () => {
            await promisify(exec)('npm install');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(tslint): run npm install"');
        }
    });

    // running tslint --fix on all files
    series.conditionalTask({
        message: 'Running "tslint --fix" on all files',
        conditionFn: async () => {
            return await promisify(fs.exists)(toPath);
        },
        fnWhenTrue: async () => {
            await promisify(exec)('tslint \'app/**/*.ts\' --fix');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(tslint): run tslint --fix"');
        },
        messageWhenFalse: 'No tslint configuration file found'
    });

    // updating or creating tslint configuration file
    const packages = ['tslint@5.20.1', 'tslint-eslint-rules', '@fashioncloud/tslint-config@1.2.0', 'tslint-config-prettier', 'prettier'];
    series.conditionalTask({
        message: async (conditionResult) => {
            return conditionResult ? `Updating ${packages.join(', ')} packages to the latest version` : `Installing ${packages.join(', ')} packages`;
        },
        conditionFn: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)('./package.json', 'utf8'));
            return packageJson.devDependencies.tslint;
        },
        fnWhenTrue: async () => {
            await promisify(exec)(`npm uninstall ${packages.join(' ')}`);
            await promisify(exec)(`npm install ${packages.join(' ')} --save-dev --force`);
            await promisify(exec)('git add .');
            await promisify(exec)(`git diff-index --quiet HEAD || git commit -m "style(tslint): update ${packages.join(', ')} packages"`);
        },
        fnWhenFalse: async () => {
            await promisify(exec)(`npm install ${packages.join(' ')} --save-dev --force`);
            await promisify(exec)('git add .');
            await promisify(exec)(`git diff-index --quiet HEAD || git commit -m "style(tslint): install ${packages.join(', ')} packages"`);
        }
    });

    // updating or creating tslint configuration file
    series.conditionalTask({
        message: async (conditionResult) => {
            return conditionResult ? 'Updating tslint configuration file' : 'Creating tslint configuration file';
        },
        conditionFn: async () => {
            return await promisify(fs.exists)(toPath);
        },
        fnWhenTrue: async () => {
            await promisify(fs.rm)(toPath);
            await promisify(fs.copyFile)(fromPath, toPath);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(tslint): update tslint configuration file"');
        },
        fnWhenFalse: async () => {
            await promisify(fs.copyFile)(fromPath, toPath);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(tslint): create tslint configuration file"');
        }
    });

    // updating or creating package.json scripts
    series.conditionalTask({
        message: async (conditionResult) => {
            return conditionResult ? 'Updating package.json scripts' : 'Creating package.json scripts';
        },
        conditionFn: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)('./package.json', 'utf8'));
            return packageJson.scripts.tslint;
        },
        fnWhenTrue: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)('./package.json', 'utf8'));
            packageJson.scripts.tslint = 'tslint \'app/**/*.ts\'';
            packageJson.scripts['tslint:fix'] = 'tslint \'app/**/*.ts\' --fix';
            await promisify(fs.writeFile)('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(tslint): update package.json scripts"');
        },
        fnWhenFalse: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)('./package.json', 'utf8'));
            packageJson.scripts.tslint = 'tslint \'app/**/*.ts\'';
            packageJson.scripts['tslint:fix'] = 'tslint \'app/**/*.ts\' --fix';
            await promisify(fs.writeFile)('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(tslint): create package.json scripts"');
        }
    });

    // running tslint --fix on all files
    series.task({
        message: 'Running "tslint --fix" on all files',
        fn: async () => {
            await promisify(exec)('tslint \'app/**/*.ts\' --fix');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(tslint): run tslint --fix"');
        }
    });

    // tasks execution
    await series.run();
}

export default init;
