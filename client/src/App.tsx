import React, { FormEvent, useEffect, useState } from "react";
import DashboardHome from "./features/companies/DashboardHome";
import CompanyMasterList from "./features/companies/CompanyMasterList";
import CompanyProfileWorkspace from "./features/companies/CompanyProfileWorkspace";
import TaskExecutionPipeline from "./features/companies/TaskExecutionPipeline";
import TaxWorkspace from "./features/companies/TaxWorkspace";
import ReminderCenter from "./features/companies/ReminderCenter";
import NcltTracker from "./features/companies/NcltTracker";
import BillingLedger from "./features/companies/BillingLedger";
import SystemSettings from "./features/companies/SystemSettings";
import SmartTaskManagerV2 from "./features/tasks/SmartTaskManagerV2";
import LitigationDraftGenerator from "./features/litigation/LitigationDraftGenerator";
import { supabase } from "./supabaseClient";
import { can } from "./features/companies/accessPermissions";
import { useAccessProfile } from "./features/companies/useAccessProfile";

type Company = Record<string, unknown>;

function LoginScreen({ initialError = "" }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (initialError) setMessage(initialError); }, [initialError]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMessage(error.message);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 grid place-items-center text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Professional practice operations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">FirmAxis</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your firm workspace.</p>
        </div>
        <form onSubmit={signIn} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-200">
            Work email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
          </label>
          <label className="block text-sm font-semibold text-slate-200">
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
          </label>
          {message && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">{message}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in to FirmAxis"}
          </button>
        </form>
      </section>
    </main>
  );
}

function FullScreen({ title, text, signOut = false }: { title: string; text: string; signOut?: boolean }) {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError("");
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) setSignOutError(error.message);
    setSigningOut(false);
  };
  return <main className="min-h-screen bg-slate-950 px-4 grid place-items-center text-slate-200"><section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">FirmAxis</p><h1 className="mt-2 text-xl font-black text-white">{title}</h1><p className="mt-3 text-sm text-slate-400">{text}</p>{signOutError && <p className="mt-4 rounded-lg border border-rose-800 bg-rose-950/50 p-2 text-xs text-rose-200">{signOutError}</p>}{signOut && <button type="button" disabled={signingOut} onClick={handleSignOut} className="mt-6 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">{signingOut ? "Signing out…" : "Sign out"}</button>}</section></main>;
}

export default function App() {
  const [currentView, setCurrentView] = useState<string | Company>("dashboard");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const access = useAccessProfile();

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError("");
    // Local scope always removes this browser's session, even if a remote
    // session-revocation request is unavailable during a demo.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) setSignOutError(error.message);
    setSigningOut(false);
  };

  if (access.loading) return <FullScreen title="Loading FirmAxis" text="Loading your secure workspace…" />;
  if (!access.user) return <LoginScreen initialError={access.error} />;
  if (access.error || !access.profile) return <FullScreen title="Workspace access required" text={access.error || "Access denied."} signOut />;

  const role = access.profile.role;
  const navigation = [
    { id: "dashboard", label: "Dashboard Overview", permission: "dashboard.view" },
    { id: "companies", label: "Companies Portfolio", permission: "companies.view" },
    { id: "tasks", label: "Service Pipelines", permission: "pipeline.view" },
    { id: "tax", label: "Tax Compliance", permission: "tax.view" },
    { id: "reminders", label: "Reminders & Deadlines", permission: "reminders.view" },
    { id: "smart-router-v2", label: "Smart Router", permission: "router.view" },
    { id: "court-drafter-v2", label: "Litigation Drafter", permission: "litigation.draft" },
    { id: "nclt", label: "Litigation & NCLT", permission: "nclt.view" },
    { id: "billing", label: "Billing & Retainers", permission: "billing.view" },
    { id: "settings", label: "Users & Access", permission: "settings.view" },
  ].filter((item) => can(role, item.permission));
  const active = typeof currentView === "string" ? currentView : "companies";

  return <div className="flex min-h-screen bg-slate-100 font-sans antialiased"><aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300"><div className="border-b border-slate-800 bg-slate-950 p-5"><div className="text-sm font-bold uppercase tracking-wide text-white">FirmAxis</div><div className="mt-1 text-xs text-slate-400">{access.profile.full_name || access.user.email}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">{role.replaceAll("_", " ")}</div></div><nav className="flex-1 space-y-1.5 p-4 text-xs font-semibold uppercase tracking-wider">{navigation.map((item) => <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full rounded-lg border px-3 py-3 text-left transition ${active === item.id ? "border-indigo-500 bg-indigo-600 font-bold text-white shadow-md" : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}>{item.label}</button>)}</nav>{signOutError && <p className="mx-4 text-xs text-rose-300">{signOutError}</p>}<button type="button" disabled={signingOut} onClick={handleSignOut} className="m-4 rounded-lg border border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-slate-800 disabled:opacity-60">{signingOut ? "Signing out…" : "Sign out"}</button></aside><main className="flex-1 overflow-y-auto">{active === "dashboard" && <DashboardHome />}{active === "companies" && (typeof currentView === "object" ? <div><div className="bg-slate-800 px-6 py-2.5 text-white"><button onClick={() => setCurrentView("companies")} className="rounded bg-slate-700 px-3 py-1 text-xs hover:bg-slate-600">← Return to Master Grid</button></div><CompanyProfileWorkspace companyData={currentView} userRole={role} /></div> : <CompanyMasterList onSelectCompany={(company: Company) => setCurrentView(company)} />)}{active === "tasks" && <TaskExecutionPipeline userRole={role} />}{active === "tax" && <TaxWorkspace userRole={role} />}{active === "reminders" && <ReminderCenter />}{active === "smart-router-v2" && <SmartTaskManagerV2 />}{active === "court-drafter-v2" && <LitigationDraftGenerator />}{active === "nclt" && <NcltTracker />}{active === "billing" && <BillingLedger userRole={role} />}{active === "settings" && <SystemSettings profile={access.profile} />}</main></div>;
}
