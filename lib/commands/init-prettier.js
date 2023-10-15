import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import logUpdate, { logUpdateStderr } from 'log-update';
import cliSpinners from "cli-spinners";
import { exec } from 'child_process';
import { promisify } from 'util';
import TaskManager from "../utils/task-manager.js";

const init = async ({ dryRun }) => {
    // paths
    const newPrettierJSFromPath = new URL(`../templates/.prettierrc.js`, import.meta.url);
    const newPrettierJsToPath = path.join(process.cwd(), `./.prettierrc.js`);

    const currentPrettierJsonPath = path.join(process.cwd(), `./.prettierrc.json`);

    const prettierIgnoreFromPath = new URL(`../templates/.prettierignore`, import.meta.url);
    const prettierIgnoreToPath = path.join(process.cwd(), './.prettierignore');

    const packageJsonPath = path.join(process.cwd(), './package.json');

    // validation
    if (!await promisify(fs.exists)(packageJsonPath)) {
        logUpdateStderr('Error: package.json file not found');
        logUpdateStderr.done();
        return;
    }

    // task definition
    const taskManager = new TaskManager({
        dryRun: dryRun,
        spinner: cliSpinners.boxBounce,
        logUpdate: logUpdate,
    });

    const series = taskManager.createSeries({
        name: async () => {
            const existingPrettierConfig = await promisify(fs.exists)(newPrettierJsToPath) || await promisify(fs.exists)(currentPrettierJsonPath);
            return existingPrettierConfig ? 'Updating Prettier' : 'Initializing Prettier';
        },
        prefix: '[prettier]',
    });

    series.conditionalTask({
        message: 'Running prettier --write on all files',
        conditionFn: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            return packageJson.devDependencies.prettier && (
                await promisify(fs.exists)(currentPrettierJsonPath) ||
                await promisify(fs.exists)(newPrettierJsToPath)
            );
        },
        fnWhenTrue: async () => {
            await promisify(exec)('npm run format:write');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules"');
        },
        messageWhenFalse: 'Neither .prettierrc.js nor .prettierrc.json files were found',
    });

    series.conditionalTask({
        message: 'Uninstalling existing prettier',
        conditionFn: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            return packageJson.devDependencies.prettier;
        },
        fnWhenTrue: async () => {
            await promisify(exec)('npm uninstall prettier');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): remove prettier package"');
        },
        messageWhenFalse: 'No prettier package found',
    });

    series.conditionalTask({
        message: 'Uninstalling @types/prettier',
        conditionFn: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            return packageJson.devDependencies['@types/prettier'];
        },
        fnWhenTrue: async () => {
            await promisify(exec)('npm uninstall @types/prettier');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): remove deprecated @types/prettier package"');
        },
        messageWhenFalse: 'No @types/prettier package found',
    });

    series.task({
        message: 'Installing prettier@3.0.3',
        fn: async () => {
            await promisify(exec)('npm install --save-dev prettier');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): upgrade prettier package to v3.0.3"');
        }
    });

    series.conditionalTask({
        message: 'Running prettier@3.0.3 --write on all files',
        conditionFn: async () => {
            return promisify(fs.exists)(currentPrettierJsonPath);
        },
        fnWhenTrue: async () => {
            await promisify(exec)('npm run format:write');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after upgrade"');
        },
        messageWhenFalse: 'No prettier config file found',
    });

    series.task({
        message: 'Installing @fashioncloud/prettier-config',
        fn: async () => {
            await promisify(exec)('npm install --save-dev @fashioncloud/prettier-config');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): add @fashioncloud/prettier-config package"');
        }
    });

    series.conditionalTask({
        message: 'Deleting existing .prettierrc.json configuration file',
        conditionFn: async () => {
            return promisify(fs.exists)(currentPrettierJsonPath);
        },
        fnWhenTrue: async () => {
            await promisify(fs.unlink)(currentPrettierJsonPath);
        }
    });

    series.conditionalTask({
        message: 'Deleting existing .prettierrc.js configuration file',
        conditionFn: async () => {
            return promisify(fs.exists)(newPrettierJsToPath);
        },
        fnWhenTrue: async () => {
            await promisify(fs.unlink)(newPrettierJsToPath);
        }
    });

    series.task({
        message: 'Creating .prettierrc.js configuration file',
        fn: async () => {
            await promisify(fs.cp)(newPrettierJSFromPath, newPrettierJsToPath);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): create prettier config"');
        }
    });

    series.conditionalTask({
        message: async (conditionResult) => {
            return conditionResult ? 'Updating package.json scripts' : 'Creating package.json scripts';
        },
        conditionFn: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            return packageJson.scripts['format:check'];
        },
        fnWhenTrue: async () => {
            let packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            packageJson.scripts['format:check'] = 'prettier --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
            packageJson.scripts['format:write'] = 'prettier --write --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
            await promisify(fs.writeFile)('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): update package.json scripts"');
        },
        fnWhenFalse: async () => {
            let packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            packageJson.scripts['format:check'] = 'prettier --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
            packageJson.scripts['format:write'] = 'prettier --write --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
            await promisify(fs.writeFile)('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): create package.json scripts"');
        }
    })

    series.conditionalTask({
        message: async (conditionResult) => {
            return conditionResult ? 'Updating prettier ignore file' : 'Creating prettier ignore file';
        },
        conditionFn: async () => {
            return promisify(fs.exists)(prettierIgnoreToPath);
        },
        fnWhenTrue: async () => {
            await promisify(fs.unlink)(prettierIgnoreToPath);
            await promisify(fs.cp)(prettierIgnoreFromPath, prettierIgnoreToPath);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): update prettier ignore file"');
        },
        fnWhenFalse: async () => {
            await promisify(fs.cp)(prettierIgnoreFromPath, prettierIgnoreToPath);
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): create prettier ignore file"');
        }
    });

    series.task({
        message: 'Running prettier --write on all files',
        fn: async () => {
            await promisify(exec)('npm run format:write');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after update"');
        }
    });

    series.conditionalTask({
        message: 'Installing husky and lint-staged',
        conditionFn: async () => {
            const packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            return !packageJson.devDependencies.husky || !packageJson.devDependencies['lint-staged'];
        },
        fnWhenTrue: async () => {
            await promisify(exec)('npm install --save-dev husky lint-staged');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): install husky and lint-staged"');
        }
    });

    series.task({
        message: 'Initializing husky and lint-staged',
        fn: async () => {
            let packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
            packageJson.scripts['prepare'] = 'husky install';
            packageJson['lint-staged'] = {
                'app/**/*.ts': 'prettier --write --config ./.prettierrc.js',
                'tests/**/*.ts': 'prettier --write --config ./.prettierrc.js'
            }
            await promisify(fs.writeFile)('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
            await promisify(exec)('npm run prepare');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): initialize husky and lint-staged"');
        }
    });

    series.conditionalTask({
        message: 'Creating pre-commit hook',
        conditionFn: async () => {
            return !await promisify(fs.exists)('./.husky/pre-commit');
        },
        fnWhenTrue: async () => {
            await promisify(exec)('npx husky add .husky/pre-commit "npx lint-staged"');
            await promisify(exec)('git add .');
            await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): create pre-commit hook"');
        },
        messageWhenFalse: 'Pre-commit hook already exists'
    });

    // task execution
    await series.run();
}

export default init;
