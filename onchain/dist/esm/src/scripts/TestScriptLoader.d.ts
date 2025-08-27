import { Account, BigNumberish, BN, Script as __Script } from 'fuels';
export type TestScriptLoaderInputs = [input: BigNumberish];
export type TestScriptLoaderOutput = BN;
export declare class TestScriptLoader extends __Script<TestScriptLoaderInputs, TestScriptLoaderOutput> {
    static readonly abi: {
        programType: string;
        specVersion: string;
        encodingVersion: string;
        concreteTypes: {
            type: string;
            concreteTypeId: string;
        }[];
        metadataTypes: never[];
        functions: {
            name: string;
            inputs: {
                name: string;
                concreteTypeId: string;
            }[];
            output: string;
            attributes: null;
        }[];
        loggedTypes: never[];
        messagesTypes: never[];
        configurables: never[];
        errorCodes: {};
    };
    static readonly bytecode: Uint8Array<ArrayBufferLike>;
    constructor(wallet: Account);
}
//# sourceMappingURL=TestScriptLoader.d.ts.map