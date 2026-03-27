import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.min.css";

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
            <div className="relative group">
              <button
                className="absolute top-2 right-2 text-xs bg-zinc-700 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                onClick={() => {
                  const el = document.querySelector("pre code");
                  if (el) navigator.clipboard.writeText(el.textContent ?? "");
                }}
              >
                Copy
              </button>
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm">{children}</pre>
            </div>
          );
        },
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
          }
          return <code className={className} {...props}>{children}</code>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
