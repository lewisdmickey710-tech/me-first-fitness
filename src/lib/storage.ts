// Storage keys are built from a phone/browser-supplied filename, which can
// contain spaces, unicode, or characters a storage path shouldn't have --
// strip it down to something safe rather than trusting it verbatim.
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  return cleaned || "file";
}
