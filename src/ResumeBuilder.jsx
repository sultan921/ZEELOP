import React, { useEffect, useMemo, useRef, useState } from "react";

// SAMATKAAR CV Studio — browser-only editor, no external packages.
const STORAGE_KEY = "samatkaar_cv_studio_v2";
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const emptyJob = () => ({ id: uid(), role: "", company: "", location: "", start: "", end: "", current: false, details: "" });
const emptyEducation = () => ({ id: uid(), degree: "", school: "", location: "", start: "", end: "", details: "" });
const emptyProject = () => ({ id: uid(), name: "", link: "", details: "" });
const emptyExtra = () => ({ id: uid(), title: "", details: "" });
const initial = () => ({
  name: "", headline: "", email: "", phone: "", city: "", website: "", linkedin: "", summary: "", skills: "",
  jobs: [emptyJob()], education: [emptyEducation()], projects: [], certifications: [], languages: "", achievements: "",
  theme: "classic", color: "#2563eb", font: "Arial", size: "normal", paper: "A4", showLinks: true
});
const themes = [
  { id: "classic", name: "Classic", description: "Clean, ATS-friendly single column" },
  { id: "modern", name: "Modern", description: "Bold header and subtle section rules" },
  { id: "minimal", name: "Minimal", description: "Simple typography and generous space" },
  { id: "executive", name: "Executive", description: "Traditional professional hierarchy" },
  { id: "creative", name: "Creative", description: "Distinctive colored heading" }
];
const palettes = ["#2563eb", "#0f766e", "#7c3aed", "#be123c", "#334155", "#b45309"];
const styles = {
  app: { minHeight: "100vh", background: "#f1f5f9", color: "#17243b", fontFamily: "Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif", padding: "24px 14px 70px" },
  wrap: { maxWidth: 1440, margin: "0 auto" },
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,.04)" },
  input: { width: "100%", minWidth: 0, padding: "11px 12px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#17243b", font: "inherit", boxSizing: "border-box" },
  button: { padding: "11px 15px", background: "#2563eb", color: "white", border: 0, borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  secondary: { padding: "10px 13px", background: "white", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  danger: { padding: "8px 11px", background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 8, cursor: "pointer" },
  muted: { color: "#64748b", lineHeight: 1.6 },
};
const sampleContent = {
  "Software Developer": { headline: "Frontend Developer", summary: "Frontend developer experienced in building responsive websites and reusable React components. Focused on accessible interfaces, performance, and reliable delivery.", skills: "HTML, CSS, JavaScript, React, Git, Responsive Design, REST APIs", job: { role: "Frontend Developer", company: "Example Company", details: "Built responsive user interfaces with React and reusable components.\nImproved website accessibility and resolved cross-device layout issues.\nCollaborated with designers to implement and test new features." }, project: { name: "Portfolio Website", details: "Created a responsive portfolio featuring projects, contact forms, and accessible navigation." } },
  "Customer Service": { headline: "Customer Support Representative", summary: "Customer-focused professional skilled in answering questions, resolving problems, and communicating clearly. Committed to respectful and efficient service.", skills: "Customer Support, Communication, Problem Solving, Data Entry, CRM, Email", job: { role: "Customer Support Representative", company: "Example Company", details: "Responded to customer questions through phone and email.\nDocumented issues accurately and escalated complex requests.\nHelped customers understand products and services." } },
  "Graphic Designer": { headline: "Graphic Designer", summary: "Creative designer focused on clear visual communication, brand consistency, and practical design solutions across digital formats.", skills: "Brand Identity, Typography, Layout, Adobe Illustrator, Canva, Social Media Graphics", job: { role: "Graphic Designer", company: "Freelance / Example Company", details: "Designed social media graphics and promotional materials.\nPrepared editable design files for clients.\nRevised layouts based on project feedback." } },
  "Tailor": { headline: "Professional Tailor", summary: "Detail-oriented tailoring professional experienced in garment measurement, fitting, alterations, and customer communication.", skills: "Garment Construction, Alterations, Measurements, Fitting, Quality Control, Customer Service", job: { role: "Tailor", company: "Tailoring Workshop", details: "Took accurate garment measurements and discussed customer requirements.\nCompleted alterations and fittings to improve garment fit.\nChecked stitching quality and final finishing." } },
  "Teacher": { headline: "Teacher / Tutor", summary: "Supportive educator who plans clear lessons, explains concepts in accessible language, and tracks student understanding.", skills: "Lesson Planning, Classroom Management, Communication, Assessment, Mentoring", job: { role: "Teacher", company: "Example School", details: "Prepared lesson plans aligned with learning objectives.\nExplained difficult topics using practical examples.\nReviewed student work and provided constructive feedback." } },
  "Accountant": { headline: "Accounting Assistant", summary: "Organized accounting professional with experience supporting financial records, reconciliations, and routine reporting.", skills: "Bookkeeping, Excel, Reconciliation, Invoicing, Reporting, Data Accuracy", job: { role: "Accounting Assistant", company: "Example Company", details: "Recorded financial transactions and organized supporting documents.\nAssisted with invoice processing and reconciliation.\nMaintained accurate spreadsheets and routine reports." } },
  "Sales": { headline: "Sales Associate", summary: "Service-oriented sales professional skilled in product knowledge, customer engagement, and organized follow-up.", skills: "Sales, Customer Relationships, Negotiation, Product Knowledge, Communication", job: { role: "Sales Associate", company: "Example Retailer", details: "Helped customers compare products and select suitable options.\nMaintained product displays and updated records.\nFollowed up on customer questions and requests." } },
  "Data Entry": { headline: "Data Entry Specialist", summary: "Careful data entry professional focused on accuracy, confidentiality, and timely completion of administrative tasks.", skills: "Typing, Microsoft Excel, Google Sheets, Data Verification, File Organization", job: { role: "Data Entry Specialist", company: "Example Office", details: "Entered and verified records using spreadsheets.\nReviewed information for missing or inconsistent fields.\nOrganized digital files for easier retrieval." } },
};
const tips = [
  ["Start with impact", "Describe what you achieved, not only the task you performed."],
  ["Use truthful numbers", "Add percentages or counts only when you can verify them."],
  ["Tailor the headline", "Match your professional title to the role you are applying for."],
  ["Keep it readable", "Use standard headings and avoid overly decorative layouts for ATS systems."],
  ["Be concise", "For many early-career applications, one clear page is a good starting point."],
  ["Prioritize recent work", "List your most recent relevant experience first."],
  ["Use action verbs", "Examples: built, organized, assisted, improved, designed, delivered."],
  ["Avoid sensitive details", "Do not include national ID, religion, marital status, or birth date unless legitimately required."],
  ["Check contact details", "Confirm your email, phone number, and portfolio links work."],
  ["Review before applying", "Remove placeholder text and proofread your CV carefully."],
  ["Save a PDF", "Use Print / Save PDF to preserve your formatting for employers."],
  ["Respect privacy", "This editor stores a draft in your browser, not in a remote account."],
];
const examples = [
  "Built responsive interfaces that work across mobile and desktop devices.",
  "Organized daily records and verified entries for accuracy.",
  "Responded to customer inquiries and provided clear next steps.",
  "Prepared reports using spreadsheet formulas and organized source data.",
  "Collaborated with teammates to deliver work within agreed timelines.",
  "Created reusable templates to reduce repetitive manual work.",
  "Reviewed completed work and corrected errors before delivery.",
  "Documented processes so colleagues could follow consistent steps.",
  "Maintained accurate inventory and updated product information.",
  "Assisted clients in identifying appropriate products or services.",
  "Explained technical concepts to people without technical backgrounds.",
  "Planned lessons and evaluated progress using practical exercises.",
  "Produced visual materials aligned with project requirements.",
  "Supported onboarding by answering questions and sharing instructions.",
  "Troubleshot common software issues and recorded resolutions.",
  "Coordinated appointments and followed up with stakeholders.",
  "Managed multiple assignments while maintaining attention to detail.",
  "Improved the readability and organization of written content.",
  "Tested new features and reported reproducible issues.",
  "Completed garment measurements, alterations, and quality checks."
];
const fieldLabels = {
  name: "Full name", headline: "Professional title", email: "Email", phone: "Phone", city: "City / Country", website: "Portfolio website", linkedin: "LinkedIn URL", summary: "Professional summary", skills: "Skills (comma separated)", languages: "Languages", achievements: "Awards / achievements"
};
const splitLines = value => String(value || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
const joinPeriod = (start, end, current) => [start, current ? "Present" : end].filter(Boolean).join(" – ");
const cleanUrl = value => { const v = String(value || "").trim(); if (!v) return ""; try { const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); return ["https:", "http:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
function Field({ label, children, hint }) { return <label className="cv-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function ResumeSection({ title, children, accent }) { return <section className="cv-resume-section"><h3 style={{ color: accent }}>{title}</h3>{children}</section>; }
function SectionHeading({ title, subtitle }) { return <div className="cv-panel-heading"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>; }
function EditableList({ title, items, add, update, remove, kind }) {
  const configs = {
    jobs: [["role", "Job title"], ["company", "Company / organization"], ["location", "Location"], ["start", "Start date"], ["end", "End date"]],
    education: [["degree", "Degree / qualification"], ["school", "School / institution"], ["location", "Location"], ["start", "Start date"], ["end", "End date"]],
    projects: [["name", "Project name"], ["link", "Project URL"]],
    certifications: [["title", "Certification / course title"]]
  };
  return <section><div className="cv-list-title"><h3>{title}</h3><button type="button" style={styles.secondary} onClick={add}>+ Add</button></div>
    {items.length === 0 && <p style={styles.muted}>No entries yet. Click Add to create one.</p>}
    {items.map((item, index) => <div className="cv-entry" key={item.id}><div className="cv-entry-top"><strong>{title} #{index + 1}</strong><button type="button" style={styles.danger} onClick={() => remove(item.id)}>Remove</button></div>
      <div className="cv-form-grid">{configs[kind].map(([key, label]) => <Field key={key} label={label}><input style={styles.input} value={item[key] || ""} onChange={e => update(item.id, key, e.target.value)} placeholder={label} /></Field>)}</div>
      {kind === "jobs" && <label className="cv-checkbox"><input type="checkbox" checked={!!item.current} onChange={e => update(item.id, "current", e.target.checked)} /> I currently work here</label>}
      <Field label={kind === "jobs" ? "Achievements / responsibilities (one per line)" : kind === "education" ? "Details / honors" : "Description / highlights (one per line)"}><textarea style={styles.input} rows={4} value={item.details || ""} onChange={e => update(item.id, "details", e.target.value)} placeholder="Write truthful, specific information..." /></Field>
    </div>)}
  </section>;
}
function Preview({ data }) {
  const accent = data.theme === "executive" ? "#243247" : data.color;
  const font = data.font === "Georgia" ? "Georgia,serif" : data.font === "Times New Roman" ? "'Times New Roman',serif" : "Arial,Helvetica,sans-serif";
  const size = data.size === "compact" ? 12 : data.size === "large" ? 15 : 13.5;
  const skills = data.skills.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  const contact = [data.email, data.phone, data.city].filter(Boolean);
  return <article id="samatkaar-resume" className={`cv-paper cv-${data.theme}`} style={{ "--cv-accent": accent, fontFamily: font, fontSize: size, minHeight: data.paper === "Letter" ? 1030 : 1090 }}>
    <header className="cv-resume-header"><h1>{data.name || "Your Name"}</h1><div className="cv-resume-headline">{data.headline || "Professional Title"}</div><div className="cv-resume-contact">{contact.length ? contact.join("  •  ") : "Email • Phone • Location"}</div>
      {data.showLinks && <div className="cv-resume-contact">{[data.website, data.linkedin].filter(Boolean).map((link, i) => <span key={i}>{i > 0 ? "  •  " : ""}{link}</span>)}</div>}
    </header>
    {data.summary.trim() && <ResumeSection title="PROFESSIONAL SUMMARY" accent={accent}><p>{data.summary}</p></ResumeSection>}
    {skills.length > 0 && <ResumeSection title="SKILLS" accent={accent}><p>{skills.join("  •  ")}</p></ResumeSection>}
    {data.jobs.some(j => j.role || j.company || j.details) && <ResumeSection title="WORK EXPERIENCE" accent={accent}>{data.jobs.filter(j => j.role || j.company || j.details).map(j => <div className="cv-resume-entry" key={j.id}><div className="cv-resume-row"><strong>{j.role || "Role"}</strong><span>{joinPeriod(j.start, j.end, j.current)}</span></div><div className="cv-resume-subtitle">{[j.company, j.location].filter(Boolean).join(" • ")}</div>{splitLines(j.details).length > 0 && <ul>{splitLines(j.details).map((line, i) => <li key={i}>{line}</li>)}</ul>}</div>)}</ResumeSection>}
    {data.education.some(e => e.degree || e.school || e.details) && <ResumeSection title="EDUCATION" accent={accent}>{data.education.filter(e => e.degree || e.school || e.details).map(e => <div className="cv-resume-entry" key={e.id}><div className="cv-resume-row"><strong>{e.degree || "Qualification"}</strong><span>{joinPeriod(e.start, e.end)}</span></div><div className="cv-resume-subtitle">{[e.school, e.location].filter(Boolean).join(" • ")}</div>{e.details && <p>{e.details}</p>}</div>)}</ResumeSection>}
    {data.projects.length > 0 && <ResumeSection title="PROJECTS" accent={accent}>{data.projects.filter(p => p.name || p.details).map(p => <div className="cv-resume-entry" key={p.id}><strong>{p.name || "Project"}</strong>{p.link && <div className="cv-resume-subtitle">{p.link}</div>}{splitLines(p.details).length > 0 && <ul>{splitLines(p.details).map((line, i) => <li key={i}>{line}</li>)}</ul>}</div>)}</ResumeSection>}
    {data.certifications.length > 0 && <ResumeSection title="CERTIFICATIONS & COURSES" accent={accent}>{data.certifications.filter(c => c.title || c.details).map(c => <div className="cv-resume-entry" key={c.id}><strong>{c.title}</strong>{c.details && <p>{c.details}</p>}</div>)}</ResumeSection>}
    {data.languages.trim() && <ResumeSection title="LANGUAGES" accent={accent}><p>{data.languages}</p></ResumeSection>}
    {data.achievements.trim() && <ResumeSection title="AWARDS & ACHIEVEMENTS" accent={accent}><ul>{splitLines(data.achievements).map((line, i) => <li key={i}>{line}</li>)}</ul></ResumeSection>}
    {!data.name && !data.summary && !data.skills && <p className="cv-preview-hint">Fill in the form to build your resume. Empty sections are hidden automatically.</p>}
  </article>;
}
export default function ResumeBuilder() {
  const [data, setData] = useState(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? { ...initial(), ...JSON.parse(raw) } : initial(); } catch { return initial(); } });
  const [tab, setTab] = useState("personal");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [autosave, setAutosave] = useState(true);
  const importRef = useRef(null);
  const [showPreview, setShowPreview] = useState(true);
  const change = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const listChange = (key, id, field, value) => setData(prev => ({ ...prev, [key]: prev[key].map(item => item.id === id ? { ...item, [field]: value } : item) }));
  const listAdd = (key, factory) => setData(prev => ({ ...prev, [key]: [...prev[key], factory()] }));
  const listRemove = (key, id) => setData(prev => ({ ...prev, [key]: prev[key].filter(item => item.id !== id) }));
  useEffect(() => { if (!autosave) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { setNotice("Browser storage is unavailable. Export a backup instead."); } }, [data, autosave]);
  const completeness = useMemo(() => { const checks = [data.name, data.headline, data.email, data.phone, data.city, data.summary, data.skills, data.jobs.some(j => j.role && j.company), data.education.some(e => e.degree && e.school), data.projects.length || data.certifications.length]; return Math.round(checks.filter(Boolean).length / checks.length * 100); }, [data]);
  const alert = text => { setNotice(text); };
  const download = (filename, content, mime) => { const blob = new Blob([content], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); };
  const exportJSON = () => download("samatkaar-resume-backup.json", JSON.stringify(data, null, 2), "application/json");
  const exportText = () => {
    const text = [data.name, data.headline, [data.email, data.phone, data.city, data.website, data.linkedin].filter(Boolean).join(" | "), "", "PROFESSIONAL SUMMARY", data.summary, "", "SKILLS", data.skills, "", "WORK EXPERIENCE", ...data.jobs.map(j => [j.role, j.company, joinPeriod(j.start, j.end, j.current), j.details].filter(Boolean).join("\n")), "", "EDUCATION", ...data.education.map(e => [e.degree, e.school, joinPeriod(e.start, e.end), e.details].filter(Boolean).join("\n")), "", "PROJECTS", ...data.projects.map(p => [p.name, p.link, p.details].filter(Boolean).join("\n")), "", "CERTIFICATIONS", ...data.certifications.map(c => [c.title, c.details].filter(Boolean).join("\n")), "", "LANGUAGES", data.languages, "", "ACHIEVEMENTS", data.achievements].join("\n");
    download("samatkaar-resume.txt", text, "text/plain;charset=utf-8");
  };
  const importJSON = async event => { const file = event.target.files?.[0]; if (!file) return; try { const parsed = JSON.parse(await file.text()); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || typeof parsed.name !== "string") throw Error("Invalid resume backup"); setData({ ...initial(), ...parsed, jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [], education: Array.isArray(parsed.education) ? parsed.education : [], projects: Array.isArray(parsed.projects) ? parsed.projects : [], certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [] }); alert("Resume backup imported successfully."); } catch { alert("Could not import this file. Choose a valid SAMATKAAR JSON backup."); } event.target.value = ""; };
  const applyExample = role => { const ex = sampleContent[role]; if (!ex) return; if (!window.confirm("Load a demonstration example? Your current draft will be replaced. Example employers and achievements are NOT verified and must be edited.")) return; const base = initial(); setData({ ...base, headline: ex.headline, summary: ex.summary, skills: ex.skills, jobs: [{ ...emptyJob(), ...ex.job }], projects: ex.project ? [{ ...emptyProject(), ...ex.project }] : [] }); setTab("personal"); alert("Example loaded. Replace all example information with your real experience."); };
  const reset = () => { if (window.confirm("Clear your resume? Export a backup first if you want to keep it.")) { setData(initial()); alert("Form cleared."); } };
  const tabs = [["personal", "Personal"], ["experience", "Experience"], ["education", "Education"], ["projects", "Projects"], ["extras", "More details"], ["design", "Design"], ["guidance", "Career guide"]];
  return <main className="cv-studio" style={styles.app}><style>{`
    .cv-studio *{box-sizing:border-box}.cv-studio button:focus-visible,.cv-studio input:focus-visible,.cv-studio textarea:focus-visible,.cv-studio select:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
    .cv-studio .cv-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:18px}.cv-studio .cv-top h1{margin:0 0 6px;font-size:clamp(25px,4vw,38px)}.cv-studio .cv-top p{margin:0;color:#64748b;max-width:700px;line-height:1.65}
    .cv-studio .cv-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 20px}.cv-studio .cv-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.06fr);gap:20px;align-items:start}
    .cv-studio .cv-tabs{display:flex;gap:6px;overflow-x:auto;padding:3px 0 14px}.cv-studio .cv-tabs button{flex-shrink:0;padding:10px 13px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-weight:700;color:#475569}.cv-studio .cv-tabs button.active{background:#eff6ff;color:#1d4ed8;border-color:#93c5fd}
    .cv-studio .cv-panel-heading h2{font-size:21px;margin:0 0 4px}.cv-studio .cv-panel-heading p{color:#64748b;margin:0 0 18px;font-size:13px;line-height:1.6}
    .cv-studio .cv-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.cv-studio .cv-field{display:grid;gap:6px;margin-bottom:13px;font-size:13px;font-weight:700}.cv-studio .cv-field small{font-weight:400;color:#64748b;line-height:1.5}.cv-studio textarea{resize:vertical;min-height:84px}.cv-studio .cv-checkbox{display:flex;align-items:center;gap:7px;font-size:13px;margin:8px 0 15px}
    .cv-studio .cv-list-title,.cv-studio .cv-entry-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.cv-studio .cv-list-title h3{margin:0;font-size:17px}.cv-studio .cv-entry{border:1px solid #e2e8f0;background:#f8fafc;border-radius:12px;padding:14px;margin-top:14px}.cv-studio .cv-entry-top{margin-bottom:14px}.cv-studio .cv-note{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:13px;font-size:13px;color:#1e40af;line-height:1.65}
    .cv-studio .cv-progress{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:8px}.cv-studio .cv-progress>div{height:100%;background:linear-gradient(90deg,#2563eb,#14b8a6);transition:width .2s}.cv-studio .cv-preview-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.cv-studio .cv-preview-toolbar h2{margin:0;font-size:18px}
    .cv-studio .cv-paper{background:#fff;color:#17243b;width:100%;padding:clamp(22px,4vw,52px);border:1px solid #e2e8f0;box-shadow:0 15px 50px rgba(15,23,42,.09);overflow-wrap:anywhere;line-height:1.55}.cv-studio .cv-resume-header{padding-bottom:14px;border-bottom:2px solid var(--cv-accent);margin-bottom:22px}.cv-studio .cv-resume-header h1{font-size:2.15em;margin:0 0 3px;letter-spacing:-.03em;line-height:1.2}.cv-studio .cv-resume-headline{font-size:1.16em;font-weight:700;color:var(--cv-accent);margin-bottom:8px}.cv-studio .cv-resume-contact{font-size:.84em;color:#475569;margin-top:4px}.cv-studio .cv-resume-section{margin-top:19px;break-inside:avoid-page}.cv-studio .cv-resume-section h3{font-size:1.02em;letter-spacing:.075em;margin:0 0 9px;padding-bottom:5px;border-bottom:1px solid #cbd5e1}.cv-studio .cv-resume-section p{margin:5px 0;white-space:pre-wrap}.cv-studio .cv-resume-entry{margin:0 0 14px;break-inside:avoid-page}.cv-studio .cv-resume-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.cv-studio .cv-resume-row span{font-size:.85em;color:#64748b;text-align:right}.cv-studio .cv-resume-subtitle{color:#475569;font-size:.92em;margin-top:2px}.cv-studio .cv-resume-section ul{margin:7px 0 0;padding-left:19px}.cv-studio .cv-resume-section li{margin-bottom:3px}.cv-studio .cv-preview-hint{color:#94a3b8;font-style:italic}
    .cv-studio .cv-modern .cv-resume-header{background:#f1f5f9;margin:-25px -25px 22px;padding:25px;border-bottom:4px solid var(--cv-accent)}.cv-studio .cv-minimal .cv-resume-header{border-bottom:1px solid #cbd5e1}.cv-studio .cv-minimal .cv-resume-section h3{border-bottom:0}.cv-studio .cv-executive .cv-resume-header{text-align:center;border-bottom:1px solid #334155}.cv-studio .cv-creative .cv-resume-header{border-left:6px solid var(--cv-accent);border-bottom:0;padding-left:16px}.cv-studio .cv-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.cv-studio .cv-guide-item{background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:11px}.cv-studio .cv-guide-item h4{margin:0 0 7px}.cv-studio .cv-guide-item p{margin:0;color:#64748b;font-size:13px;line-height:1.65}
    @media(max-width:1000px){.cv-studio .cv-layout{grid-template-columns:1fr}}@media(max-width:600px){.cv-studio .cv-form-grid{grid-template-columns:1fr}.cv-studio .cv-resume-row{display:block}.cv-studio .cv-resume-row span{display:block;text-align:left}.cv-studio .cv-paper{padding:24px}.cv-studio .cv-modern .cv-resume-header{margin:-24px -24px 22px;padding:24px}}
    @page{size:auto;margin:12mm}@media print{body{background:white!important}body *{visibility:hidden!important}#samatkaar-resume,#samatkaar-resume *{visibility:visible!important}#samatkaar-resume{position:absolute!important;left:0!important;top:0!important;width:100%!important;min-height:0!important;padding:0!important;border:0!important;box-shadow:none!important;margin:0!important;background:#fff!important;print-color-adjust:exact;-webkit-print-color-adjust:exact}#samatkaar-resume .cv-resume-section{break-inside:avoid-page}}
  `}</style>
    <div style={styles.wrap}>
      <header className="cv-top"><div><h1>📄 SAMATKAAR CV Studio</h1><p>Build a professional, customizable resume with live preview, editable work history, five designs, PDF printing and local backups. No account required.</p></div><div style={{minWidth:180}}><strong>Resume completeness: {completeness}%</strong><div className="cv-progress" aria-label={`Resume completeness ${completeness}%`}><div style={{width:`${completeness}%`}} /></div></div></header>
      <div className="cv-toolbar"><button type="button" style={styles.button} onClick={() => window.print()}>🖨️ Print / Save PDF</button><button type="button" style={styles.secondary} onClick={exportJSON}>⬇️ Export backup</button><button type="button" style={styles.secondary} onClick={exportText}>⬇️ Export TXT</button><button type="button" style={styles.secondary} onClick={() => importRef.current?.click()}>⬆️ Import backup</button><button type="button" style={styles.danger} onClick={reset}>Clear form</button><input ref={importRef} type="file" accept=".json,application/json" hidden onChange={importJSON} /></div>
      {notice && <p role="status" className="cv-note">{notice} <button type="button" onClick={() => setNotice("")} style={{float:"right",border:0,background:"transparent",cursor:"pointer"}} aria-label="Dismiss">✕</button></p>}
      <div className="cv-layout"><section style={styles.card}><div className="cv-tabs" role="tablist" aria-label="Resume editor sections">{tabs.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</div>
        {tab === "personal" && <><SectionHeading title="Personal information" subtitle="Enter only information you are comfortable sharing with employers."/><div className="cv-form-grid">{["name","headline","email","phone","city","website","linkedin"].map(key => <Field key={key} label={fieldLabels[key]}><input style={styles.input} type={key === "email" ? "email" : "text"} value={data[key]} onChange={e => change(key,e.target.value)} placeholder={fieldLabels[key]} /></Field>)}</div><Field label="Professional summary" hint="Write 2–4 sentences about your relevant skills and experience."><textarea style={styles.input} rows={5} value={data.summary} onChange={e => change("summary",e.target.value)} placeholder="Describe your experience and strengths..." /></Field><Field label="Skills" hint="Separate skills with commas or new lines."><textarea style={styles.input} rows={4} value={data.skills} onChange={e => change("skills",e.target.value)} placeholder="Communication, Excel, React..." /></Field></>}
        {tab === "experience" && <><SectionHeading title="Work experience" subtitle="List jobs, freelance projects, internships or relevant volunteer work. Add achievements on separate lines."/><EditableList title="Work history" kind="jobs" items={data.jobs} add={() => listAdd("jobs",emptyJob)} update={(id,k,v)=>listChange("jobs",id,k,v)} remove={id=>listRemove("jobs",id)}/></>}
        {tab === "education" && <><SectionHeading title="Education" subtitle="Include qualifications, training, institutions and relevant academic details."/><EditableList title="Education history" kind="education" items={data.education} add={() => listAdd("education",emptyEducation)} update={(id,k,v)=>listChange("education",id,k,v)} remove={id=>listRemove("education",id)}/></>}
        {tab === "projects" && <><SectionHeading title="Projects" subtitle="Show work that demonstrates your skills. Describe what you personally contributed."/><EditableList title="Projects" kind="projects" items={data.projects} add={() => listAdd("projects",emptyProject)} update={(id,k,v)=>listChange("projects",id,k,v)} remove={id=>listRemove("projects",id)}/></>}
        {tab === "extras" && <><SectionHeading title="Additional details" subtitle="Add relevant certifications, languages and achievements."/><EditableList title="Certifications & courses" kind="certifications" items={data.certifications} add={() => listAdd("certifications",emptyExtra)} update={(id,k,v)=>listChange("certifications",id,k,v)} remove={id=>listRemove("certifications",id)}/><Field label="Languages"><textarea style={styles.input} value={data.languages} onChange={e=>change("languages",e.target.value)} placeholder="English — Intermediate, Urdu — Fluent" /></Field><Field label="Awards and achievements (one per line)"><textarea style={styles.input} value={data.achievements} onChange={e=>change("achievements",e.target.value)} rows={4}/></Field></>}
        {tab === "design" && <><SectionHeading title="Design your resume" subtitle="Select a professional layout and adjust readability."/><div className="cv-guide-grid">{themes.map(t => <button key={t.id} type="button" onClick={()=>change("theme",t.id)} style={{...styles.secondary,textAlign:"left",borderColor:data.theme===t.id?data.color:"#cbd5e1",background:data.theme===t.id?"#eff6ff":"white"}}><strong>{t.name}</strong><p style={{fontWeight:400,color:"#64748b",marginBottom:0}}>{t.description}</p></button>)}</div><h3>Accent color</h3><div style={{display:"flex",gap:9,flexWrap:"wrap"}}>{palettes.map(c => <button key={c} type="button" aria-label={`Select color ${c}`} aria-pressed={data.color===c} onClick={()=>change("color",c)} style={{width:38,height:38,borderRadius:999,background:c,border:data.color===c?"4px solid #94a3b8":"3px solid white",outline:"1px solid #cbd5e1",cursor:"pointer"}} />)}</div><div className="cv-form-grid" style={{marginTop:20}}><Field label="Font"><select style={styles.input} value={data.font} onChange={e=>change("font",e.target.value)}>{["Arial","Georgia","Times New Roman"].map(f=><option key={f}>{f}</option>)}</select></Field><Field label="Text size"><select style={styles.input} value={data.size} onChange={e=>change("size",e.target.value)}><option value="compact">Compact</option><option value="normal">Normal</option><option value="large">Large</option></select></Field><Field label="Paper"><select style={styles.input} value={data.paper} onChange={e=>change("paper",e.target.value)}><option>A4</option><option>Letter</option></select></Field></div><label className="cv-checkbox"><input type="checkbox" checked={data.showLinks} onChange={e=>change("showLinks",e.target.checked)}/> Show website and LinkedIn in resume</label><label className="cv-checkbox"><input type="checkbox" checked={autosave} onChange={e=>setAutosave(e.target.checked)}/> Save draft automatically in this browser</label><p style={styles.muted}>Tip: For most online applications, Classic or Minimal is easier for automated resume parsers to read.</p></>}
        {tab === "guidance" && <><SectionHeading title="Resume writing guide" subtitle="Practical guidance and example language. Examples are inspiration, not verified personal claims."/><h3>Start with a role example</h3><p style={styles.muted}>Selecting an example replaces the current draft. Change every sample detail before applying.</p><div className="cv-guide-grid">{Object.keys(sampleContent).map(role=><button type="button" key={role} style={styles.secondary} onClick={()=>applyExample(role)}>{role} example</button>)}</div><h3>Professional writing tips</h3><div className="cv-guide-grid">{tips.map(([heading,detail])=><div key={heading} className="cv-guide-item"><h4>{heading}</h4><p>{detail}</p></div>)}</div><h3>Achievement sentence examples</h3><Field label="Find a sentence"><input style={styles.input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search e.g. customer, design, data" /></Field><div className="cv-guide-grid">{examples.filter(x=>x.toLowerCase().includes(query.toLowerCase())).map((sentence,i)=><div className="cv-guide-item" key={i}><p>{sentence}</p><button type="button" style={{...styles.secondary,marginTop:8}} onClick={()=>{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(sentence).then(()=>alert("Sentence copied. Edit it to match your real experience.")).catch(()=>alert("Copy unavailable in this browser."));}else alert("Copy unavailable in this browser.");}}>Copy sentence</button></div>)}</div></>}
      </section>
      <section><div className="cv-preview-toolbar"><h2>Live resume preview</h2><button type="button" style={styles.secondary} onClick={()=>setShowPreview(x=>!x)}>{showPreview?"Hide preview":"Show preview"}</button></div>{showPreview ? <Preview data={data}/> : <div style={styles.card}>Preview hidden. You can continue editing your resume.</div>}<p style={{...styles.muted,fontSize:12,marginTop:14}}>🔒 Drafts are stored in your browser when autosave is enabled. Clearing browser storage can remove your draft. Export a JSON backup to keep a copy. Printing opens your browser's PDF/print dialog; it does not upload your CV.</p></section></div>
    </div>
  </main>;
}
