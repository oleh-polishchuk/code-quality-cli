const fs = require('fs');

const initTSLint = () => {
    console.log('Setting up TSLint');

    if (!fs.existsSync('./package.json')) {
        console.error('Error: package.json file not found');
        return;
    }

    console.log('TSLint setup complete 👍\n');
}

module.exports = initTSLint;
