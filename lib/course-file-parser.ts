export type ParsedCourseFile = {
  text: string;
  characters: number;
  paragraphs: number;
  pages?: number;
  type: "text" | "docx" | "pdf";
};

function normalize(text: string) {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export async function parseCourseFile(file: File): Promise<ParsedCourseFile> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!file.size) throw new Error("文件为空，请重新选择课程资料");
  let text = "";
  let pages: number | undefined;
  let type: ParsedCourseFile["type"] = "text";

  if (ext === "txt" || ext === "md" || ext === "markdown") {
    text = await file.text();
  } else if (ext === "docx") {
    type = "docx";
    const mammoth = await import("mammoth/mammoth.browser");
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      text = result.value;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      if (/central directory|zip file|zip.*end/i.test(message)) {
        throw new Error("DOCX 文件包无法读取。请用 Word 打开后另存为新的 .docx 文件（不要只修改扩展名），并确认文件未加密；也可以另存为 TXT 或 Markdown 后上传。");
      }
      throw reason;
    }
  } else if (ext === "pdf") {
    type = "pdf";
    // PDF.js is browser-only here. Keep it out of the server/RSC execution path:
    // its display helpers reference `window` and throw during SSR if evaluated.
    if (typeof window === "undefined") {
      throw new Error("PDF 课程资料请在浏览器页面中解析后再上传");
    }
    const [pdfjs, workerAsset] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    ]);
    // Load the worker URL lazily with PDF.js. A static ?url import makes the
    // browser-only worker part of the SSR module graph in vinext.
    const pdfWorkerUrl = workerAsset.default;
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const buffer = await file.arrayBuffer();
    const header = new TextDecoder().decode(
      new Uint8Array(buffer, 0, Math.min(1024, buffer.byteLength)),
    );
    if (!header.includes("%PDF-")) {
      throw new Error("该文件内容不是有效的 PDF。请重新导出 PDF，或上传 TXT、Markdown、DOCX 文件。");
    }
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    pages = pdf.numPages;
    const chunks: string[] = [];
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      chunks.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
    }
    text = chunks.join("\n\n");
  } else {
    throw new Error("支持 TXT、Markdown、DOCX 和 PDF 课程资料");
  }

  text = normalize(text);
  if (!text) throw new Error("文件中没有识别到可用文本");
  return { text, characters: text.length, paragraphs: text.split(/\n+/).filter(Boolean).length, pages, type };
}

export function analyzeCourseText(text: string) {
  const lines = text.split(/\n+/).map(line => line.trim()).filter(line => line.length >= 4);
  const sentences = text.split(/(?<=[。！？!?])/).map(item => item.trim()).filter(item => item.length >= 12);
  const headlineCandidates = lines.filter(line => line.length <= 28 && !/[。！？]$/.test(line));
  const fallbacks = sentences.map(sentence => sentence.replace(/[，。！？：:]/g, "").slice(0, 16));
  const labels = Array.from(new Set([...headlineCandidates, ...fallbacks])).slice(0, 5);
  while (labels.length < 5) labels.push(`课程核心要点 ${labels.length + 1}`);
  const guideSource = sentences.slice(0, 4).join("");
  const guide = guideSource.length > 220 ? `${guideSource.slice(0, 218)}…` : guideSource;
  return {
    guide: guide || `本节围绕${labels.slice(0, 3).join("、")}展开，请按照课程节点逐步建立知识主线。`,
    nodes: labels.map((label, index) => ({ ratio: .08 + index * .21, label })),
  };
}

