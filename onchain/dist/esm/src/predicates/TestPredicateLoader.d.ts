import { BigNumberish, Predicate as __Predicate, PredicateParams } from 'fuels';
export type TestPredicateLoaderConfigurables = undefined;
export type TestPredicateLoaderInputs = [password: BigNumberish];
export type TestPredicateLoaderParameters = Omit<PredicateParams<TestPredicateLoaderInputs, TestPredicateLoaderConfigurables>, 'abi' | 'bytecode'>;
export declare class TestPredicateLoader extends __Predicate<TestPredicateLoaderInputs, TestPredicateLoaderConfigurables> {
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
            attributes: {
                name: string;
                arguments: string[];
            }[];
        }[];
        loggedTypes: never[];
        messagesTypes: never[];
        configurables: never[];
        errorCodes: {};
    };
    static readonly bytecode: Uint8Array<ArrayBufferLike>;
    constructor(params: TestPredicateLoaderParameters);
}
//# sourceMappingURL=TestPredicateLoader.d.ts.map