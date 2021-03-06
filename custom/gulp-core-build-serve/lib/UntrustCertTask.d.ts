import { GulpTask } from '@microsoft/gulp-core-build';
import * as Gulp from 'gulp';
/**
 * On Windows, this task removes the certificate with the expected serial number from the user's
 *  root certification authorities list. On macOS, it finds the SHA signature of the certificate
 *  with the expected serial number and then removes that certificate from the keychain. On
 *  other platforms, the user must untrust the certificate manually. On all platforms,
 *  the certificate and private key are deleted from the user's home directory.
 */
export declare class UntrustCertTask extends GulpTask<void> {
    constructor();
    executeTask(gulp: typeof Gulp, completeCallback: (error?: string) => void): void;
}
//# sourceMappingURL=UntrustCertTask.d.ts.map