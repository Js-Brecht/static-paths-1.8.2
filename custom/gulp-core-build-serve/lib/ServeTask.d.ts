import { GulpTask } from '@microsoft/gulp-core-build';
import * as Gulp from 'gulp';
/**
 * @remarks
 * If this schema is updated, dependant schemas MUST also be updated, including the spfx-serve.schema.json.
 * The spfx-serve.schema.json is the serve.schema.json file with the spfx-specific properties included. The
 * merge is simple, but must be done manually whenever the serve.schema.json file is changed.
 */
export interface IServeTaskConfig {
    /**
     * API server configuration
     */
    api?: {
        /**
         * The port on which to run the API server
         */
        port: number;
        /**
         * The path to the script to run as the API server
         */
        entryPath: string;
    };
    /**
     * The path to the page which should open automatically after this task completes. If you prefer no page to be
     * launched, run the build with the "--nobrowser" flag
     */
    initialPage?: string;
    /**
     * The port on which to host the file server.
     */
    port?: number;
    /**
     * The name of the host on which serve is running. Defaults to 'localhost'
     */
    hostname?: string;
    /**
     * If true, the server should run on HTTPS
     */
    https?: boolean;
    /**
     * Path to the HTTPS key
     */
    keyPath?: string;
    /**
     * Path to the HTTPS cert
     */
    certPath?: string;
    /**
     * Path to the HTTPS PFX cert
     */
    pfxPath?: string;
    /**
     * Path relative to the server root to base the server in.
     */
    rootFolder?: string;
    /**
     * Static paths to serve, in addition to the rootFolder
     */
    staticPaths?: {
        path: string;
        url: string;
    }[];
    /**
     * If true, when gulp-core-build-serve is initialized and a dev certificate doesn't already exist and hasn't been
     *  specified, attempt to generate one and trust it automatically.
     *
     * @default false
     */
    tryCreateDevCertificate?: boolean;
}
export declare class ServeTask<TExtendedConfig = {}> extends GulpTask<IServeTaskConfig & TExtendedConfig> {
    constructor(extendedName?: string, extendedConfig?: TExtendedConfig);
    loadSchema(): Object;
    executeTask(gulp: typeof Gulp, completeCallback?: (error?: string) => void): void;
    private _logRequestsMiddleware;
    private _enableCorsMiddleware;
    private _setJSONResponseContentTypeMiddleware;
    private _loadHttpsServerOptions;
}
//# sourceMappingURL=ServeTask.d.ts.map