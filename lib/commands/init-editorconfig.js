import * as fs from 'fs';
import * as path from 'path';
import logUpdate from 'log-update';
import cliSpinners from "cli-spinners";
import { promisify } from 'util';
import TaskManager from "../utils/task-manager.js";

const init = async ({ dryRun }) => {
    // paths
    const templateName = '.editorconfig';
    const fromPath = new URL(`../templates/${templateName}`, import.meta.url);
    const toPath = path.join(process.cwd(), `./${templateName}`);

    // tasks definition
    const taskManager = new TaskManager({ dryRun, spinner: cliSpinners.boxBounce, logUpdate });

    const series = taskManager.createSeries({
        name: async () => {
            const existingEditorConfig = await promisify(fs.exists)(toPath);
            return existingEditorConfig ? 'Updating EditorConfig' : 'Initializing EditorConfig';
        },
        prefix: '[editorconfig]',
    });

    series.conditionalTask({
        message: async (conditionResult) => {
            return conditionResult ? 'Updating editorconfig configuration file' : 'Creating editorconfig configuration file';
        },
        conditionFn: async () => {
            return await promisify(fs.exists)(toPath);
        },
        fnWhenTrue: async () => {
            await promisify(fs.rm)(toPath);
            await promisify(fs.copyFile)(fromPath, toPath);
        },
        fnWhenFalse: async () => {
            await promisify(fs.copyFile)(fromPath, toPath);
        }
    });

    // tasks execution
    await series.run();
}

export default init;
