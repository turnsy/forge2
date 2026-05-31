function mentionLinearLength(label: string): number {
  return `@${label}`.length;
}

function isMentionElement(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && Boolean(node.dataset.mentionId);
}

function getEditorWalkNodes(root: HTMLElement): Node[] {
  return Array.from(root.childNodes).filter((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent?.length ?? 0) > 0;
    }

    return isMentionElement(node);
  });
}

function getNodeLinearLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.length ?? 0;
  }

  if (isMentionElement(node)) {
    return mentionLinearLength(node.dataset.mentionLabel ?? "");
  }

  return 0;
}

function setRangeAtLinearOffset(
  range: Range,
  node: Node,
  remaining: number,
  length: number,
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    range.setStart(node, remaining);
    return;
  }

  if (!isMentionElement(node)) {
    return;
  }

  if (remaining >= length) {
    range.setStartAfter(node);
    return;
  }

  if (remaining === 0) {
    range.setStartBefore(node);
    return;
  }

  const labelNode = Array.from(node.childNodes).find(
    (child) => child.nodeType === Node.TEXT_NODE,
  );

  if (labelNode) {
    range.setStart(labelNode, Math.min(Math.max(0, remaining - 1), labelNode.textContent?.length ?? 0));
    return;
  }

  range.setStartAfter(node);
}

export function getCaretIndex(root: HTMLElement): number {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return 0;
  }

  const range = selection.getRangeAt(0);
  const { startContainer, startOffset } = range;

  if (!root.contains(startContainer)) {
    return 0;
  }

  if (startContainer === root) {
    let index = 0;

    for (let childIndex = 0; childIndex < startOffset; childIndex += 1) {
      const child = root.childNodes[childIndex];

      if (child) {
        index += getNodeLinearLength(child);
      }
    }

    return index;
  }

  let index = 0;

  for (const node of getEditorWalkNodes(root)) {
    const length = getNodeLinearLength(node);

    if (node === startContainer && node.nodeType === Node.TEXT_NODE) {
      return index + startOffset;
    }

    if (isMentionElement(node) && node.contains(startContainer)) {
      if (startContainer.nodeType === Node.TEXT_NODE) {
        return index + 1 + startOffset;
      }

      return index + length;
    }

    index += length;
  }

  return index;
}

export function setCaretIndex(root: HTMLElement, index: number): void {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  let remaining = Math.max(0, index);
  const range = document.createRange();

  for (const node of getEditorWalkNodes(root)) {
    const length = getNodeLinearLength(node);

    if (remaining <= length) {
      setRangeAtLinearOffset(range, node, remaining, length);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

    remaining -= length;
  }

  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function focusCaretAtIndex(root: HTMLElement, index: number): void {
  root.focus({ preventScroll: true });
  setCaretIndex(root, index);
}

export function getCoordinatesAtLinearIndex(
  root: HTMLElement,
  index: number,
): { top: number; left: number; bottom: number } {
  const editorRect = root.getBoundingClientRect();
  let remaining = Math.max(0, index);
  const range = document.createRange();

  for (const node of getEditorWalkNodes(root)) {
    const length = getNodeLinearLength(node);

    if (remaining <= length) {
      setRangeAtLinearOffset(range, node, remaining, length);
      range.collapse(true);

      if (typeof range.getBoundingClientRect === "function") {
        const rect = range.getBoundingClientRect();
        return { top: rect.top, left: rect.left, bottom: rect.bottom };
      }

      return {
        top: editorRect.top,
        left: editorRect.left,
        bottom: editorRect.bottom,
      };
    }

    remaining -= length;
  }

  range.selectNodeContents(root);
  range.collapse(false);

  if (typeof range.getBoundingClientRect === "function") {
    const rect = range.getBoundingClientRect();
    return {
      top: rect.top || editorRect.top,
      left: rect.left || editorRect.left,
      bottom: rect.bottom || editorRect.bottom,
    };
  }

  return {
    top: editorRect.top,
    left: editorRect.left,
    bottom: editorRect.bottom,
  };
}
