const init = ({ eslint, prettier, editorconfig, dryRun }) => {
    if (!eslint && !prettier && !editorconfig) {
        require('./init-prettier')({ dryRun });
        require('./init-editorconfig')({ dryRun });
        return;
    }

    if (prettier) {
        require(`./init-prettier`)({ dryRun });
    }
    if (editorconfig) {
        require(`./init-editorconfig`)({ dryRun });
    }
}

module.exports = init;
