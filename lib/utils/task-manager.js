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
        if (typeof message !== "string") throw new Error("Validation error: Task message must be a string");
        if (message.length === 0) throw new Error("Validation error: Message must not be empty");
        if (typeof fn !== "function") throw new Error("Validation error: Task function must be a function");

        // task registration
        this.tasks.push({
            message: message,
            fn: fn,
            fnWhenTrue: () => {},
            fnWhenFalse: () => {},
        });
    }

    conditionalTask({ message, conditionFn, fn, fnWhenTrue, fnWhenFalse }) {
        // validation
        if (typeof message !== "string") throw new Error("Validation error: Task message must be a string");
        if (message.length === 0) throw new Error("Validation error: Message must not be empty");
        if (typeof conditionFn !== "function") throw new Error("Validation error: Condition function must be a function");
        if (fn && typeof fn !== "function") throw new Error("Validation error: Task function must be a function");
        if (fnWhenTrue && typeof fnWhenTrue !== "function") throw new Error("Validation error: Task function when true must be a function");
        if (fnWhenFalse && typeof fnWhenFalse !== "function") throw new Error("Validation error: Task function when false must be a function");

        // task registration
        this.tasks.push({
            message: message,
            conditionFn: conditionFn,
            fn: fn || (() => {}),
            fnWhenTrue: fnWhenTrue || (() => {}),
            fnWhenFalse: fnWhenFalse || (() => {}),
        });
    }

    async run() {
        const total = this.tasks.length;
        const index = 0;
        for (let i = 0; i < total; i++) {
            const task = this.tasks[i];
            const interval = this.logUpdateAnimated(this.prefix, `[${index}/${total}] ${task.message}`);
            if (!this.dryRun) {
                const condition = await task.conditionFn();
                if (condition) {
                    await task.fnWhenTrue();
                } else {
                    await task.fnWhenFalse();
                }
                await task.fn();
            }
            clearInterval(interval);
            this.logUpdate(`${this.prefix} ✓ [${index}/${total}] ${task.message}, done.`);
            this.logUpdate.done();
        }
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
