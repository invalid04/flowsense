"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectDropoffCandidates = detectDropoffCandidates;
function detectDropoffCandidates(rows) {
    const candidates = rows
        .map((row) => ({
        stateId: row.stateId,
        stateName: row.stateName,
        incomingCount: Number(row.incomingCount),
        outgoingCount: Number(row.outgoingCount),
    }))
        .filter((row) => row.outgoingCount === 0)
        .sort((a, b) => b.incomingCount - a.incomingCount);
    return {
        biggestDropoff: candidates[0] ?? null,
        candidates,
    };
}
