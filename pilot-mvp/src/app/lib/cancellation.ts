// Shared cancellation store for Selenium operations
// This allows both the API routes and worker to check cancellation status

const cancellationTokens = new Map<string, boolean>();

export function setCancelled(requestId: string): void {
  cancellationTokens.set(requestId, true);
  console.log(`🛑 Cancellation set for request: ${requestId}`);
}

export function isCancelled(requestId: string): boolean {
  return cancellationTokens.get(requestId) || false;
}

export function clearCancellation(requestId: string): void {
  cancellationTokens.delete(requestId);
  console.log(`🧹 Cancellation cleared for request: ${requestId}`);
}

// Cleanup old tokens (older than 1 hour) to prevent memory leaks
export function cleanupOldTokens(): void {
  // For now, we'll rely on the tokens being cleared after operations complete
  // In production, you might want to add timestamp tracking and cleanup
}
