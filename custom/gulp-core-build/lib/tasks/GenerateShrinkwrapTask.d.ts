/// <reference types="node" />
import gulpType = require('gulp');
import { GulpTask } from './GulpTask';
/**
 * This provides a convenient way to more consistently generate a shrinkwrap file in
 * a desired manner as a gulp task, as there are many consistency issues with just
 * running npm-shrinkwrap directly.
 * @public
 */
export declare class GenerateShrinkwrapTask extends GulpTask<void> {
    /**
     * Instantiates a GenerateShrinkwrap task which will regenerate the shrinkwrap for a particular project
     */
    constructor();
    /**
     * Runs npm `prune` and `update` on a package before running `shrinkwrap --dev`
     */
    executeTask(gulp: gulpType.Gulp, completeCallback: (error?: string | Error) => void): NodeJS.ReadWriteStream | void;
    private _dangerouslyDeletePath;
}
//# sourceMappingURL=GenerateShrinkwrapTask.d.ts.map