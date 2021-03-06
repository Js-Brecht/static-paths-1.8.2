export declare const root: string;
export declare const args: {
    [flat: string]: boolean | string;
};
export interface IPackageJSON {
    name?: string;
    version?: string;
    directories: {
        packagePath: string | undefined;
    } | undefined;
}
export declare const builtPackage: IPackageJSON;
export declare const coreBuildPackage: IPackageJSON;
export declare const nodeVersion: string;
//# sourceMappingURL=State.d.ts.map