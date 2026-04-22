import { FastifyRequest } from "fastify";
import { getAccountIdFromApiKey } from "./getAccountIdFromApiKey";

export async function resolveAccountIdForRequest(request: FastifyRequest) {
  const internalSecret = request.headers.authorization;
  const forwardedAccountId = request.headers["x-sequence-account-id"];
  const expectedSecret = process.env.SEQUENCE_INTERNAL_SECRET;

  const accountIdHeader = Array.isArray(forwardedAccountId)
    ? forwardedAccountId[0]
    : forwardedAccountId;

  const authHeader = Array.isArray(internalSecret)
    ? internalSecret[0]
    : internalSecret;

  // First-party trusted FlowSense path
  if (
    expectedSecret &&
    authHeader === `Bearer ${expectedSecret}` &&
    accountIdHeader
  ) {
    return accountIdHeader;
  }

  // External API key path
  const accountIdFromApiKey = await getAccountIdFromApiKey(authHeader);
  if (accountIdFromApiKey) {
    return accountIdFromApiKey;
  }

  return null;
}
