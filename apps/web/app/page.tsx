'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileText,
  ImageDown,
  Languages,
  Loader2,
  Maximize2,
  Printer,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const languages = [
  'English',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
];

const models = ['gemini-3.1-pro-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
const temperatures = ['0.1', '0.2'];

type Tab = 'user' | 'admin';

const progressSteps = [
  { at: 8, label: 'Preparing selected images' },
  { at: 22, label: 'Uploading pages to the API' },
  { at: 42, label: 'Connecting to Gemini' },
  { at: 68, label: 'Extracting and ordering questions' },
  { at: 88, label: 'Formatting printable output' },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>('user');
  const [language, setLanguage] = useState('English');
  const [model, setModel] = useState('gemini-3.1-pro-preview');
  const [temperature, setTemperature] = useState('0.1');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const imageCountLabel = useMemo(() => {
    if (!images.length) {
      return 'No images selected';
    }

    return `${images.length} image${images.length === 1 ? '' : 's'} selected`;
  }, [images.length]);

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    imageUrls.forEach((url) => URL.revokeObjectURL(url));

    setImages(files);
    setImageUrls(files.map((file) => URL.createObjectURL(file)));
    setError('');
    setStatus('');
    setProgress(0);
    setIsComplete(false);
  }

  async function extractText() {
    if (!images.length) {
      setError('Select at least one image first.');
      return;
    }

    setIsLoading(true);
    setIsComplete(false);
    setError('');
    setProgress(6);
    setStatus(`Preparing ${images.length} image${images.length === 1 ? '' : 's'}`);

    const form = new FormData();
    images.forEach((image) => form.append('image', image));
    form.append('language', language);
    form.append('model', model);
    form.append('temperature', temperature);

    let progressTimer: number | undefined;

    try {
      progressTimer = window.setInterval(() => {
        setProgress((current) => {
          const next = Math.min(current + 4, 92);
          const step = [...progressSteps].reverse().find((item) => next >= item.at);

          if (step) {
            setStatus(step.label);
          }

          return next;
        });
      }, 900);

      const response = await fetch(`${apiUrl}/extract`, {
        method: 'POST',
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'Extraction failed');
      }

      setResult(data.text);
      setProgress(100);
      setIsComplete(true);
      setStatus(`Completed ${data.imageCount ?? images.length} image${(data.imageCount ?? images.length) === 1 ? '' : 's'} with ${data.model} at ${data.temperature}`);
    } catch (extractError) {
      const message = extractError instanceof Error ? extractError.message : 'Extraction failed';
      setError(message);
      setStatus('');
      setProgress(0);
      setIsComplete(false);
    } finally {
      if (progressTimer) {
        window.clearInterval(progressTimer);
      }
      setIsLoading(false);
    }
  }

  function downloadImages() {
    if (!imageUrls.length) {
      return;
    }

    imageUrls.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = images[index]?.name ?? `question-paper-image-${index + 1}`;
      link.click();
    });
  }

  function downloadText() {
    downloadBlob(new Blob([result], { type: 'text/plain;charset=utf-8' }), 'extracted-questions.txt');
  }

  function downloadWord() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Extracted Questions</title></head><body><pre style="white-space:pre-wrap;font-family:Arial, sans-serif;font-size:14pt;line-height:1.5">${escapeHtml(result)}</pre></body></html>`;
    downloadBlob(new Blob([html], { type: 'application/msword;charset=utf-8' }), 'extracted-questions.doc');
  }

  function printPdf() {
    const printable = window.open('', '_blank', 'width=900,height=700');
    if (!printable) {
      setError('Allow pop-ups to print the document.');
      return;
    }

    printable.document.write(`<!doctype html><html><head><title>Extracted Questions</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111827}pre{white-space:pre-wrap;font-size:14pt;line-height:1.5}</style></head><body><pre>${escapeHtml(result)}</pre></body></html>`);
    printable.document.close();
    printable.focus();
    printable.print();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Question paper OCR</p>
          <h1>Image Question Extractor</h1>
          <p className="subtitle">Upload one or more pages, extract handwritten questions, then edit and export printable output.</p>
        </div>
        <div className="tabs" aria-label="Sections">
          <button className={tab === 'user' ? 'active' : ''} onClick={() => setTab('user')} type="button">
            <UserRound size={18} />
            User
          </button>
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')} type="button">
            <ShieldCheck size={18} />
            Admin
          </button>
        </div>
      </header>

      {tab === 'user' ? (
        <section className="workspace">
          <div className="panel input-panel">
            <div className="panel-title">
              <Upload size={20} />
              <h2>Images</h2>
            </div>

            <div className="dropzone">
              {imageUrls.length ? (
                <div className="preview-grid">
                  {imageUrls.slice(0, 4).map((url, index) => (
                    <button className="preview-tile" key={url} onClick={() => setPreviewIndex(index)} type="button" title={`Preview image ${index + 1}`}>
                      <img alt={`Selected question paper ${index + 1}`} src={url} />
                      <span>
                        <Maximize2 size={15} />
                      </span>
                    </button>
                  ))}
                  {imageUrls.length > 4 ? <strong>+{imageUrls.length - 4}</strong> : null}
                  <label className="add-more">
                    <input accept="image/*" multiple onChange={onImageChange} type="file" />
                    Add images
                  </label>
                </div>
              ) : (
                <label className="upload-hit">
                  <input accept="image/*" multiple onChange={onImageChange} type="file" />
                  <span>Select one or more question paper images</span>
                </label>
              )}
            </div>
            <p className="image-count">{imageCountLabel}</p>

            <div className="control-row">
              <label>
                <span>
                  <Languages size={16} />
                  Language
                </span>
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  {languages.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button className="icon-button" onClick={downloadImages} disabled={!imageUrls.length} type="button" title="Download selected images">
                <ImageDown size={18} />
              </button>
            </div>

            <button className="primary" onClick={extractText} disabled={isLoading || !images.length} type="button">
              {isLoading ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
              Extract text
            </button>

            {isLoading || progress > 0 ? (
              <div className="progress-wrap" aria-live="polite">
                <div className="progress-meta">
                  <span>{status || 'Waiting'}</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="progress-track" aria-label="Extraction progress" aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} role="progressbar">
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}

            {status ? <p className="status">{status}</p> : null}
            {error ? <p className="error">{error}</p> : null}
          </div>

          <div className="panel output-panel">
            <div className="panel-title">
              <FileText size={20} />
              <h2>Printable Output</h2>
              {isComplete ? (
                <span className="complete-badge">
                  <Sparkles size={15} />
                  Ready
                </span>
              ) : null}
            </div>
            <div className={isComplete ? 'output-complete output-editor' : 'output-editor'}>
              <textarea
                value={result}
                onChange={(event) => setResult(event.target.value)}
                placeholder="Extracted text will appear here."
              />
            </div>
            <div className="actions">
              <button onClick={downloadText} disabled={!result} type="button">
                <Download size={18} />
                Text
              </button>
              <button onClick={downloadWord} disabled={!result} type="button">
                <Download size={18} />
                Word
              </button>
              <button onClick={printPdf} disabled={!result} type="button">
                <Printer size={18} />
                PDF
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="admin-grid">
          <div className="panel">
            <div className="panel-title">
              <Settings size={20} />
              <h2>Gemini Settings</h2>
            </div>
            <label>
              <span>Model</span>
              <select value={model} onChange={(event) => setModel(event.target.value)}>
                {models.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Temperature</span>
              <select value={temperature} onChange={(event) => setTemperature(event.target.value)}>
                {temperatures.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>API URL</span>
              <input readOnly value={apiUrl} />
            </label>
          </div>
          <div className="panel prompt-panel">
            <div className="panel-title">
              <FileText size={20} />
              <h2>Extraction Prompt</h2>
            </div>
            <pre>{`Please perform a high-precision extraction of the text from these images.
