import type { ArtifactType } from "@claude-copy/shared";

interface DetectedArtifact {
  type: ArtifactType;
  language: string;
  content: string;
  title: string;
}

const MERMAID_STARTERS = ["graph", "flowchart", "sequenceDiagram", "classDiagram", "erDiagram", "gantt", "pie", "gitGraph"];

export function detectArtifacts(responseText: string): DetectedArtifact[] {
  const artifacts: DetectedArtifact[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(responseText)) !== null) {
    const lang = match[1] ?? "";
    const code = match[2].trim();
    const lines = code.split("\n").length;

    if ((lang === "tsx" || lang === "jsx") && lines >= 10 && /export\s+default/.test(code) && /<\w/.test(code)) {
      artifacts.push({ type: "react", language: lang, content: code, title: extractComponentName(code) });
      continue;
    }
    if (lang === "html" && lines >= 10 && (/<!DOCTYPE/i.test(code) || /<html/i.test(code))) {
      artifacts.push({ type: "html", language: "html", content: code, title: "HTML Document" });
      continue;
    }
    if ((lang === "svg" || lang === "xml") && lines >= 5 && /<svg\b/.test(code)) {
      artifacts.push({ type: "svg", language: "svg", content: code, title: "SVG Graphic" });
      continue;
    }
    if (lang === "mermaid" && lines >= 3 && MERMAID_STARTERS.some((s) => code.startsWith(s))) {
      artifacts.push({ type: "mermaid", language: "mermaid", content: code, title: "Diagram" });
      continue;
    }
  }
  return artifacts;
}

function extractComponentName(code: string): string {
  const match = /export\s+default\s+function\s+(\w+)/.exec(code);
  return match?.[1] ?? "Component";
}
