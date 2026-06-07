"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button, Message } from "@/components/ui";

export function InviteCodeModal({
  inviteCode,
  open,
  onClose,
}: {
  inviteCode: string;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function handleCopy() {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Could not copy to clipboard. Select the code and copy manually.");
    }
  }

  return (
    <Modal open={open} title="Invite athlete" onClose={onClose}>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Share this invite code with an athlete so they can link to you.
      </p>
      {inviteCode ? (
        <>
          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center font-mono text-3xl tracking-[0.2em] dark:border-zinc-700 dark:bg-zinc-800">
            {inviteCode}
          </div>
          {copyError ? <Message tone="error">{copyError}</Message> : null}
          <div className="mt-4 flex justify-center">
            <Button type="button" fullWidth={false} onClick={handleCopy}>
              {copied ? "Copied" : "Copy invite code"}
            </Button>
          </div>
        </>
      ) : (
        <Message tone="error">
          Your invite code is not available yet. Try signing out and back in.
        </Message>
      )}
    </Modal>
  );
}
