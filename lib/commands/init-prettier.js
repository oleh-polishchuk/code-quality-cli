const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const initPrettier = ({ dryRun }) => {
    if (dryRun) {
        console.log('Error: Dry run is not supported for this command');
        return;
    }

    console.log('Setting up Prettier');

    if (!fs.existsSync('./package.json')) {
        console.error('Error: package.json file not found');
        return;
    }
    let packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

    // run prettier --write on all files
    if (fs.existsSync('./.prettierrc.json')) {
        console.log('[prettier] ✅ Running prettier --write on all files');
        execSync('npm run format:write');
        execSync('git add .');
        execSync('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules"');
    }

    // uninstall existing prettier
    console.log('[prettier] ✅ Uninstalling existing prettier');
    execSync('npm uninstall prettier');

    // install prettier
    console.log('[prettier] ✅ Installing prettier v3.0.3');
    execSync('npm install --save-dev prettier');
    execSync('git add .');
    execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): upgrade prettier package to v3.0.3"');

    // uninstall existing @types/prettier
    packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (packageJson.devDependencies['@types/prettier']) {
        console.log('[prettier] ✅ Uninstalling existing @types/prettier');
        execSync('npm uninstall @types/prettier');
        execSync('git add .');
        execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): remove deprecated @types/prettier package"');
    }

    // run prettier --write on all files
    execSync('npm run format:write');
    execSync('git add .');
    execSync('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after upgrade"');

    // install @fashioncloud/prettier-config
    console.log('[prettier] ✅ Installing @fashioncloud/prettier-config');
    execSync('npm install --save-dev @fashioncloud/prettier-config');

    // remove existing prettier config file
    const currentPrettierRcPath = path.join(process.cwd(), './.prettierrc.json');
    if (fs.existsSync(currentPrettierRcPath)) {
        fs.unlinkSync(currentPrettierRcPath);
    }

    // create prettier config file
    const prettierRc = fs.readFileSync(path.join(__dirname, '../templates/.prettierrc.js'), 'utf8');
    const prettierRcPath = path.join(process.cwd(), './.prettierrc.js');
    if (!fs.existsSync(prettierRcPath)) {
        console.log('[prettier] ✅ Creating prettier configuration file');
        fs.writeFileSync(prettierRcPath, prettierRc);
        execSync('git add .');
        execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): update prettier config"');
    } else {
        console.log('[prettier] ❌ Prettier configuration file already exists');
    }

    // update package.json scripts
    packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    packageJson.scripts['format:check'] = 'prettier --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
    packageJson.scripts['format:write'] = 'prettier --write --config ./.prettierrc.js \"./app/**/*.ts\" \"./tests/**/*.ts\"';
    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
    execSync('git add .');
    execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): update prettier scripts"');

    // create prettier ignore file
    const prettierIgnore = fs.readFileSync(path.join(__dirname, '../templates/.prettierignore'), 'utf8');
    const prettierIgnorePath = path.join(process.cwd(), './.prettierignore');
    if (!fs.existsSync(prettierIgnorePath)) {
        console.log('[prettier] ✅ Creating prettier ignore file');
        fs.writeFileSync(prettierIgnorePath, prettierIgnore);
        execSync('git add .');
        execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): create prettier ignore file"');
    } else {
        console.log('[prettier] ❌ Prettier ignore file already exists');
    }

    // run prettier --write on all files
    execSync('npm run format:write');
    execSync('git add .');
    execSync('git diff-index --quiet HEAD || git commit -m "style(root): apply existing prettier rules after update"');

    // install husky and lint-staged
    packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (!packageJson.devDependencies.husky) {
        console.log('[prettier] ✅ Installing husky and lint-staged');
        execSync('npm install --save-dev husky lint-staged');
        execSync('git add .');
        execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): install husky and lint-staged"');
    }

    // update package.json scripts
    packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    packageJson.scripts['prepare'] = 'husky install';
    packageJson['lint-staged'] = {
        'app/**/*.ts': 'prettier --write --config ./.prettierrc.js',
        'tests/**/*.ts': 'prettier --write --config ./.prettierrc.json'
    }
    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2) + os.EOL);
    execSync('npm run prepare');
    if (!fs.existsSync('./.husky/pre-commit')) {
        console.log('[prettier] ✅ Creating pre-commit hook');
        fs.writeFileSync('./.husky/pre-commit', 'npm run lint-staged');
        execSync('git add .');
        execSync('git diff-index --quiet HEAD || git commit -m "style(package.json): create pre-commit hook"');
    }

    console.log('Prettier setup complete 👍\n');
}

module.exports = initPrettier;
