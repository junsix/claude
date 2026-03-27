import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.min.css";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
      components={{
        pre({ children }) {
          return (
            <div className="relative group my-3">
              <button
                className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                style={{ background: "var(--color-border-light)", color: "var(--color-text-secondary)" }}
                onClick={() => {
                  const el = document.querySelector("pre code");
                  if (el) navigator.clipboard.writeText(el.textContent ?? "");
                }}
              >
                Copy
              </button>
              <pre className="overflow-x-auto rounded-lg p-4 text-sm border" style={{ background: "#F8F7F5", borderColor: "var(--color-border)" }}>
                {children}
              </pre>
            </div>
          );
        },
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return <code className="px-1.5 py-0.5 rounded text-sm" style={{ background: "#F0EBE3", color: "#C4684A" }} {...props}>{children}</code>;
          }
          return <code className={className} {...props}>{children}</code>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
