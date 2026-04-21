import type { ConversionPathEdgeInput, ConversionPathResult } from "./types";
type BuildConversionPathInput = {
    startState: string;
    conversionStates: Set<string>;
    transitions: ConversionPathEdgeInput[];
    maxSteps?: number;
};
export declare function buildConversionPath({ startState, conversionStates, transitions, maxSteps, }: BuildConversionPathInput): ConversionPathResult;
export {};
