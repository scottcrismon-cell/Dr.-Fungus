import {
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  X,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  runDiagnosticPlaceholder,
  type DiagnosticResult,
} from "./lib/diagnostics";
import { isSupabaseConfigured, saveAssessment } from "./lib/storage";

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];

type Stage = "idle" | "ready" | "saving" | "complete" | "error";

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [concern, setConcern] = useState("Toenail change");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!document.modelContext?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(
      document.modelContext.registerTool(
        {
          name: "stage_photo_check",
          title: "Stage a photo check",
          description:
            "Prepare the visible Dr. Fungus intake form with a concern category and optional notes. The user must still choose and consent to upload their own photo.",
          inputSchema: {
            type: "object",
            properties: {
              concern: {
                type: "string",
                enum: [
                  "Toenail change",
                  "Skin irritation or rash",
                  "Discoloration",
                  "Swelling or soreness",
                  "Other concern",
                ],
              },
              notes: { type: "string", maxLength: 500 },
            },
            required: ["concern"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (!input || typeof input !== "object") {
              throw new Error("A concern is required.");
            }

            const staged = input as { concern?: unknown; notes?: unknown };
            const allowed = [
              "Toenail change",
              "Skin irritation or rash",
              "Discoloration",
              "Swelling or soreness",
              "Other concern",
            ];

            if (typeof staged.concern !== "string" || !allowed.includes(staged.concern)) {
              throw new Error("Choose a supported concern category.");
            }
            if (staged.notes !== undefined && typeof staged.notes !== "string") {
              throw new Error("Notes must be text.");
            }

            setConcern(staged.concern);
            setNotes((staged.notes || "").slice(0, 500));
            document.querySelector<HTMLElement>(".dropzone")?.focus();
            return {
              status: "staged",
              concern: staged.concern,
              nextStep: "The user must choose a photo and confirm consent.",
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch((registrationError) => {
      console.warn("WebMCP tool registration was unavailable.", registrationError);
    });

    return () => lifecycle.abort();
  }, []);

  const chooseFile = (selected?: File) => {
    if (!selected) return;
    setError("");
    setResult(null);

    if (!acceptedTypes.includes(selected.type)) {
      setError("Please choose a JPG, PNG, WEBP, or HEIC image.");
      setStage("error");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("That image is larger than 12 MB. Please choose a smaller file.");
      setStage("error");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStage("ready");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setConsent(false);
    setStage("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file || !consent) return;
    setStage("saving");
    setError("");

    try {
      const saved = await saveAssessment({ file, concern, notes });
      const diagnostic = await runDiagnosticPlaceholder({
        assessmentId: saved.id,
        imageUrl: saved.imageUrl,
        concern,
        notes,
      });
      setResult(diagnostic);
      setStage("complete");
    } catch (submissionError) {
      console.error(submissionError);
      setError("We couldn’t save this photo. Please try again.");
      setStage("error");
    }
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Dr. Fungus home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>Dr. Fungus</span>
        </a>
        <div className="header-note">
          <LockKeyhole size={16} aria-hidden="true" />
          Private by design
        </div>
      </header>

      <main id="top">
        <section className="workspace" aria-labelledby="page-title">
          <div className="intro-panel">
            <div className="intro-photo" aria-hidden="true">
              <img src="/foot-care-editorial.png" alt="" />
              <div className="photo-wash" />
            </div>
            <div className="intro-copy">
              <span className="eyebrow">A FIRST LOOK, FROM HOME</span>
              <h1 id="page-title">
                Show us what’s <em>changed.</em>
              </h1>
              <p>
                Add one clear photo and a little context. This prototype safely
                prepares your case for a future diagnostic model.
              </p>
              <div className="trust-row">
                <span><ShieldCheck size={17} /> Your photo stays private</span>
                <span><Camera size={17} /> One image is enough to start</span>
              </div>
            </div>
          </div>

          <div className="intake-card">
            <div className="step-heading">
              <span className="step-number">01</span>
              <div>
                <h2>Add a clear photo</h2>
                <p>Use good light and keep the affected area in focus.</p>
              </div>
            </div>

            {!preview ? (
              <div
                className={`dropzone ${dragging ? "is-dragging" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
              >
                <div className="upload-icon"><ImagePlus size={28} /></div>
                <strong>Drop your photo here</strong>
                <span>or tap to choose from your device</span>
                <small>JPG, PNG, WEBP or HEIC · up to 12 MB</small>
              </div>
            ) : (
              <div className="photo-preview">
                <img src={preview} alt="Selected foot concern" />
                <div className="preview-meta">
                  <div>
                    <span className="ready-pill"><Check size={14} /> Photo ready</span>
                    <strong>{file?.name}</strong>
                    <small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ""}</small>
                  </div>
                  <button className="icon-button" onClick={removeFile} aria-label="Remove photo">
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleInput}
            />

            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="form-grid">
              <label>
                <span>What are you noticing?</span>
                <select value={concern} onChange={(event) => setConcern(event.target.value)}>
                  <option>Toenail change</option>
                  <option>Skin irritation or rash</option>
                  <option>Discoloration</option>
                  <option>Swelling or soreness</option>
                  <option>Other concern</option>
                </select>
              </label>
              <label>
                <span>Anything else? <small>Optional</small></span>
                <textarea
                  rows={3}
                  value={notes}
                  maxLength={500}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="When did you first notice it? Has it changed?"
                />
              </label>
            </div>

            <label className="consent-row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                I understand this prototype does not provide a medical diagnosis
                and is not a substitute for professional care.
              </span>
            </label>

            <button
              className="primary-button"
              disabled={!file || !consent || stage === "saving"}
              onClick={submit}
            >
              {stage === "saving" ? (
                <><RefreshCw className="spin" size={18} /> Preparing your check…</>
              ) : (
                <>Prepare my photo check <ArrowRight size={18} /></>
              )}
            </button>

            {result && (
              <div className="result-panel" aria-live="polite">
                <div className="result-banner">
                  <div className="result-icon"><Sparkles size={22} /></div>
                  <div>
                    <span>SIMULATED PHOTO ASSESSMENT</span>
                    <h3>{result.headline}</h3>
                    <p>{result.summary}</p>
                  </div>
                </div>

                <div className="simulation-warning">
                  <TriangleAlert size={17} aria-hidden="true" />
                  <strong>{result.disclaimer}</strong>
                </div>

                <div className="result-grid">
                  <div className="result-section">
                    <span className="result-label">POSSIBLE MATCH</span>
                    <strong>{result.possibleMatch}</strong>
                    <small>Based on your selected concern only</small>
                  </div>
                  <div className="result-section urgency-section">
                    <span className="result-label">SUGGESTED TIMING</span>
                    <strong><Stethoscope size={17} /> {result.urgency} follow-up</strong>
                    <small>Seek care sooner if symptoms worsen</small>
                  </div>
                </div>

                <div className="result-details">
                  <div>
                    <h4>Other possibilities</h4>
                    <ul>
                      {result.otherPossibilities.map((possibility) => (
                        <li key={possibility}>{possibility}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>What to do next</h4>
                    <ol>
                      {result.nextSteps.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <p className="mode-note">
              {isSupabaseConfigured
                ? "Secure storage is connected."
                : "Prototype mode: your image is previewed on this device and is not uploaded."}
            </p>
          </div>
        </section>

        <section className="guidance" aria-labelledby="guidance-title">
          <div>
            <span className="eyebrow">A BETTER PHOTO HELPS</span>
            <h2 id="guidance-title">Three simple ways to get a clearer look.</h2>
          </div>
          <ol>
            <li><span>1</span><strong>Find natural light</strong><p>Stand near a window and avoid heavy shadows.</p></li>
            <li><span>2</span><strong>Hold steady</strong><p>Keep the camera about 6–10 inches away.</p></li>
            <li><span>3</span><strong>Skip filters</strong><p>Use the original image so color stays accurate.</p></li>
          </ol>
        </section>

        <section className="medical-note">
          <span>IMPORTANT</span>
          <p>
            Seek urgent medical care for severe pain, rapidly spreading redness,
            fever, pus, blackened skin, loss of feeling, or a wound that is not healing—especially if you have diabetes or poor circulation.
          </p>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>Dr. Fungus</span>
        </a>
        <p>Built for an informed first step—not a final diagnosis.</p>
        <span>Prototype · 2026</span>
      </footer>
    </div>
  );
}

export default App;
