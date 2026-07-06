const NEAR_BOTTOM_THRESHOLD_PX = 80;

export function isChatThreadNearBottom(
  container: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
  thresholdPx = NEAR_BOTTOM_THRESHOLD_PX,
): boolean {
  const distanceToBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;

  return distanceToBottom <= thresholdPx;
}

export function shouldAutoScrollChatThread({
  previousMessageCount,
  messageCount,
  lastMessageRole,
  isNearBottom,
}: {
  previousMessageCount: number;
  messageCount: number;
  lastMessageRole?: "user" | "assistant";
  isNearBottom: boolean;
}): boolean {
  if (messageCount === 0) {
    return false;
  }

  if (previousMessageCount === 0 && messageCount > 0) {
    return true;
  }

  if (messageCount > previousMessageCount) {
    if (lastMessageRole === "user") {
      return true;
    }

    return isNearBottom;
  }

  return isNearBottom;
}
