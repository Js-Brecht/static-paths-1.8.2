"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const gulp_core_build_1 = require("@microsoft/gulp-core-build");
const node_core_library_1 = require("@microsoft/node-core-library");
const colors = require("colors");
class ServeTask extends gulp_core_build_1.GulpTask {
    constructor(extendedName, extendedConfig) {
        super(extendedName || 'serve', Object.assign({ api: undefined, https: false, initialPage: '/index.html', port: 4321, hostname: 'localhost', tryCreateDevCertificate: false }, extendedConfig));
    }
    loadSchema() {
        return require('./serve.schema.json');
    }
    executeTask(gulp, completeCallback) {
        /* tslint:disable:typedef */
        const gulpConnect = require('gulp-connect');
        const open = require('gulp-open');
        const st = require('st');
        const http = require('http');
        const https = require('https');
        /* tslint:enable:typedef */
        const path = require('path');
        const openBrowser = (process.argv.indexOf('--nobrowser') === -1);
        const portArgumentIndex = process.argv.indexOf('--port');
        let { port, initialPage } = this.taskConfig;
        const { api, hostname } = this.taskConfig;
        const { rootPath, staticPaths } = this.buildConfig;
        const httpsServerOptions = this._loadHttpsServerOptions();
        if (portArgumentIndex >= 0 && process.argv.length > (portArgumentIndex + 1)) {
            port = Number(process.argv[portArgumentIndex + 1]);
        }
        const middlewareCollection = [
            this._logRequestsMiddleware,
            this._enableCorsMiddleware,
        ];
        if (staticPaths) {
            const addStaticPaths = staticPaths instanceof Array ? staticPaths : [staticPaths];
            for (const stPath of addStaticPaths) {
                middlewareCollection.push(st({ path: stPath.path, url: stPath.url, dot: true }));
            }
        }
        // Spin up the connect server
        gulpConnect.server({
            https: httpsServerOptions,
            livereload: true,
            middleware: () => middlewareCollection,
            port: port,
            root: path.join(rootPath, this.taskConfig.rootFolder || ''),
            preferHttp1: true,
            host: hostname
        });
        // If an api is provided, spin it up.
        if (api) {
            let apiMap;
            try {
                apiMap = require(path.join(rootPath, api.entryPath));
                if (apiMap && apiMap.default) {
                    apiMap = apiMap.default;
                }
            }
            catch (e) {
                this.logError(`The api entry could not be loaded: ${api.entryPath}`);
            }
            if (apiMap) {
                console.log(`Starting api server on port ${api.port}.`);
                const express = require('express');
                const app = express();
                app.use(this._logRequestsMiddleware);
                app.use(this._enableCorsMiddleware);
                app.use(this._setJSONResponseContentTypeMiddleware);
                // Load the apis.
                for (const apiMapEntry in apiMap) {
                    if (apiMap.hasOwnProperty(apiMapEntry)) {
                        console.log(`Registring api: ${colors.green(apiMapEntry)}`);
                        app.get(apiMapEntry, apiMap[apiMapEntry]);
                    }
                }
                const apiPort = api.port || 5432;
                if (this.taskConfig.https) {
                    https.createServer(httpsServerOptions, app).listen(apiPort);
                }
                else {
                    http.createServer(app).listen(apiPort);
                }
            }
        }
        // Spin up the browser.
        if (openBrowser) {
            let uri = initialPage;
            if (!initialPage.match(/^https?:\/\//)) {
                if (!initialPage.match(/^\//)) {
                    initialPage = `/${initialPage}`;
                }
                uri = `${this.taskConfig.https ? 'https' : 'http'}://${this.taskConfig.hostname}:${port}${initialPage}`;
            }
            gulp.src('')
                .pipe(open({
                uri: uri
            }));
        }
        completeCallback();
    }
    _logRequestsMiddleware(req, res, next) {
        /* tslint:disable:no-any */
        const ipAddress = req.ip;
        /* tslint:enable:no-any */
        let resourceColor = colors.cyan;
        if (req && req.url) {
            if (req.url.indexOf('.bundle.js') >= 0) {
                resourceColor = colors.green;
            }
            else if (req.url.indexOf('.js') >= 0) {
                resourceColor = colors.magenta;
            }
            console.log([
                `  Request: `,
                `${ipAddress ? `[${colors.cyan(ipAddress)}] ` : ``}`,
                `'${resourceColor(req.url)}'`
            ].join(''));
        }
        next();
    }
    _enableCorsMiddleware(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
    }
    _setJSONResponseContentTypeMiddleware(req, res, next) {
        res.setHeader('content-type', 'application/json');
        next();
    }
    _loadHttpsServerOptions() {
        if (this.taskConfig.https) {
            const result = {};
            // We're configuring an HTTPS server, so we need a certificate
            if (this.taskConfig.pfxPath) {
                // There's a PFX path in the config, so try that
                this.logVerbose(`Trying PFX path: ${this.taskConfig.pfxPath}`);
                if (node_core_library_1.FileSystem.exists(this.taskConfig.pfxPath)) {
                    try {
                        result.pfx = node_core_library_1.FileSystem.readFile(this.taskConfig.pfxPath);
                        this.logVerbose(`Loaded PFX certificate.`);
                    }
                    catch (e) {
                        this.logError(`Error loading PFX file: ${e}`);
                    }
                }
                else {
                    this.logError(`PFX file not found at path "${this.taskConfig.pfxPath}"`);
                }
            }
            else if (this.taskConfig.keyPath && this.taskConfig.certPath) {
                this.logVerbose(`Trying key path "${this.taskConfig.keyPath}" and cert path "${this.taskConfig.certPath}".`);
                const certExists = node_core_library_1.FileSystem.exists(this.taskConfig.certPath);
                const keyExists = node_core_library_1.FileSystem.exists(this.taskConfig.keyPath);
                if (keyExists && certExists) {
                    try {
                        result.cert = node_core_library_1.FileSystem.readFile(this.taskConfig.certPath);
                        result.key = node_core_library_1.FileSystem.readFile(this.taskConfig.keyPath);
                    }
                    catch (e) {
                        this.logError(`Error loading key or cert file: ${e}`);
                    }
                }
                else {
                    if (!keyExists) {
                        this.logError(`Key file not found at path "${this.taskConfig.keyPath}`);
                    }
                    if (!certExists) {
                        this.logError(`Cert file not found at path "${this.taskConfig.certPath}`);
                    }
                }
            }
            else {
                const { ensureCertificate } = require('./certificates'); // tslint:disable-line
                const devCertificate = ensureCertificate(this.taskConfig.tryCreateDevCertificate, this);
                if (devCertificate.pemCertificate && devCertificate.pemKey) {
                    result.cert = devCertificate.pemCertificate;
                    result.key = devCertificate.pemKey;
                }
                else {
                    this.logWarning('When serving in HTTPS mode, a PFX cert path or a cert path and a key path must be ' +
                        'provided, or a dev certificate must be generated and trusted. If a SSL certificate isn\'t ' +
                        'provided, a default, self-signed certificate will be used. Expect browser security ' +
                        'warnings.');
                }
            }
            return result;
        }
        else {
            return undefined;
        }
    }
}
exports.ServeTask = ServeTask;
//# sourceMappingURL=ServeTask.js.map