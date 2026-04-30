export type CodeBlock = {
  language: string
  filename?: string
  code: string
}

const fenceRe = /```([^\n`]*)\n([\s\S]*?)```/g

function parseFenceInfo(info: string) {
  const clean = info.trim()
  const [rawLanguage = "text", ...rest] = clean.split(/\s+/)
  const language = (rawLanguage || "text").toLowerCase()
  const meta = rest.join(" ")
  const filename =
    meta.match(/(?:file(?:name)?|path|title)=?["']?([\w./-]+\.[a-zA-Z0-9]+)["']?/)?.[1] ||
    meta.match(/([\w./-]+\.[a-zA-Z0-9]+)/)?.[1]
  return { language, filename }
}

function withPreviewDefaults(html: string): string {
  const base = `<style id="questmint-preview-defaults">*,*::before,*::after{box-sizing:border-box}html,body{width:100%;min-height:100%;margin:0}body{overflow-x:hidden}</style>`
  if (/<head[\s>]/i.test(html)) return html.replace(/<\/head>/i, `${base}</head>`)
  return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${base}</head>`)
}

export function extractCodeBlocks(markdown: string): CodeBlock[] {
  const out: CodeBlock[] = []
  let m: RegExpExecArray | null
  while ((m = fenceRe.exec(markdown))) {
    const parsed = parseFenceInfo(m[1] || "text")
    let lang = parsed.language
    let code = m[2]
    let filename: string | undefined = parsed.filename
    // Detect first-line file path comment like // src/App.tsx or <!-- index.html -->
    const firstLine = code.split("\n", 1)[0] || ""
    const fileMatch =
      firstLine.match(/^\s*(?:\/\/|#|<!--)\s*([\w./-]+\.[a-zA-Z0-9]+)\s*(?:-->)?\s*$/)
    if (fileMatch) {
      filename = fileMatch[1]
      code = code.split("\n").slice(1).join("\n")
    }
    // If language is missing/text but content looks like HTML, treat as html
    if ((lang === "text" || !lang) && /<!doctype html|<html[\s>]|<body[\s>]/i.test(code)) {
      lang = "html"
    }
    out.push({ language: lang, filename, code: code.trimEnd() })
  }
  // Fallback: no fenced blocks but markdown itself contains a full HTML document (model forgot fences)
  if (out.length === 0 && /<!doctype html[\s>]|<html[\s>][\s\S]*<\/html>/i.test(markdown)) {
    const docMatch = markdown.match(/<!doctype html[\s\S]*?<\/html>|<html[\s\S]*?<\/html>/i)
    if (docMatch) out.push({ language: "html", filename: "preview.html", code: docMatch[0].trim() })
  }
  return out
}

/** Build a single self-contained HTML document for the iframe preview. */
export function buildPreviewHtml(blocks: CodeBlock[]): string | null {
  // 1) Prefer a complete <html> document
  const html =
    blocks.find((b) => b.language === "html" && /<html[\s>]/i.test(b.code) && b.filename?.toLowerCase().includes("preview")) ||
    blocks.find((b) => b.language === "html" && /<html[\s>]/i.test(b.code) && b.filename?.toLowerCase().includes("index")) ||
    blocks.find((b) => b.language === "html" && /<html[\s>]/i.test(b.code))
  if (html) return withPreviewDefaults(html.code)

  // 2) Combine first html fragment + first css + first js
  const htmlFrag =
    blocks.find((b) => b.language === "html" && b.filename?.toLowerCase().includes("preview")) ||
    blocks.find((b) => b.language === "html" && b.filename?.toLowerCase().includes("index")) ||
    blocks.find((b) => b.language === "html")
  const css = blocks.find((b) => b.language === "css")
  const js = blocks.find((b) => ["js", "javascript"].includes(b.language))

  if (htmlFrag) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script>${
      css ? `<style>${css.code}</style>` : ""
    }<style>*,*::before,*::after{box-sizing:border-box}html,body{width:100%;min-height:100%;margin:0}body{overflow-x:hidden}</style></head><body>${htmlFrag.code}${js ? `<script>${js.code}<\/script>` : ""}</body></html>`
  }

  // 3) JSX/TSX → not directly runnable; show notice
  const jsx = blocks.find((b) => ["jsx", "tsx"].includes(b.language))
  if (jsx) {
    return `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui;background:#0F172A;color:#cbd5e1;padding:2rem"><h2 style="color:#a78bfa">⚠️ React/TSX preview</h2><p>Live preview supports HTML/CSS/JS. Copy the generated React code into your project to run it.</p></body></html>`
  }
  return null
}