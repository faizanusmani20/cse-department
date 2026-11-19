/* CSE Notes - client-side PDF compression.
   Runs in the browser before an upload so the backend stores smaller files.

   Two passes, cheapest first:
   1. Re-save with pdf-lib using object streams and stripped metadata.
   2. If that is not enough, rasterise pages to JPEG at a modest scale/quality
      and rebuild the PDF. This is lossy but very effective for scanned notes.
   The original file is always used if compression would make it bigger. */

const PDF_COMPRESS = {
  minBytes: 120 * 1024,      // skip tiny files; not worth the work
  targetRatio: 0.9,          // try harder below 90% of the original size
  rasterScale: 1.4,          // ~101 DPI; good balance of quality and size
  maxRasterWidth: 1600,      // cap raster width for very wide pages
  jpegQuality: 0.72,
  maxRasterPages: 60         // avoid freezing the tab on huge documents
};

/* Human-readable byte size. */
function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

/* Compress a PDF File. Resolves to
   { file, originalSize, size, saved, mode } where saved is 0..1. */
async function compressPdf(file, onProgress = () => {}) {
  if (!window.PDFLib || file.size < PDF_COMPRESS.minBytes) {
    return { file, originalSize: file.size, size: file.size, saved: 0, mode: 'none' };
  }

  const original = new Uint8Array(await file.arrayBuffer());
  let best = original, mode = 'none';

  /* Pass 1 - structural optimisation. */
  try {
    onProgress(0.05);
    const doc = await PDFLib.PDFDocument.load(original, { ignoreEncryption: true, updateMetadata: false });
    doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]);
    doc.setProducer('CSE Notes'); doc.setCreator('CSE Notes');
    const optimized = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    if (optimized.length < best.length) { best = optimized; mode = 'optimised'; }
  } catch (err) {
    console.warn('[pdf-compress] optimisation pass failed:', err);
  }

  /* Pass 2 - rasterise only if pass 1 did not reach the target. */
  if (best.length > original.length * PDF_COMPRESS.targetRatio) {
    try {
      const raster = await rasterizePdf(original, onProgress);
      if (raster && raster.length < best.length) { best = raster; mode = 'rasterised'; }
    } catch (err) {
      console.warn('[pdf-compress] raster pass failed:', err);
    }
  }

  onProgress(1);

  /* Never send a bigger file than the original. */
  if (best.length >= original.length) {
    return { file, originalSize: original.length, size: original.length, saved: 0, mode: 'none' };
  }

  const out = new File([best], file.name.replace(/\.pdf$/i, '') + '.pdf', { type: 'application/pdf', lastModified: Date.now() });
  return { file: out, originalSize: original.length, size: best.length, saved: 1 - best.length / original.length, mode };
}

/* Wrapper that always resolves; falls back to the original file on any error. */
async function safeCompressPdf(file, onProgress) {
  try { return await compressPdf(file, onProgress); }
  catch (err) {
    console.warn('[pdf-compress] falling back to the original file:', err);
    return { file, originalSize: file.size, size: file.size, saved: 0, mode: 'none' };
  }
}

/* Render every page to JPEG and rebuild a smaller, image-only PDF. */
async function rasterizePdf(bytes, onProgress = () => {}) {
  if (!window.pdfjsLib || !window.PDFLib) return null;

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  if (pdf.numPages > PDF_COMPRESS.maxRasterPages) return null;

  const out = await PDFLib.PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress((i - 1) / pdf.numPages);
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(PDF_COMPRESS.rasterScale, PDF_COMPRESS.maxRasterWidth / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', PDF_COMPRESS.jpegQuality));
    if (!blob) continue;
    const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const pageOut = out.addPage([base.width, base.height]);
    pageOut.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
  }
  onProgress(1);
  return await out.save({ useObjectStreams: true, addDefaultPage: false });
}
