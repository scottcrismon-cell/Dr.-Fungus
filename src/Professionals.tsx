import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  ExternalLink,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import { FormEvent, useState } from "react";
import type { DiagnosticResult } from "./lib/diagnostics";

type Professional = {
  id: number;
  name: string;
  credentials: string;
  specialty: string;
  practice: string;
  location: string;
  distance: string;
  availability: string;
  initials: string;
  telehealth: boolean;
  careFocus: Array<"podiatry" | "dermatology" | "primary-care">;
  subscriptionStatus: "active" | "inactive";
};

const professionals: Professional[] = [
  {
    id: 1,
    name: "Dr. Maya Chen",
    credentials: "DPM",
    specialty: "Podiatry · Nail & skin care",
    practice: "Westside Foot & Ankle",
    location: "2.1 miles away",
    distance: "Nearby",
    availability: "Next opening: Tuesday",
    initials: "MC",
    telehealth: true,
    careFocus: ["podiatry", "dermatology"],
    subscriptionStatus: "active",
  },
  {
    id: 2,
    name: "Jordan Ellis",
    credentials: "NP-C",
    specialty: "Primary care · Dermatology",
    practice: "Harbor Health Clinic",
    location: "3.8 miles away",
    distance: "Nearby",
    availability: "Next opening: Wednesday",
    initials: "JE",
    telehealth: false,
    careFocus: ["dermatology", "primary-care"],
    subscriptionStatus: "active",
  },
  {
    id: 3,
    name: "Dr. Rafael Ortiz",
    credentials: "DPM",
    specialty: "Podiatry · Diabetic foot care",
    practice: "Orchard Podiatry Group",
    location: "5.4 miles away",
    distance: "Nearby",
    availability: "Next opening: Friday",
    initials: "RO",
    telehealth: true,
    careFocus: ["podiatry"],
    subscriptionStatus: "active",
  },
  {
    id: 4,
    name: "Sample Inactive Provider",
    credentials: "DPM",
    specialty: "Podiatry",
    practice: "Hidden Prototype Practice",
    location: "1.0 mile away",
    distance: "Nearby",
    availability: "Unavailable",
    initials: "SP",
    telehealth: false,
    careFocus: ["podiatry"],
    subscriptionStatus: "inactive",
  },
];

const subscribedProfessionals = professionals.filter(
  (professional) => professional.subscriptionStatus === "active",
);

function careRecommendation(result: DiagnosticResult) {
  const possibleMatch = result.possibleMatch.toLowerCase();

  if (possibleMatch.includes("athlete") || possibleMatch.includes("skin")) {
    return {
      focus: new Set<Professional["careFocus"][number]>(["dermatology", "primary-care"]),
      label: "Dermatology or primary care",
      reason: "Your simulated result points toward a skin concern.",
    };
  }

  if (possibleMatch.includes("no simulated")) {
    return {
      focus: new Set<Professional["careFocus"][number]>(["podiatry", "dermatology", "primary-care"]),
      label: "Podiatry, dermatology, or primary care",
      reason: "Your simulated result did not identify a specific care category.",
    };
  }

  return {
    focus: new Set<Professional["careFocus"][number]>(["podiatry"]),
    label: "Podiatry",
    reason: "Your simulated result points toward a nail, toe, or foot concern.",
  };
}

