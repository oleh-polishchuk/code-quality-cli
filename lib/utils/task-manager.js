import logUpdate from "log-update";

class TaskManager {

    constructor({ dryRun, spinner, logUpdate }) {
        this.dryRun = dryRun || false;
        this.spinner = spinner || {
            frames: [],
            interval: 0,
        }
        this.logUpdate = logUpdate;
    }

    createSeries({ name, prefix }) {
        return new Series({
            name: name,
            prefix: prefix,
            dryRun: this.dryRun,
            spinner: this.spinner,
            logUpdate: this.logUpdate,
        });
    }
}

class Series {
    constructor({ name, prefix, dryRun, spinner, logUpdate }) {
        const code = Math.random().toString(36).substring(7);
        this.name = name || `Series ${code}`;
        this.prefix = prefix || code;
        this.dryRun = dryRun;
        this.spinner = spinner;
        this.logUpdate = logUpdate;

        this.tasks = [];
    }

    task({ message, fn }) {
        // validation
        if (typeof message !== "string" && typeof message !== "function") throw new Error("Validation error: Task message must be a string or a function");
        if (typeof message === "string" && message.length === 0) throw new Error("Validation error: Task message must not be empty");
        if (typeof fn !== "function") throw new Error("Validation error: Task function must be a function");

        // task registration
        this.tasks.push({
            message: message,
            fn: fn,
        });
    }

    conditionalTask({ message, messageWhenTrue, messageWhenFalse, conditionFn, fnWhenTrue, fnWhenFalse, finalFn }) {
        // validation
        if (typeof message !== "string" && typeof message !== "function") throw new Error("Validation error: Task message must be a string or a function");
        if (typeof message === "string" && message.length === 0) throw new Error("Validation error: Task message must not be empty");
        if (messageWhenTrue && typeof messageWhenTrue !== "string") throw new Error("Validation error: Task message when true must be a string");
        if (messageWhenFalse && typeof messageWhenFalse !== "string") throw new Error("Validation error: Task message when false must be a string");
        if (message.length === 0) throw new Error("Validation error: Message must not be empty");
        if (typeof conditionFn !== "function") throw new Error("Validation error: Condition function must be a function");
        if (fnWhenTrue && typeof fnWhenTrue !== "function") throw new Error("Validation error: Task function when true must be a function");
        if (fnWhenFalse && typeof fnWhenFalse !== "function") throw new Error("Validation error: Task function when false must be a function");
        if (finalFn && typeof finalFn !== "function") throw new Error("Validation error: Final function must be a function");

        // task registration
        this.tasks.push({
            message: message,
            messageWhenTrue: messageWhenTrue || '',
            messageWhenFalse: messageWhenFalse || '',
            conditionFn: conditionFn,
            fnWhenTrue: fnWhenTrue || (() => {}),
            fnWhenFalse: fnWhenFalse || (() => {}),
            finalFn: finalFn || (() => {}),
        });
    }

    async run() {
        const seriesName = typeof this.name === "function" ? await this.name() : this.name;
        logUpdate(`${seriesName}...`);
        logUpdate.done();

        const total = this.tasks.length;
        for (let i = 0; i < total; i++) {
            const index = i + 1;
            const task = this.tasks[i];
            if (typeof task.conditionFn === "function") {
                const condition = await task.conditionFn();
                const message = typeof task.message === "function" ? await task.message(condition) : task.message;
                const interval = this.logUpdateAnimated(this.prefix, `[${index}/${total}] ${message}`);
                if (condition) {
                    if (!this.dryRun) {
                        await task.fnWhenTrue();
                    }
                    this.logUpdate(`${this.prefix} ✓ [${index}/${total}] ${message}, done. ${task.messageWhenTrue}`);
                } else {
                    if (!this.dryRun) {
                        await task.fnWhenFalse();
                    }
                    this.logUpdate(`${this.prefix} - [${index}/${total}] ${message}, skipped. ${task.messageWhenFalse}`);
                }
                if (!this.dryRun) {
                    await task.finalFn();
                }
                clearInterval(interval);
                this.logUpdate.done();
            } else {
                const interval = this.logUpdateAnimated(this.prefix, `[${index}/${total}] ${task.message}`);
                if (!this.dryRun) {
                    await task.fn();
                }
                clearInterval(interval);
                this.logUpdate(`${this.prefix} ✓ [${index}/${total}] ${task.message}, done.`);
                this.logUpdate.done();
            }
        }

        logUpdate('Done!');
        logUpdate.done();
    }

    //////

    logUpdateAnimated(prefix, message) {
        let i = 0;
        return setInterval(() => {
            this.logUpdate(`${prefix} ${this.spinner.frames[i++ % this.spinner.frames.length]} ${message}`);
        }, this.spinner.interval);
    };
}

export default TaskManager;
