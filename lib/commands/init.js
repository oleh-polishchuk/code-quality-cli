import initPrettier from './init-prettier.js';
import initEditorConfig from './init-editorconfig.js';

const init = async ({ dryRun }) => {
    await initPrettier({ dryRun });
    await initEditorConfig({ dryRun });
}

export default init;
