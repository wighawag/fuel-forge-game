import { Account, BigNumberish, BN, Script as __Script } from 'fuels';
export type TestScriptInputs = [input: BigNumberish];
export type TestScriptOutput = BN;
export declare class TestScript extends __Script<TestScriptInputs, TestScriptOutput> {
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
//# sourceMappingURL=TestScript.d.ts.map