import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  getCurrentUser,
  isSupabaseConfigured,
  onAuthChange,
  requestMagicLink,
  signOut,
  type AccountRole,
  type AppUser,
} from "./lib/auth";

type AuthMode = "signin" | "signup";

function roleFromUser(user: AppUser): AccountRole {
  return user.user_metadata.account_type === "professional" ? "professional" : "patient";
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<AccountRole>("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<AppUser | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getCurrentUser().then(setUser).catch(() => setUser(null));
    return onAuthChange(setUser);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const authenticatedUser = await requestMagicLink(email, role, fullName);
      if (authenticatedUser) {
        setUser({
          ...authenticatedUser,
          user_metadata: { ...authenticatedUser.user_metadata, account_type: role },
        });
      }
      setMessage(
        isSupabaseConfigured
          ? "Magic link sent. Open the email on this device to finish signing in."
          : `Demo ${mode === "signup" ? "account creation" : "sign-in"} complete. Nothing was saved.`,
      );
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn’t complete that request.");
    } finally {
      setBusy(false);
    }
  };

  const logOut = async () => {
    await signOut();
    setUser(null);
    setMessage("You’re signed out.");
  };

  if (user) {
    const userRole = roleFromUser(user);
    return (
      <div className="account-page">
        <section className="account-dashboard">
          <div className="account-success-icon"><BadgeCheck size={28} /></div>
          <span className="eyebrow">{isSupabaseConfigured ? "ACCOUNT ACTIVE" : "DEMO ACCOUNT"}</span>
          <h1>Welcome to your {userRole === "professional" ? "professional" : "patient"} space.</h1>
          <p>{user.email}</p>
          <div className="account-action-grid">
            {userRole === "patient" ? (
              <>
                <a href="#check"><ClipboardList size={21} /><strong>My assessments</strong><span>Start a photo check or review saved results.</span></a>
                <a href="#check"><Stethoscope size={21} /><strong>Care connections</strong><span>View professionals associated with your care search.</span></a>
              </>
            ) : (
              <>
                <a href="#clinicians"><UserRound size={21} /><strong>Professional profile</strong><span>Complete practice details and credential review.</span></a>
                <a href="#clinicians"><BadgeCheck size={21} /><strong>Membership</strong><span>Review subscription and directory status.</span></a>
              </>
            )}
          </div>
          <button className="secondary-button" onClick={() => void logOut()}>Sign out</button>
        </section>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <section className="auth-story">
        <div>
          <span className="eyebrow">YOUR PRIVATE CARE SPACE</span>
          <h1>Keep your next steps <em>together.</em></h1>
          <p>One secure account for photo checks, saved guidance, and connections to care.</p>
        </div>
        <div className="auth-trust-list">
          <span><ShieldCheck size={18} /> Private assessment history</span>
          <span><LockKeyhole size={18} /> Protected photos and personal details</span>
          <span><Stethoscope size={18} /> Separate professional access</span>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-mode-tabs" aria-label="Account action">
          <button className={mode === "signin" ? "is-active" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>Create account</button>
        </div>

        <div className="role-picker" aria-label="Account type">
          <button className={role === "patient" ? "is-active" : ""} onClick={() => setRole("patient")}>
            <UserRound size={20} /><span><strong>Patient</strong><small>My photos and care</small></span>
          </button>
          <button className={role === "professional" ? "is-active" : ""} onClick={() => setRole("professional")}>
            <Stethoscope size={20} /><span><strong>Professional</strong><small>My practice profile</small></span>
          </button>
        </div>

        <div className="auth-card-heading">
          <span>{role === "professional" ? "PROFESSIONAL ACCESS" : "PATIENT ACCESS"}</span>
          <h2 id="auth-title">{mode === "signin" ? "Welcome back." : "Create your account."}</h2>
          <p>
            {role === "professional"
              ? "Manage your verified profile and network membership."
              : "Save assessments and keep your care journey in one place."}
          </p>
        </div>

        <form onSubmit={submit}>
          {mode === "signup" ? <label>Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" /></label> : null}
          <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? "Please wait…" : mode === "signin" ? "Email me a sign-in link" : `Create ${role} account`} <ArrowRight size={17} />
          </button>
        </form>

        {error ? <div className="error-message" role="alert">{error}</div> : null}
        {message ? <div className="auth-message" role="status">{message}</div> : null}
        <p className="auth-mode-note">
          {isSupabaseConfigured
            ? "Passwordless authentication is secured through Supabase."
            : "Demo mode: account details are not transmitted or saved."}
        </p>
      </section>
    </div>
  );
}
