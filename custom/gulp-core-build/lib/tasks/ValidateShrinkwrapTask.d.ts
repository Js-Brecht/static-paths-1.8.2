/// <reference types="node" />
import { GulpTask } from './GulpTask';
import gulpType = require('gulp');
/**
 * This task attempts to detect if package.json file has been updated without the
 * shrinkwrap file being regenerated.
 *
 * It does this by checking that every dependency and dev dependency exists in the
 * shrinkwrap file and that the version in the shrinkwrap file satisfies what is
 * defined in the package.json file.
 * @public
 */
export declare class ValidateShrinkwrapTask extends GulpTask<void> {
    /**
     * Instantiates an instance of the ValidateShrinkwrap task
     */
    constructor();
    /**
     * Iterates through dependencies listed in a project's package.json and ensures that they are all
     * resolvable in the npm-shrinkwrap file.
     */
    executeTask(gulp: gulpType.Gulp, completeCallback: (error: string) => void): NodeJS.ReadWriteStream | void;
    private _validate;
}
//# sourceMappingURL=ValidateShrinkwrapTask.d.ts.map