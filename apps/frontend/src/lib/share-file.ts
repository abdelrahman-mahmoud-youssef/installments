function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const INVALID_FILENAME_CHARS_PATTERN = /[<>:"/\\|?*\x00-\x1f]/g;
const WHITESPACE_PATTERN = /\s+/g;

export function sanitizeFileName(name: string, fallback: string): string {
  const sanitized = name.replace(INVALID_FILENAME_CHARS_PATTERN, '').replace(WHITESPACE_PATTERN, ' ').trim();
  return sanitized.length > 0 ? sanitized : fallback;
}

export function isShareAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function shareOrDownloadPdf(blob: Blob, fileName: string, title: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }
  downloadBlob(blob, fileName);
}
