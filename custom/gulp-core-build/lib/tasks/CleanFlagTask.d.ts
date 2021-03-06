import { CleanTask } from './CleanTask';
import * as Gulp from 'gulp';
import { IBuildConfig } from './../IBuildConfig';
/**
 * This task runs at the start of any command if the --clean or -c parameter is specified
 * @public
 */
export declare class CleanFlagTask extends CleanTask {
    /** Instantiates a new CleanTask with the name 'clean' */
    private _hasRun;
    constructor();
    isEnabled(buildConfig: IBuildConfig): boolean;
    executeTask(gulp: typeof Gulp, completeCallback: (error?: string | Error) => void): void;
}
//# sourceMappingURL=CleanFlagTask.d.ts.map