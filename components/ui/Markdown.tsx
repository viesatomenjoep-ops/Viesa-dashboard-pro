import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Rendert markdown met een nette, huisstijl-vriendelijke opmaak. */
export function Markdown({ tekst }: { tekst: string }) {
  return (
    <div className="prose-viesa text-sm text-navy">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {tekst || "_Nog geen inhoud_"}
      </ReactMarkdown>
    </div>
  );
}
