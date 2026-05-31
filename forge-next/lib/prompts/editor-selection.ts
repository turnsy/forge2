export function getCaretIndex(root: HTMLElement): number {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return 0;
  }

  const range = selection.getRangeAt(0);

  if (!root.contains(range.startContainer)) {
    return 0;
  }

  const preRange = range.cloneRange();
  preRange.selectNodeContents(root);
  preRange.setEnd(range.startContainer, range.startOffset);

  return preRange.toString().length;
}

export function setCaretIndex(root: HTMLElement, index: number): void {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  let remaining = Math.max(0, index);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const length = node.textContent?.length ?? 0;

    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

    remaining -= length;
    node = walker.nextNode();
  }

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
