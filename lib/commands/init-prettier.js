import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import logUpdate, { logUpdateStderr } from 'log-update';
import cliSpinners from "cli-spinners";
import { exec } from 'child_process';
import { promisify } from 'util';

const spinner = cliSpinners.boxBounce;
const frames = spinner.frames;
const interval = spinner.interval;

let spinnerInterval;
const logUpdateAnimated = (prefix, message) => {
    let i = 0;
    return setInterval(() => {
        logUpdate(`${prefix} ${frames[i++ % frames.length]} ${message}`);
    }, interval);
};

const init = async ({ dryRun }) => {
    if (dryRun) {
        console.log('Error: Dry run is not supported for this command');
        return;
    }

    const newPrettierJSFromPath = new URL(`../templates/.prettierrc.js`, import.meta.url);
    const newPrettierJsToPath = path.join(process.cwd(), `./.prettierrc.js`);

    const currentPrettierJsonPath = path.join(process.cwd(), `./.prettierrc.json`);

    const prettierIgnoreFromPath = new URL(`../templates/.prettierignore`, import.meta.url);
    const prettierIgnoreToPath = path.join(process.cwd(), './.prettierignore');

    const packageJsonPath = path.join(process.cwd(), './package.json');

    const existingPrettierJsonConfig = fs.existsSync(newPrettierJsToPath);
    if (existingPrettierJsonConfig) {
        logUpdate(`Reinitializing Prettier`);
        await promisify(fs.rm)(newPrettierJsToPath);
    } else {
        logUpdate(`Initializing Prettier`);
    }
    logUpdate.done();

    if (!await promisify(fs.exists)(packageJsonPath)) {
        logUpdateStderr('Error: package.json file not found');
        logUpdateStderr.done();
        return;
    }

    // run prettier --write on all files
    if (fs.existsSync(currentPrettierJsonPath)) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `[1/13] Running prettier --write on all files`);
        await promisify(exec)('npm run format:write');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ [1/13] Running prettier --write on all files, done.`);
        logUpdate.done();
    } else {
        logUpdate(`[prettier] - [1/13] Running prettier --write on all files, skipped. No prettier config file found.`);
        logUpdate.done();
    }

    // uninstall prettier
    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.devDependencies.prettier) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `[2/13] Uninstalling prettier`);
        await promisify(exec)('npm uninstall prettier');
        clearInterval(spinnerInterval);
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): remove prettier package"');
        logUpdate(`[prettier] ✓ [2/13] Uninstalling prettier, done.`);
        logUpdate.done();
    } else {
        logUpdate(`[prettier] - [2/13] Uninstalling prettier, skipped. No prettier package found.`);
        logUpdate.done();
    }

    // uninstall existing @types/prettier
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.devDependencies['@types/prettier']) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `[3/13] Uninstalling @types/prettier`);
        await promisify(exec)('npm uninstall @types/prettier');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): remove deprecated @types/prettier package"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ [3/13] Uninstalling @types/prettier, done.`);
        logUpdate.done();
    } else {
        logUpdate(`[prettier] - [3/13] Uninstalling @types/prettier, skipped. No @types/prettier package found.`);
        logUpdate.done();
    }



    // install prettier@3.0.3
    spinnerInterval = logUpdateAnimated(`[prettier]`, `[4/13] Installing prettier@3.0.3`);
    await promisify(exec)('npm install --save-dev prettier');
    await promisify(exec)('git add .');
    await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): upgrade prettier package to v3.0.3"');
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ [4/13] Installing prettier@3.0.3, done.`);
    logUpdate.done();

    // run prettier --write on all files
    if (fs.existsSync(currentPrettierJsonPath)) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `[5/13] Running prettier@3.0.3 --write on all files`);
        await promisify(exec)('npm run format:write');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after upgrade"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ [5/13] Running prettier@3.0.3 --write on all files, done.`);
        logUpdate.done();
    } else {
        logUpdate(`[prettier] - [5/13] Running prettier@3.0.3 --write on all files, skipped. No prettier config file found.`);
        logUpdate.done();
    }

    // install @fashioncloud/prettier-config
    spinnerInterval = logUpdateAnimated(`[prettier]`, `Installing @fashioncloud/prettier-config`);
    await promisify(exec)('npm install --save-dev @fashioncloud/prettier-config');
    await promisify(exec)('git add .');
    await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): add @fashioncloud/prettier-config package"');
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ Installing @fashioncloud/prettier-config, done.`);
    logUpdate.done();

    // replace prettier config file
    const existingPrettierJsonFile = await promisify(fs.exists)(currentPrettierJsonPath);
    spinnerInterval = logUpdateAnimated(`[prettier]`, `${existingPrettierJsonFile ? 'Updating' : 'Creating'} prettier configuration file`);
    if (existingPrettierJsonFile) {
        await promisify(fs.unlink)(currentPrettierJsonPath);
    }
    if (await promisify(fs.exists)(newPrettierJsToPath)) {
        await promisify(fs.unlink)(newPrettierJsToPath);
    }
    await promisify(fs.cp)(newPrettierJSFromPath, newPrettierJsToPath);
    await promisify(exec)('git add .');
    await promisify(exec)(`git diff-index --quiet HEAD || git commit -m "style(package.json): ${existingPrettierJsonFile ? 'update' : 'create'} prettier config"`);
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ ${existingPrettierJsonFile ? 'Updating' : 'Creating'} prettier configuration file, done.`);
    logUpdate.done();

    // update package.json scripts
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const existingFormatCheckScript = packageJson.scripts['format:check'];
    spinnerInterval = logUpdateAnimated(`[prettier]`, `${existingFormatCheckScript ? 'Updating' : 'Creating'} package.json scripts`);
    packageJson.scripts['format:check'] = 'prettier --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
    packageJson.scripts['format:write'] = 'prettier --write --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
    await promisify(fs.writeFile)('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
    await promisify(exec)('git add .');
    await promisify(exec)(`git diff-index --quiet HEAD || git commit -m "style(package.json): ${existingFormatCheckScript ? 'update' : 'create'} package.json scripts"`);
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ ${existingFormatCheckScript ? 'Updating' : 'Creating'} package.json scripts, done.`);
    logUpdate.done();

    // create prettier ignore file
    const existingPrettierIgnoreFile = await promisify(fs.exists)(prettierIgnoreToPath);
    spinnerInterval = logUpdateAnimated(`[prettier]`, `${existingPrettierIgnoreFile ? 'Updating' : 'Creating'} prettier ignore file`);
    if (existingPrettierIgnoreFile) {
        await promisify(fs.unlink)(prettierIgnoreToPath);
    }
    await promisify(fs.cp)(prettierIgnoreFromPath, prettierIgnoreToPath);
    await promisify(exec)('git add .');
    await promisify(exec)(`git diff-index --quiet HEAD || git commit -m "style(package.json): ${existingPrettierIgnoreFile ? 'update' : 'create'} prettier ignore file"`);
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ ${existingPrettierIgnoreFile ? 'Updating' : 'Creating'} prettier ignore file, done.`);
    logUpdate.done();

    // run prettier --write on all files
    spinnerInterval = logUpdateAnimated(`[prettier]`, `Running prettier --write on all files`);
    await promisify(exec)('npm run format:write');
    await promisify(exec)('git add .');
    await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after update"');
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ Running prettier --write on all files, done.`);
    logUpdate.done();

    // install husky and lint-staged
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.devDependencies.husky || !packageJson.devDependencies['lint-staged']) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `Installing husky and lint-staged`);
        await promisify(exec)('npm install --save-dev husky lint-staged');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): install husky and lint-staged"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ Installing husky and lint-staged, done.`);
        logUpdate.done();
    }

    // update package.json scripts
    spinnerInterval = logUpdateAnimated(`[prettier]`, `Initializing husky and lint-staged`);
    packageJson = JSON.parse(await promisify(fs.readFile)(packageJsonPath, 'utf8'));
    packageJson.scripts['prepare'] = 'husky install';
    packageJson['lint-staged'] = {
        'app/**/*.ts': 'prettier --write --config ./.prettierrc.js',
        'tests/**/*.ts': 'prettier --write --config ./.prettierrc.js'
    }
    await promisify(fs.writeFile)('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
    await promisify(exec)('npm run prepare');
    await promisify(exec)('git add .');
    await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): initialize husky and lint-staged"');
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ Initializing husky and lint-staged, done.`);
    logUpdate.done();

    // create pre-commit hook
    if (!await promisify(fs.exists)('./.husky/pre-commit')) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `Creating pre-commit hook`);
        await promisify(exec)('npx husky add .husky/pre-commit "npx lint-staged"');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): create pre-commit hook"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ Creating pre-commit hook, done.`);
        logUpdate.done();
    }

    logUpdate(`Prettier initialized done.`);
    logUpdate.done();
}

export default init;
