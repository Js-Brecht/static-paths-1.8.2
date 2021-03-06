import { GulpTask } from './GulpTask';
import * as Gulp from 'gulp';
/**
 * The clean task is a special task which iterates through all registered
 * tasks and subtasks, collecting a list of patterns which should be deleted.
 * An instance of this task is automatically registered to the 'clean' command.
 * @public
 */
export declare class CleanTask extends GulpTask<void> {
    /**
     * Instantiates a new CleanTask with the name 'clean'
     */
    constructor();
    /**
     * The main function, which iterates through all uniqueTasks registered
     * to the build, and by calling the getCleanMatch() function, collects a list of
     * glob patterns which are then passed to the `del` plugin to delete them from disk.
     */
    executeTask(gulp: typeof Gulp, completeCallback: (error?: string | Error) => void): void;
}
//# sourceMappingURL=CleanTask.d.ts.map