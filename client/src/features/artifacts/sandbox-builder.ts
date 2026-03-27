import type { ArtifactType } from "@claude-copy/shared";

export function buildSandboxHtml(type: ArtifactType, content: string): string | null {
  switch (type) {
    case "react":
      return `<!DOCTYPE html><html><head>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{margin:0;font-family:system-ui;background:#09090b;color:#fafafa}</style>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="react,typescript">
${content}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(typeof App!=='undefined'?App:()=>React.createElement('div','','Component')));
</script></body></html>`;
    case "html":
      return content;
    case "svg":
      return `<!DOCTYPE html><html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#09090b">${content}</body></html>`;
    case "mermaid":
      return `<!DOCTYPE html><html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<style>body{margin:0;display:flex;justify-content:center;padding:2rem;background:#09090b;color:#fafafa}</style>
</head><body><pre class="mermaid">${content}</pre>
<script>mermaid.initialize({startOnLoad:true,theme:'dark'})</script></body></html>`;
    default:
      return null;
  }
}
