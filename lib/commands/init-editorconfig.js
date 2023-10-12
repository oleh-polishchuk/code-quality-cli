const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const initEditorConfig = ({ dryRun }) => {
    console.log('Setting up EditorConfig');

    // create editorconfig file
    const editorConfigPath = path.join(process.cwd(), './.editorconfig');
    if (!fs.existsSync(editorConfigPath)) {
        console.log('[editorconfig] ✅ Creating editorconfig configuration file');
        const editorConfig = fs.readFileSync(path.join(__dirname, '../templates/.editorconfig'), 'utf8');
        if (!dryRun) {
            fs.writeFileSync(editorConfigPath, editorConfig);
        }
    } else {
        console.log('[editorconfig] ❌ EditorConfig configuration file already exists');
        return;
    }

    console.log('EditorConfig setup complete 👍\n');
}

module.exports = initEditorConfig;
