"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const node_core_library_1 = require("@microsoft/node-core-library");
const forge = require('node-forge');
const path = require("path");
const child_process = require("child_process");
const os_1 = require("os");
const sudoSync_1 = require("./sudoSync");
const CertificateStore_1 = require("./CertificateStore");
const serialNumber = '731c321744e34650a202e3ef91c3c1b9';
const friendlyName = 'gulp-core-build-serve Development Certificate';
const macKeychain = '/Library/Keychains/System.keychain';
let _certutilExePath;
function _createDevelopmentCertificate() {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const certificate = forge.pki.createCertificate();
    certificate.publicKey = keys.publicKey;
    certificate.serialNumber = serialNumber;
    const now = new Date();
    certificate.validity.notBefore = now;
    certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + 3); // Three years from now
    const attrs = [{
            name: 'commonName',
            value: 'localhost'
        }];
    certificate.setSubject(attrs);
    certificate.setIssuer(attrs);
    certificate.setExtensions([
        {
            name: 'subjectAltName',
            altNames: [{
                    type: 2,
                    value: 'localhost'
                }]
        },
        {
            name: 'keyUsage',
            digitalSignature: true,
            keyEncipherment: true,
            dataEncipherment: true
        }, {
            name: 'extKeyUsage',
            serverAuth: true
        }, {
            name: 'friendlyName',
            value: friendlyName
        }
    ]);
    // self-sign certificate
    certificate.sign(keys.privateKey, forge.md.sha256.create());
    // convert a Forge certificate to PEM
    const pem = forge.pki.certificateToPem(certificate);
    const privateKey = forge.pki.privateKeyToPem(keys.privateKey);
    return {
        pemCertificate: pem,
        pemKey: privateKey
    };
}
function _ensureCertUtilExePath(parentTask) {
    if (!_certutilExePath) {
        const where = child_process.spawnSync('where', ['certutil']);
        const whereErr = where.stderr.toString();
        if (!!whereErr) {
            parentTask.logError(`Error finding certUtil command: "${whereErr}"`);
            _certutilExePath = undefined;
        }
        else {
            const lines = where.stdout.toString().trim().split(os_1.EOL);
            _certutilExePath = lines[0].trim();
        }
    }
    return _certutilExePath;
}
function _tryTrustCertificate(certificatePath, parentTask) {
    switch (process.platform) {
        case 'win32':
            const certutilExePath = _ensureCertUtilExePath(parentTask);
            if (!certutilExePath) {
                // Unable to find the cert utility
                return false;
            }
            parentTask.log('Attempting to trust a dev certificate. This self-signed certificate only points to localhost ' +
                'and will be stored in your local user profile to be used by other instances of ' +
                'gulp-core-build-serve. If you do not consent to trust this certificate, click "NO" in the ' +
                'dialog.');
            const winTrustResult = child_process.spawnSync(certutilExePath, ['-user', '-addstore', 'root', certificatePath]);
            if (winTrustResult.status !== 0) {
                parentTask.logError(`Error: ${winTrustResult.stdout.toString()}`);
                const errorLines = winTrustResult.stdout.toString().split(os_1.EOL).map((line) => line.trim());
                // Not sure if this is always the status code for "cancelled" - should confirm.
                if (winTrustResult.status === 2147943623 ||
                    errorLines[errorLines.length - 1].indexOf('The operation was canceled by the user.') > 0) {
                    parentTask.log('Certificate trust cancelled.');
                }
                else {
                    parentTask.logError('Certificate trust failed with an unknown error.');
                }
                return false;
            }
            else {
                parentTask.logVerbose('Successfully trusted development certificate.');
                return true;
            }
        case 'darwin': // tslint:disable-line:no-switch-case-fall-through
            parentTask.log('Attempting to trust a dev certificate. This self-signed certificate only points to localhost ' +
                'and will be stored in your local user profile to be used by other instances of ' +
                'gulp-core-build-serve. If you do not consent to trust this certificate, do not enter your ' +
                'root password in the prompt.');
            const commands = [
                'security',
                'add-trusted-cert',
                '-d',
                '-r',
                'trustRoot',
                '-k',
                macKeychain,
                certificatePath
            ];
            const result = sudoSync_1.runSudoSync(commands);
            if (result.code === 0) {
                parentTask.logVerbose('Successfully trusted development certificate.');
                return true;
            }
            else {
                if (result.stderr.some((value) => !!value.match(/The authorization was cancelled by the user\./))) {
                    parentTask.log('Certificate trust cancelled.');
                    return false;
                }
                else {
                    parentTask.logError(`Certificate trust failed with an unknown error. Exit code: ${result.code}. ` +
                        `Error: ${result.stderr.join(' ')}`);
                    return false;
                }
            }
        default: // tslint:disable-line:no-switch-case-fall-through
            // Linux + others: Have the user manually trust the cert if they want to
            parentTask.log('Automatic certificate trust is only implemented for gulp-core-build-serve on Windows and ' +
                'macOS. To trust the development certificate, add this certificate to your trusted root ' +
                `certification authorities: "${CertificateStore_1.CertificateStore.instance.certificatePath}".`);
            return true;
    }
}
function _trySetFriendlyName(certificatePath, parentTask) {
    if (process.platform === 'win32') {
        const certutilExePath = _ensureCertUtilExePath(parentTask);
        if (!certutilExePath) {
            // Unable to find the cert utility
            return false;
        }
        const basePath = path.dirname(certificatePath);
        const fileName = path.basename(certificatePath, path.extname(certificatePath));
        const friendlyNamePath = path.join(basePath, `${fileName}.inf`);
        const friendlyNameFile = [
            '[Version]',
            'Signature = "$Windows NT$"',
            '[Properties]',
            `11 = "{text}${friendlyName}"`,
            ''
        ].join(os_1.EOL);
        node_core_library_1.FileSystem.writeFile(friendlyNamePath, friendlyNameFile);
        const commands = [
            '–repairstore',
            '–user',
            'root',
            serialNumber,
            friendlyNamePath
        ];
        const repairStoreResult = child_process.spawnSync(certutilExePath, commands);
        if (repairStoreResult.status !== 0) {
            parentTask.logError(`CertUtil Error: ${repairStoreResult.stdout.toString()}`);
            return false;
        }
        else {
            parentTask.logVerbose('Successfully set certificate name.');
            return true;
        }
    }
    else {
        // No equivalent concept outside of Windows
        return true;
    }
}
/**
 * Get the dev certificate from the store, or, optionally, generate a new one and trust it if one doesn't exist in the
 *  store.
 */
