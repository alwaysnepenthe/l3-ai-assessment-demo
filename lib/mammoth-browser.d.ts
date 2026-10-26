declare module "mammoth/mammoth.browser" {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: Array<{ type: string; message: string }> }>;
}

declare module "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url" {
  const workerUrl: string;
  export default workerUrl;
}
