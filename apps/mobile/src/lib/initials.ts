const ARABIC_SCRIPT = /[؀-ۿ]/;
const MAX_INITIALS = 2;

export function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((part) => Array.from(part)[0] ?? '');
  return initials.join(ARABIC_SCRIPT.test(name) ? ' ' : '');
}
