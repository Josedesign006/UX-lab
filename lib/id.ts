/** Client-safe id generator. */
export function cid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}
