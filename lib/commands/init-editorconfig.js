import * as fs from 'fs';
import * as path from 'path';
import logUpdate from 'log-update';
import cliSpinners from "cli-spinners";
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
    const templateName = '.editorconfig';
    const fromPath = new URL(`../templates/${templateName}`, import.meta.url);
    const toPath = path.join(process.cwd(), `./${templateName}`);

    const existingEditorConfig = fs.existsSync(toPath);
    if (existingEditorConfig) {
        logUpdate(`Reinitializing EditorConfig`);
        await promisify(fs.rm)(toPath);
    } else {
        logUpdate(`Initializing EditorConfig`);
    }
    logUpdate.done();

    // create editorconfig file
    spinnerInterval = logUpdateAnimated('[editorconfig]', 'Creating editorconfig configuration file');
    if (!dryRun) {
        await promisify(fs.copyFile)(fromPath, toPath);
    }
    clearInterval(spinnerInterval);
    logUpdate(`[editorconfig] ✓ Creating editorconfig configuration file, done.`);
    logUpdate.done();

    if (existingEditorConfig) {
        logUpdate(`Successfully initialized EditorConfig 👍`);
    } else {
        logUpdate(`Successfully reinitialized EditorConfig 👍`);
    }
    logUpdate.done();
}

export default init;
