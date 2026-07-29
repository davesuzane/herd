// src/utils/validateFile.ts
export function validateFile(
  file: File,
  { maxSizeMB, allowedTypes }: { maxSizeMB: number; allowedTypes: string[] },
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `That file type isn't allowed. Use: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}.`;
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File's too big — keep it under ${maxSizeMB}MB.`;
  }
  return null;
}
