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
        spinnerInterval = logUpdateAnimated(`[prettier]`, `Running prettier --write on all files`);
        await promisify(exec)('npm run format:write');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ Running prettier --write on all files, done.`);
        logUpdate.done();
    }

    // uninstall prettier
    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.devDependencies.prettier) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `Uninstalling prettier`);
        await promisify(exec)('npm uninstall prettier');
        clearInterval(spinnerInterval);
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): remove prettier package"');
        logUpdate(`[prettier] ✓ Uninstalling prettier, done.`);
        logUpdate.done();
    }

    // uninstall existing @types/prettier
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.devDependencies['@types/prettier']) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `Uninstalling @types/prettier`);
        await promisify(exec)('npm uninstall @types/prettier');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): remove deprecated @types/prettier package"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ Uninstalling @types/prettier, done.`);
        logUpdate.done();
    }

    // install prettier@3.0.3
    spinnerInterval = logUpdateAnimated(`[prettier]`, `Installing prettier@3.0.3`);
    await promisify(exec)('npm install --save-dev prettier');
    await promisify(exec)('git add .');
    await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): upgrade prettier package to v3.0.3"');
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ Installing prettier@3.0.3, done.`);
    logUpdate.done();

    // run prettier --write on all files
    if (fs.existsSync(currentPrettierJsonPath)) {
        spinnerInterval = logUpdateAnimated(`[prettier]`, `Running prettier@3.0.3 --write on all files`);
        await promisify(exec)('npm run format:write');
        await promisify(exec)('git add .');
        await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after upgrade"');
        clearInterval(spinnerInterval);
        logUpdate(`[prettier] ✓ Running prettier@3.0.3 --write on all files, done.`);
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
    spinnerInterval = logUpdateAnimated(`[prettier]`, `Creating prettier configuration file`);
    if (await promisify(fs.exists)(currentPrettierJsonPath)) {
        await promisify(fs.unlink)(currentPrettierJsonPath);
    }
    if (await promisify(fs.exists)(newPrettierJsToPath)) {
        await promisify(fs.unlink)(newPrettierJsToPath);
    }
    await promisify(fs.cp)(newPrettierJSFromPath, newPrettierJsToPath);
    await promisify(exec)('git add .');
    await promisify(exec)('git diff-index --quiet HEAD || git commit -m "style(package.json): update prettier config"');
    clearInterval(spinnerInterval);
    logUpdate(`[prettier] ✓ Creating prettier configuration file, done.`);
    logUpdate.done();


    // // update package.json scripts
    // packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    // packageJson.scripts['format:check'] = 'prettier --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
    // packageJson.scripts['format:write'] = 'prettier --write --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
    // fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
    // execSync('git add .');
    // execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): update prettier scripts"');
    //
    // // create prettier ignore file
    // const prettierIgnore = fs.readFileSync(path.join(__dirname, '../templates/.prettierignore'), 'utf8');
    // const prettierIgnorePath = path.join(process.cwd(), './.prettierignore');
    // if (!fs.existsSync(prettierIgnorePath)) {
    //     console.log('[prettier] ✅ Creating prettier ignore file');
    //     fs.writeFileSync(prettierIgnorePath, prettierIgnore);
    //     execSync('git add .');
    //     execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): create prettier ignore file"');
    // } else {
    //     console.log('[prettier] ❌ Prettier ignore file already exists');
    // }
    //
    // // run prettier --write on all files
    // execSync('npm run format:write');
    // execSync('git add .');
    // execSync('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after update"');
    //
    // // install husky and lint-staged
    // packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    // if (!packageJson.devDependencies.husky) {
    //     console.log('[prettier] ✅ Installing husky and lint-staged');
    //     execSync('npm install --save-dev husky lint-staged');
    //     execSync('git add .');
    //     execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): install husky and lint-staged"');
    // }
    //
    // // update package.json scripts
    // packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    // packageJson.scripts['prepare'] = 'husky install';
    // packageJson['lint-staged'] = {
    //     'app/**/*.ts': 'prettier --write --config ./.prettierrc.js',
    //     'tests/**/*.ts': 'prettier --write --config ./.prettierrc.json'
    // }
    // fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
    // execSync('npm run prepare');
    // if (!fs.existsSync('./.husky/pre-commit')) {
    //     console.log('[prettier] ✅ Creating pre-commit hook');
    //     fs.writeFileSync('./.husky/pre-commit', 'npm run lint-staged');
    //     execSync('git add .');
    //     execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): create pre-commit hook"');
    // }

    if (existingPrettierJsonConfig) {
        logUpdate(`Successfully initialized Prettier 👍`);
    } else {
        logUpdate(`Successfully reinitialized Prettier 👍`);
    }
    logUpdate.done();
}

export default init;