function ensureCertificate(canGenerateNewCertificate, parentTask) {
    const certificateStore = CertificateStore_1.CertificateStore.instance;
    if (certificateStore.certificateData && certificateStore.keyData) {
        if (!_certificateHasSubjectAltName(certificateStore.certificateData)) {
            let warningMessage = 'The existing development certificate is missing the subjectAltName ' +
                'property and will not work with the latest versions of some browsers. ';
            if (canGenerateNewCertificate) {
                warningMessage += ' Attempting to untrust the certificate and generate a new one.';
            }
            else {
                warningMessage += ' Untrust the certificate and generate a new one.';
            }
            parentTask.logWarning(warningMessage);
            if (canGenerateNewCertificate) {
                untrustCertificate(parentTask);
                _ensureCertificateInternal(parentTask);
            }
        }
    }
    else if (canGenerateNewCertificate) {
        _ensureCertificateInternal(parentTask);
    }
    return {
        pemCertificate: certificateStore.certificateData,
        pemKey: certificateStore.keyData
    };
}
exports.ensureCertificate = ensureCertificate;
function untrustCertificate(parentTask) {
    switch (process.platform) {
        case 'win32':
            const certutilExePath = _ensureCertUtilExePath(parentTask);
            if (!certutilExePath) {
                // Unable to find the cert utility
                return false;
            }
            const winUntrustResult = child_process.spawnSync(certutilExePath, ['-user', '-delstore', 'root', serialNumber]);
            if (winUntrustResult.status !== 0) {
                parentTask.logError(`Error: ${winUntrustResult.stdout.toString()}`);
                return false;
            }
            else {
                parentTask.logVerbose('Successfully untrusted development certificate.');
                return true;
            }
        case 'darwin': // tslint:disable-line:no-switch-case-fall-through
            parentTask.logVerbose('Trying to find the signature of the dev cert');
            const macFindCertificateResult = child_process.spawnSync('security', ['find-certificate', '-c', 'localhost', '-a', '-Z', macKeychain]);
            if (macFindCertificateResult.status !== 0) {
                parentTask.logError(`Error finding the dev certificate: ${macFindCertificateResult.output.join(' ')}`);
                return false;
            }
            const outputLines = macFindCertificateResult.stdout.toString().split(os_1.EOL);
            let found = false;
            let shaHash = undefined;
            for (let i = 0; i < outputLines.length; i++) {
                const line = outputLines[i];
                const shaMatch = line.match(/^SHA-1 hash: (.+)$/);
                if (shaMatch) {
                    shaHash = shaMatch[1];
                }
                const snbrMatch = line.match(/^\s*"snbr"<blob>=0x([^\s]+).+$/);
                if (snbrMatch && (snbrMatch[1] || '').toLowerCase() === serialNumber) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                parentTask.logError('Unable to find the dev certificate.');
                return false;
            }
            parentTask.logVerbose(`Found the dev cert. SHA is ${shaHash}`);
            const macUntrustResult = sudoSync_1.runSudoSync(['security', 'delete-certificate', '-Z', shaHash, macKeychain]);
            if (macUntrustResult.code === 0) {
                parentTask.logVerbose('Successfully untrusted dev certificate.');
                return true;
            }
            else {
                parentTask.logError(macUntrustResult.stderr.join(' '));
                return false;
            }
        default: // tslint:disable-line:no-switch-case-fall-through
            // Linux + others: Have the user manually untrust the cert
            parentTask.log('Automatic certificate untrust is only implemented for gulp-core-build-serve on Windows and ' +
                'macOS. To untrust the development certificate, remove this certificate from your trusted ' +
                `root certification authorities: "${CertificateStore_1.CertificateStore.instance.certificatePath}". The ` +
                `certificate has serial number "${serialNumber}".`);
            return false;
    }
}
exports.untrustCertificate = untrustCertificate;
function _ensureCertificateInternal(parentTask) {
    const certificateStore = CertificateStore_1.CertificateStore.instance;
    const generatedCertificate = _createDevelopmentCertificate();
    const now = new Date();
    const certificateName = now.getTime().toString();
    const tempDirName = path.join(__dirname, '..', 'temp');
    const tempCertificatePath = path.join(tempDirName, `${certificateName}.cer`);
    node_core_library_1.FileSystem.writeFile(tempCertificatePath, generatedCertificate.pemCertificate, {
        ensureFolderExists: true
    });
    if (_tryTrustCertificate(tempCertificatePath, parentTask)) {
        certificateStore.certificateData = generatedCertificate.pemCertificate;
        certificateStore.keyData = generatedCertificate.pemKey;
        if (!_trySetFriendlyName(tempCertificatePath, parentTask)) { // Try to set the friendly name, and warn if we can't
            parentTask.logWarning('Unable to set the certificate\'s friendly name.');
        }
    }
    else {
        // Clear out the existing store data, if any exists
        certificateStore.certificateData = undefined;
        certificateStore.keyData = undefined;
    }
    node_core_library_1.FileSystem.deleteFile(tempCertificatePath);
}
function _certificateHasSubjectAltName(certificateData) {
    const certificate = forge.pki.certificateFromPem(certificateData);
    return !!certificate.getExtension('subjectAltName');
}
//# sourceMappingURL=certificates.js.map