import { describe, it, expect } from "vitest";
import { detectArtifacts } from "../detector.js";

describe("detectArtifacts", () => {
  it("detects React component", () => {
    const code = Array(15).fill("").map((_, i) =>
      i === 0 ? "export default function App() {" :
      i === 1 ? "  return (" :
      i === 2 ? "    <div>" :
      i === 13 ? "  );" :
      i === 14 ? "}" :
      `    <p>Line ${i}</p>`
    ).join("\n");
    const result = detectArtifacts("```tsx\n" + code + "\n```");
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("react");
    expect(result[0].title).toBe("App");
  });

  it("detects Mermaid diagram", () => {
    const result = detectArtifacts("```mermaid\ngraph TD\n  A --> B\n  B --> C\n```");
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("mermaid");
  });

  it("does not detect short snippets", () => {
    const result = detectArtifacts("```typescript\nconst x = 1;\nconsole.log(x);\n```");
    expect(result.length).toBe(0);
  });

  it("detects HTML document", () => {
    const code = Array(12).fill("").map((_, i) =>
      i === 0 ? "<!DOCTYPE html>" : i === 1 ? "<html>" : i === 11 ? "</html>" : `<p>Line ${i}</p>`
    ).join("\n");
    const result = detectArtifacts("```html\n" + code + "\n```");
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("html");
  });
});