Follow these rules:
1. IDENTIFY ALL QUESTIONS: Look for every bit of handwriting, even if it's in the corners or small.
2. SEQUENTIAL ORDERING: Arrange the questions exactly as numbered in the document. If 'set 2' has questions iii and iv missing in the digital output but they exist in the image, ensure they are captured.
3. STRUCTURE: Use headers for school name, subject, class, and marks. Use bullet points for sub-questions.
4. CORRECTION: Fix minor spelling errors in the handwriting but do not change the meaning of the question.
5. FORMATTING: Return the output in a layout that is ready for printing.`}</pre>
          </div>
        </section>
      )}

      {previewIndex !== null && imageUrls[previewIndex] ? (
        <div className="image-modal" role="dialog" aria-modal="true" aria-label="Image preview" onClick={() => setPreviewIndex(null)}>
          <div className="image-modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewIndex(null)} type="button" title="Close preview">
              <X size={20} />
            </button>
            <img alt={`Selected question paper ${previewIndex + 1}`} src={imageUrls[previewIndex]} />
            <p>{images[previewIndex]?.name ?? `Image ${previewIndex + 1}`}</p>
          </div>
        </div>
      ) : null}

      <footer className="footer">
        <span>Gemini-powered extraction</span>
        <span>Editable text</span>
        <span>Word and PDF export</span>
      </footer>
    </main>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
