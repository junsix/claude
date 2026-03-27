import path from "node:path";

export function validatePath(requestedPath: string, allowedPaths: string[]): boolean {
  const resolved = path.resolve(requestedPath);
  return allowedPaths.some((allowed) => {
    const resolvedAllowed = path.resolve(allowed);
    return resolved === resolvedAllowed || resolved.startsWith(resolvedAllowed + path.sep);
  });
}