export function ProfessionalDirectory({
  diagnosticResult,
}: {
  diagnosticResult: DiagnosticResult | null;
}) {
  const [zipCode, setZipCode] = useState("");
  const [searchedZip, setSearchedZip] = useState("");

  const findProfessionals = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (/^\d{5}$/.test(zipCode)) setSearchedZip(zipCode);
  };

  const recommendation = diagnosticResult ? careRecommendation(diagnosticResult) : null;
  const matchingProfessionals = recommendation
    ? subscribedProfessionals.filter((professional) =>
        professional.careFocus.some((focus) => recommendation.focus.has(focus)),
      )
    : [];

  return (
    <section className="professional-directory" aria-labelledby="professional-title">
      <div className="directory-intro">
        <span className="eyebrow">CARE BEYOND THE PHOTO</span>
        <h2 id="professional-title">Find someone who can take a closer look.</h2>
        <p>
          Explore nearby clinicians who subscribe to the Dr. Fungus professional
          network. Confirm insurance, licensing, and availability directly with the practice.
        </p>
        <div className="directory-trust">
          <BadgeCheck size={18} /> Only active network subscribers are displayed
        </div>
      </div>

      {diagnosticResult && recommendation ? <div className="directory-search-panel">
        <div className="directory-context">
          <Stethoscope size={20} />
          <div><span>Suggested care type</span><strong>{recommendation.label}</strong></div>
        </div>
        <form onSubmit={findProfessionals}>
          <label htmlFor="provider-zip">Your ZIP code</label>
          <div>
            <MapPin size={18} aria-hidden="true" />
            <input
              id="provider-zip"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              value={zipCode}
              onChange={(event) => setZipCode(event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 94107"
              required
            />
            <button type="submit"><Search size={17} /> Find care</button>
          </div>
        </form>
        <small>{recommendation.reason} Profiles and locations below are sample data.</small>
      </div> : (
        <div className="provider-gate">
          <div><LockKeyhole size={21} /></div>
          <section>
            <span>PROVIDER MATCHING UNLOCKS AFTER YOUR PHOTO CHECK</span>
            <h3>Complete the assessment to receive a care-type recommendation.</h3>
            <p>The eventual AI result will supply specialty, urgency, and matching signals. It will not select providers based on who pays more.</p>
          </section>
          <a href="#check">Start with a photo <ArrowRight size={16} /></a>
        </div>
      )}

      {searchedZip && diagnosticResult ? (
        <div className="provider-results" aria-live="polite">
          <div className="provider-results-heading">
            <div>
              <span>SUBSCRIBED PROFESSIONALS</span>
              <h3>Care options near {searchedZip}</h3>
            </div>
            <strong>{matchingProfessionals.length} sample matches · {diagnosticResult.urgency.toLowerCase()} follow-up</strong>
          </div>
          <div className="provider-list">
            {matchingProfessionals.map((professional) => (
              <article className="provider-card" key={professional.id}>
                <div className="provider-avatar" aria-hidden="true">{professional.initials}</div>
                <div className="provider-main">
                  <span className="network-badge"><BadgeCheck size={14} /> Active subscriber</span>
                  <h4>{professional.name}, {professional.credentials}</h4>
                  <p>{professional.specialty}</p>
                  <strong>{professional.practice}</strong>
                  <div className="provider-meta">
                    <span><MapPin size={14} /> {professional.location}</span>
                    {professional.telehealth ? <span><Video size={14} /> Virtual visits</span> : null}
                  </div>
                </div>
                <div className="provider-action">
                  <span><CalendarDays size={15} /> {professional.availability}</span>
                  <button type="button">View sample profile <ArrowRight size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ClinicianPortal() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [submitted, setSubmitted] = useState(false);

  const stageProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="clinician-page">
      <section className="clinician-hero" aria-labelledby="clinician-title">
        <div>
          <span className="eyebrow">FOR FOOT-CARE PROFESSIONALS</span>
          <h1 id="clinician-title">Meet patients looking for their <em>next step.</em></h1>
          <p>
            Build a trusted Dr. Fungus profile and become discoverable when nearby
            users are ready to seek professional care.
          </p>
          <button
            className="clinician-cta"
            onClick={() => document.getElementById("join-network")?.scrollIntoView({ behavior: "smooth" })}
          >
            Join the professional network <ArrowRight size={17} />
          </button>
        </div>
        <div className="clinician-metrics">
          <div><Users size={22} /><strong>Local discovery</strong><span>Appear in relevant nearby searches</span></div>
          <div><ClipboardCheck size={22} /><strong>Qualified context</strong><span>Help users move from concern to care</span></div>
          <div><ShieldCheck size={22} /><strong>Trust-first profiles</strong><span>Credential review before publishing</span></div>
        </div>
      </section>

      <section className="network-how">
        <div>
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>One profile. A clearer path to your practice.</h2>
        </div>
        <ol>
          <li><span>01</span><div><strong>Create your profile</strong><p>Add your practice, specialty, service area, and availability.</p></div></li>
          <li><span>02</span><div><strong>Complete verification</strong><p>Licensing and professional details are reviewed before publishing.</p></div></li>
          <li><span>03</span><div><strong>Activate membership</strong><p>Only professionals with an active paid subscription appear to users.</p></div></li>
        </ol>
      </section>

      <section className="join-network" id="join-network">
        <div className="membership-card">
          <span className="eyebrow">FOUNDING PROFESSIONAL PLAN</span>
          <h2>{billing === "monthly" ? "$49" : "$470"}<small>/{billing === "monthly" ? "month" : "year"}</small></h2>
          <p>Prototype pricing for testing the professional subscription experience.</p>
          <div className="billing-toggle" aria-label="Billing period">
            <button className={billing === "monthly" ? "is-active" : ""} onClick={() => setBilling("monthly")}>Monthly</button>
            <button className={billing === "annual" ? "is-active" : ""} onClick={() => setBilling("annual")}>Annual · save 20%</button>
          </div>
          <ul>
            <li><Check size={17} /> Public professional profile</li>
            <li><Check size={17} /> Placement in local care results</li>
            <li><Check size={17} /> Practice and availability details</li>
            <li><Check size={17} /> Subscription management portal</li>
          </ul>
          <small><LockKeyhole size={14} /> No payment is collected in this prototype.</small>
        </div>

        <form className="professional-form" onSubmit={stageProfile}>
          <div className="professional-form-heading">
            <span>PROFESSIONAL PROFILE</span>
            <h2>Tell us about your practice.</h2>
            <p>This information would be reviewed before your profile becomes visible.</p>
          </div>
          <div className="professional-fields">
            <label>Full name<input required placeholder="Dr. Jane Smith" /></label>
            <label>Practice name<input required placeholder="Smith Foot & Ankle" /></label>
            <label>Professional email<input required type="email" placeholder="jane@practice.com" /></label>
            <label>Specialty<select defaultValue=""><option value="" disabled>Select specialty</option><option>Podiatrist</option><option>Dermatologist</option><option>Primary care clinician</option><option>Nurse practitioner</option><option>Other licensed professional</option></select></label>
            <label>Practice ZIP<input required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="94107" /></label>
            <label>License state<input required maxLength={2} placeholder="CA" /></label>
          </div>
          <label className="professional-attestation">
            <input required type="checkbox" />
            <span>I confirm that I am a licensed healthcare professional or authorized practice representative.</span>
          </label>
          <button className="primary-button" type="submit">Preview membership setup <ArrowRight size={17} /></button>
          {submitted ? (
            <div className="profile-staged" role="status">
              <BadgeCheck size={21} />
              <div><strong>Profile setup preview complete</strong><p>No account was created and no payment was charged. Secure checkout and credential verification will be connected later.</p></div>
            </div>
          ) : null}
          <p className="checkout-note"><ExternalLink size={13} /> Future billing will use secure hosted checkout and verified subscription webhooks.</p>
        </form>
      </section>
    </div>
  );
}
