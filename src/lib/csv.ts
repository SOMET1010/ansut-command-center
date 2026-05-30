export function toCSV(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((r) => columns.map((c) => escape(r[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

/**
 * Génère un CSV en arrière-plan par lots, en cédant la main au navigateur
 * entre chaque lot pour ne pas bloquer l'UI sur de gros volumes.
 */
export async function toCSVChunked(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  options?: { chunkSize?: number; onProgress?: (done: number, total: number) => void },
): Promise<string> {
  const chunkSize = options?.chunkSize ?? 500;
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const parts: string[] = [columns.map((c) => c.label).join(",")];
  const yieldToUI = () =>
    new Promise<void>((resolve) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(() => resolve());
      else setTimeout(resolve, 0);
    });
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    for (const r of slice) parts.push(columns.map((c) => escape(r[c.key])).join(","));
    options?.onProgress?.(Math.min(i + chunkSize, rows.length), rows.length);
    await yieldToUI();
  }
  return parts.join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
