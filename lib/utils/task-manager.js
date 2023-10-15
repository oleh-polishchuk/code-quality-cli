import logUpdate from "log-update";

class TaskManager {

    constructor({ dryRun, prefix, spinner, logUpdate }) {
        this.dryRun = dryRun || false;
        this.prefix = prefix;
        this.spinner = spinner || {
            frames: [],
            interval: 0,
        }
        this.frames = this.spinner.frames;
        this.interval = this.spinner.interval;
        this.logUpdate = logUpdate;
    }

    tasks = [];

    task({ message, fn }) {
        // validation
        if (typeof message !== "string" && typeof message !== "function") throw new Error("Validation error: Task message must be a string or a function");
        if (typeof message === "string" && message.length === 0) throw new Error("Validation error: Task message must not be empty");
        if (typeof fn !== "function") throw new Error("Validation error: Task function must be a function");

        // task registration
        this.tasks.push({
            message: message,
            fn: fn,
            conditionFn: undefined,
            fnWhenTrue: undefined,
            fnWhenFalse: undefined,
            finalFn: undefined,
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
            fn: undefined,
            fnWhenTrue: fnWhenTrue || (() => {}),
            fnWhenFalse: fnWhenFalse || (() => {}),
            finalFn: finalFn || (() => {}),
        });
    }

    async run() {
        const total = this.tasks.length;
        for (let i = 0; i < total; i++) {
            const index = i + 1;
            const task = this.tasks[i];
            if (typeof task.conditionFn === "function") {
                const condition = await task.conditionFn();
                const message = typeof task.message === "function" ? await task.message(condition) : task.message;
                const interval = this.logUpdateAnimated(this.prefix, `[${index}/${total}] ${message}`);
                if (condition) {
                    await task.fnWhenTrue();
                    this.logUpdate(`${this.prefix} ✓ [${index}/${total}] ${message}, done. ${task.messageWhenTrue}`);
                } else {
                    await task.fnWhenFalse();
                    this.logUpdate(`${this.prefix} - [${index}/${total}] ${message}, skipped. ${task.messageWhenFalse}`);
                }
                await task.finalFn();
                clearInterval(interval);
                this.logUpdate.done();
            } else {
                const interval = this.logUpdateAnimated(this.prefix, `[${index}/${total}] ${task.message}`);
                await task.fn();
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
            this.logUpdate(`${prefix} ${this.frames[i++ % this.frames.length]} ${message}`);
        }, this.interval);
    };

}

export default TaskManager;
