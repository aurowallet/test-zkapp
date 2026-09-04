import { ChainInfoArgs } from "@aurowallet/mina-provider";

export function addressSlice(
  address: string,
  sliceLength = 8,
  lastLength = ""
) {
  if (address) {
    let realLastLength = lastLength ? lastLength : sliceLength;
    return `${address.slice(0, sliceLength)}...${address.slice(
      -realLastLength
    )}`;
  }
  return address;
}

export function getRealGqlUrl(url: string) {
  // Check if url ends with '/graphql' or 'graphql'
  if (url.endsWith('/graphql') || url.endsWith('graphql')) {
    return url;
  }
  // Ensure url doesn't end with slash before appending
  const trimmedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${trimmedUrl}/graphql`;
}

export function getErrorMessage(error: unknown, fallback = "Unknown error") {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {}
  }

  return fallback;
}

export function hasErrorMessage(error: unknown): error is { message: string } {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (
    typeof (error as { message?: unknown }).message === "string" &&
    !!(error as { message: string }).message
  );
}

export function hasErrorCode(
  error: unknown
): error is { code: unknown; message?: string } {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error;
}
