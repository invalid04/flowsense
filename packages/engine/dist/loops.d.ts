import type { LoopDetectionResult, RawTransitionInput } from "./types";
export declare function detectLoops(transitions: RawTransitionInput[], stateNameById: Map<string, string>): LoopDetectionResult;
