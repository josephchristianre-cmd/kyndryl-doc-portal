import { useState, useRef, useEffect } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://rukjeevvglztxaydhcyr.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1a2plZXZ2Z2x6dHhheWRoY3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTA1MDEsImV4cCI6MjA5NTYyNjUwMX0.crHJSqyToPRcGaH2yOYs1BshIS8Ns-7KPVOXdxvhDmM";
const ADMIN_PASS    = "KYN@HR2026";

// ─── Brand ────────────────────────────────────────────────────────────────────
const K = {
  red:      "#FF462D", redDk: "#E03520", redLt: "#FF6B55",
  bg:       "#0A0A0A", bgAlt: "#111111",
  surface:  "#161616", surfaceUp: "#1E1E1E",
  border:   "#2E2E2E", borderUp: "#3A3A3A",
  textPri:  "#F5F5F5", textSec: "#9A9A9A", textMute: "#555555",
  green:    "#22c55e", greenDk: "#16a34a",
  white:    "#FFFFFF",
};

// ─── SDK ──────────────────────────────────────────────────────────────────────
const getSB = () => new Promise((res,rej) => {
  const KEY = '_sbKYN';
  if (window[KEY]) { res(window[KEY]); return; }
  const tryLoad = (src) => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });
  tryLoad("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js")
    .catch(() => tryLoad("https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"))
    .then(() => { window[KEY] = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON); res(window[KEY]); })
    .catch(rej);
});

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}) : "—";
const fmtTime = d => d ? new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "";
const getIP   = async () => { try { const r = await fetch("https://api.ipify.org?format=json"); const d = await r.json(); return d.ip; } catch { return "Unknown"; } };

const useIsDesktop = () => {
  const[d,setD]=useState(()=>typeof window!=="undefined"?window.innerWidth>=900:true);
  useEffect(()=>{let t;const fn=()=>{clearTimeout(t);t=setTimeout(()=>setD(window.innerWidth>=900),150);};window.addEventListener("resize",fn);return()=>{window.removeEventListener("resize",fn);clearTimeout(t);};},[]);
  return d;
};

const CSS = () => {
  const done = useRef(false);
  if (!done.current && typeof document !== "undefined") {
    done.current = true;
    const el = document.createElement("style");
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#0A0A0A;font-family:'IBM Plex Sans',sans-serif;color:#F5F5F5;}
      input,button,select,textarea{font-family:'IBM Plex Sans',sans-serif;}
      ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#2E2E2E;border-radius:2px;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fadeUp 0.4s ease both;}
      @keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 0.85s linear infinite;display:inline-block;}
      @keyframes pop{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}} .blink{animation:blink 1.4s ease infinite;}
      .kyn-input{width:100%;background:#161616;border:1px solid #2E2E2E;border-radius:6px;padding:12px 14px;font-size:14px;color:#F5F5F5;outline:none;transition:all 0.15s;}
      .kyn-input:focus{border-color:#FF462D;box-shadow:0 0 0 2px rgba(255,70,45,0.2);}
      .kyn-input::placeholder{color:#555;}
      .mono{font-family:'IBM Plex Mono',monospace;}
    `;
    document.head.appendChild(el);
  }
  return null;
};

const KynLogo = ({ h=28 }) => (
  <svg height={h} viewBox="0 0 180 38" fill="none">
    <text x="0" y="28" fontFamily="'IBM Plex Sans',Arial,sans-serif" fontSize="26" fontWeight="700" fill="#F5F5F5" letterSpacing="-0.5">Kyndryl</text>
    <rect x="0" y="32" width="100" height="2" rx="1" fill="#FF462D"/>
  </svg>
);

const Btn = ({ children, onClick, loading, full, ghost, sm, disabled }) => (
  <button onClick={onClick} disabled={loading||disabled} style={{
    width:full?"100%":"auto", padding:sm?"8px 16px":"12px 24px",
    borderRadius:6, fontSize:sm?13:14, fontWeight:600,
    background:ghost?"transparent":disabled||loading?"#1E1E1E":K.red,
    border:ghost?`1px solid ${K.borderUp}`:"none",
    color:ghost?K.textSec:disabled||loading?K.textMute:"#fff",
    cursor:disabled||loading?"not-allowed":"pointer",
    boxShadow:ghost||disabled||loading?"none":"0 2px 12px rgba(255,70,45,0.3)",
    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
    transition:"all 0.15s",touchAction:"manipulation",
  }}
    onMouseEnter={e=>{if(!ghost&&!disabled&&!loading){e.currentTarget.style.background=K.redDk;e.currentTarget.style.transform="translateY(-1px)";}}}
    onMouseLeave={e=>{if(!ghost&&!disabled&&!loading){e.currentTarget.style.background=K.red;e.currentTarget.style.transform="translateY(0)";}}}
  >
    {loading?<><svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round"/></svg>Please wait…</>:children}
  </button>
);

const Field = ({ label, type="text", placeholder, value, onChange, error }) => (
  <div>
    <label style={{display:"block",fontSize:11,fontWeight:600,color:K.textSec,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6}}>{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} className="kyn-input"/>
    {error&&<p style={{color:K.redLt,fontSize:12,marginTop:5}}>⚠ {error}</p>}
  </div>
);

// ─── UNIQUE: E-Sign Pad ───────────────────────────────────────────────────────
const ESignPad = ({ onSign, onSkip }) => {
  const canvasRef = useRef();
  const [drawing, setDrawing] = useState(false);
  const [hasSign, setHasSign] = useState(false);
  const [typed, setTyped]     = useState("");
  const [mode, setMode]       = useState("draw"); // draw | type

  const startDraw = (e) => {
    setDrawing(true);
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - r.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - r.top;
    const ctx = c.getContext("2d");
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!drawing) return;
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - r.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - r.top;
    const ctx = c.getContext("2d");
    ctx.strokeStyle = "#FF462D"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.lineTo(x, y); ctx.stroke();
    setHasSign(true);
  };
  const endDraw = () => setDrawing(false);
  const clearPad = () => {
    const c = canvasRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setHasSign(false);
  };

  const handleSign = () => {
    if (mode === "draw" && !hasSign) return;
    if (mode === "type" && !typed.trim()) return;
    onSign(mode === "type" ? typed : "signed");
  };

  return (
    <div style={{ background:K.surface, border:`1px solid ${K.border}`, borderRadius:10, padding:22 }}>
      <div style={{ fontSize:12, fontWeight:600, color:K.red, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:14 }}>
        ✍️ Electronic Signature Required
      </div>
      <p style={{ fontSize:13, color:K.textSec, lineHeight:1.6, marginBottom:16 }}>
        By signing below, you acknowledge receipt of this offer letter and agree to its terms.
      </p>

      {/* Mode toggle */}
      <div style={{ display:"flex", background:K.surfaceUp, borderRadius:6, padding:3, marginBottom:16, border:`1px solid ${K.border}` }}>
        {["draw","type"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:"7px 0", borderRadius:4, border:"none", cursor:"pointer", background:mode===m?K.red:"transparent", color:mode===m?"#fff":K.textSec, fontSize:12, fontWeight:600, transition:"all 0.2s" }}>
            {m === "draw" ? "✍ Draw" : "⌨ Type"}
          </button>
        ))}
      </div>

      {mode === "draw" ? (
        <div style={{ position:"relative" }}>
          <canvas ref={canvasRef} width={360} height={120}
            style={{ width:"100%", height:120, background:K.surfaceUp, border:`1px solid ${K.border}`, borderRadius:6, cursor:"crosshair", touchAction:"none", display:"block" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
          {!hasSign && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              <span style={{ fontSize:13, color:K.textMute }}>Sign here ↑</span>
            </div>
          )}
          {hasSign && (
            <button onClick={clearPad} style={{ position:"absolute", top:8, right:8, background:K.surface, border:`1px solid ${K.border}`, borderRadius:4, padding:"3px 8px", fontSize:11, color:K.textSec, cursor:"pointer" }}>Clear</button>
          )}
        </div>
      ) : (
        <input type="text" value={typed} onChange={e=>setTyped(e.target.value)}
          placeholder="Type your full name as signature"
          className="kyn-input"
          style={{ fontFamily:"cursive", fontSize:18, color:K.red, fontStyle:"italic" }}
        />
      )}

      <div style={{ display:"flex", gap:10, marginTop:14 }}>
        <Btn full onClick={handleSign} disabled={mode==="draw"?!hasSign:!typed.trim()}>
          Confirm & Proceed to Download
        </Btn>
        <Btn ghost sm onClick={onSkip}>Skip</Btn>
      </div>
    </div>
  );
};

// ─── UNIQUE: Audit Log ────────────────────────────────────────────────────────
const AuditLog = ({ logs }) => (
  <div style={{ background:K.surface, border:`1px solid ${K.border}`, borderRadius:8, overflow:"hidden" }}>
    <div style={{ padding:"12px 16px", borderBottom:`1px solid ${K.border}`, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:6, height:6, borderRadius:"50%", background:K.red }} className="blink"/>
      <span style={{ fontSize:11, fontWeight:600, color:K.textSec, textTransform:"uppercase", letterSpacing:"0.08em" }} className="mono">Access Audit Log</span>
    </div>
    <div style={{ maxHeight:200, overflowY:"auto" }}>
      {logs.length === 0 ? (
        <div style={{ padding:"16px", fontSize:12, color:K.textMute, textAlign:"center" }}>No activity yet</div>
      ) : logs.map((log, i) => (
        <div key={i} style={{ padding:"10px 16px", borderBottom:i<logs.length-1?`1px solid ${K.border}`:"none", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:log.type==="download"?K.green:K.red, flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, color:K.textPri }} className="mono">{log.action}</p>
            <p style={{ fontSize:11, color:K.textMute, marginTop:2 }} className="mono">{log.ip} · {fmtDate(log.time)} {fmtTime(log.time)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const AdminPanel = ({ onBack }) => {
  const [pass, setPass]      = useState("");
  const [authed, setAuthed]  = useState(false);
  const [authErr, setAuthErr]= useState("");
  const [form, setForm]      = useState({name:"",email:"",phone:"",dob:"",jobTitle:"",joiningDate:""});
  const [file, setFile]      = useState(null);
  const [saving, setSaving]  = useState(false);
  const [msg, setMsg]        = useState("");
  const [offers, setOffers]  = useState([]);
  const [loading, setLoading]= useState(false);
  const fileRef = useRef();

  const login = () => {
    if (pass === ADMIN_PASS) { setAuthed(true); loadOffers(); }
    else setAuthErr("Incorrect password");
  };

  const loadOffers = async () => {
    setLoading(true);
    try {
      const db = await getSB();
      const { data } = await db.from("offer_letters").select("*").eq("company","Kyndryl").order("uploaded_at",{ascending:false});
      setOffers(data || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!form.name||!form.email||!form.phone||!form.dob||!form.jobTitle){setMsg("⚠ Fill all required fields");return;}
    if (!file){setMsg("⚠ Please select a PDF");return;}
    setSaving(true); setMsg("");
    try {
      const db = await getSB();
      const path = `kyndryl/${form.email.replace(/[^a-z0-9]/gi,"_")}_${Date.now()}.pdf`;
      const { error:ue } = await db.storage.from("offer-letters").upload(path, file, { upsert:true });
      if (ue) throw ue;
      const { error:ie } = await db.from("offer_letters").upsert({
        candidate_name:  form.name,
        candidate_email: form.email.toLowerCase().trim(),
        candidate_phone: form.phone,
        candidate_dob:   form.dob,
        job_title:       form.jobTitle,
        joining_date:    form.joiningDate||null,
        company:         "Kyndryl",
        file_path:       path,
        file_name:       file.name,
        status:          "pending",
        download_count:  0,
        uploaded_at:     new Date().toISOString(),
      },{onConflict:"candidate_email,company"});
      if (ie) throw ie;
      setMsg("✅ Uploaded!"); setForm({name:"",email:"",phone:"",dob:"",jobTitle:"",joiningDate:""}); setFile(null); loadOffers();
    } catch(e) { setMsg("❌ Failed: "+(e.message||"Unknown error")); }
    setSaving(false);
  };

  if (!authed) return (
    <div style={{minHeight:"100vh",background:K.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <CSS/>
      <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:12,padding:32,width:"100%",maxWidth:360}}>
        <div style={{height:3,background:K.red,borderRadius:"3px 3px 0 0",margin:"-32px -32px 26px"}}/>
        <KynLogo h={24}/>
        <h2 style={{fontSize:17,fontWeight:700,margin:"18px 0 5px"}}>HR Admin Console</h2>
        <p style={{color:K.textSec,fontSize:13,marginBottom:20}}>Manage Kyndryl offer letters.</p>
        <input type="password" placeholder="Admin password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} className="kyn-input" style={{marginBottom:8}}/>
        {authErr&&<p style={{color:K.redLt,fontSize:12,marginBottom:8}}>⚠ {authErr}</p>}
        <Btn full onClick={login}>Login</Btn>
        <button onClick={onBack} style={{display:"block",margin:"12px auto 0",background:"none",border:"none",color:K.textMute,cursor:"pointer",fontSize:12}}>← Back to Portal</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:K.bg,fontFamily:"'IBM Plex Sans',sans-serif",color:K.textPri}}>
      <CSS/>
      <header style={{background:K.bgAlt,borderBottom:`1px solid ${K.border}`,padding:"0 clamp(16px,4vw,48px)",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <KynLogo h={22}/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,fontWeight:600,color:K.red,background:`${K.red}15`,border:`1px solid ${K.red}33`,borderRadius:4,padding:"3px 10px"}} className="mono">ADMIN CONSOLE</span>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${K.border}`,borderRadius:4,padding:"6px 12px",fontSize:12,color:K.textSec,cursor:"pointer"}}>← Exit</button>
        </div>
      </header>
      <main style={{maxWidth:900,margin:"0 auto",padding:"28px clamp(16px,4vw,48px) 80px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
          <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${K.border}`}}>
              <h3 style={{fontSize:14,fontWeight:700}} className="mono">Upload New Offer</h3>
              <p style={{fontSize:12,color:K.textSec,marginTop:2}}>Add candidate record + PDF</p>
            </div>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:12}}>
              {[{label:"Full Name *",key:"name",type:"text",ph:"Candidate full name"},{label:"Email *",key:"email",type:"email",ph:"candidate@gmail.com"},{label:"Phone *",key:"phone",type:"tel",ph:"10-digit mobile"},{label:"Date of Birth *",key:"dob",type:"date",ph:""},{label:"Job Title *",key:"jobTitle",type:"text",ph:"e.g. Senior Engineer"},{label:"Joining Date",key:"joiningDate",type:"date",ph:""}].map(f=>(
                <div key={f.key}>
                  <label style={{fontSize:10,fontWeight:600,color:K.textSec,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:5}} className="mono">{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="kyn-input" style={{fontSize:13}}/>
                </div>
              ))}
              <div>
                <label style={{fontSize:10,fontWeight:600,color:K.textSec,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:5}} className="mono">PDF FILE *</label>
                <div style={{border:`1px dashed ${file?K.green:K.border}`,borderRadius:6,padding:14,textAlign:"center",background:K.surfaceUp,cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>setFile(e.target.files?.[0]||null)}/>
                  {file?<p style={{fontSize:12,color:K.green,fontWeight:600}} className="mono">✓ {file.name}</p>:<p style={{fontSize:12,color:K.textSec}}>Click to select PDF</p>}
                </div>
              </div>
              {msg&&<p style={{fontSize:12,color:msg.startsWith("✅")?K.green:K.redLt,padding:"8px 12px",background:K.surfaceUp,borderRadius:4,border:`1px solid ${msg.startsWith("✅")?K.green+"44":K.red+"33"}`}} className="mono">{msg}</p>}
              <Btn full onClick={handleUpload} loading={saving}>Upload Offer Letter</Btn>
            </div>
          </div>
          <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${K.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><h3 style={{fontSize:14,fontWeight:700}} className="mono">All Records</h3><p style={{fontSize:12,color:K.textSec,marginTop:2}} className="mono">{offers.length} entries</p></div>
              <button onClick={loadOffers} style={{background:"none",border:`1px solid ${K.border}`,borderRadius:4,padding:"5px 10px",fontSize:11,cursor:"pointer",color:K.textSec}} className="mono">↻ SYNC</button>
            </div>
            <div style={{maxHeight:520,overflowY:"auto"}}>
              {loading?<div style={{padding:40,textAlign:"center",color:K.textMute}}>Loading…</div>:
              offers.length===0?<div style={{padding:40,textAlign:"center",color:K.textMute}} className="mono">NO RECORDS</div>:
              offers.map(o=>(
                <div key={o.id} style={{padding:"12px 20px",borderBottom:`1px solid ${K.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:600,color:K.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} className="mono">{o.candidate_name}</p>
                    <p style={{fontSize:11,color:K.textSec,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.candidate_email}</p>
                    <p style={{fontSize:11,color:K.textMute,marginTop:1}}>{o.job_title}</p>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:3,background:o.status==="accepted"?`${K.green}20`:o.status==="declined"?`${K.red}20`:`${K.red}15`,color:o.status==="accepted"?K.green:K.red}} className="mono">{o.status.toUpperCase()}</span>
                    <p style={{fontSize:11,color:K.textMute,marginTop:3}} className="mono">↓ {o.download_count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function KyndrylOfferPortal() {
  const isDesktop = useIsDesktop();
  const [screen, setScreen]     = useState(() => { if(typeof window !== "undefined" && window.location.search.includes("hr_access=true")) return "admin"; return "login"; });
  const [form, setForm]         = useState({ email:"", dob:"", phone:"" });
  const [errs, setErrs]         = useState({});
  const [loading, setLoading]   = useState(false);
  const [offer, setOffer]       = useState(null);
  const [loginErr, setLoginErr] = useState("");
  const [downloading, setDl]    = useState(false);
  const [signed, setSigned]     = useState(false);
  const [auditLogs, setAuditLogs]= useState([]);

  const addLog = (action, type) => {
    getIP().then(ip => {
      setAuditLogs(p => [{ action, type, ip, time: new Date().toISOString() }, ...p]);
    });
  };

  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleLogin = async () => {
    const e = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (!form.dob)   e.dob   = "Date of birth required";
    if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = "Valid 10-digit mobile required";
    setErrs(e); if (Object.keys(e).length) return;
    setLoading(true); setLoginErr("");
    try {
      const db = await getSB();
      const { data, error } = await db.from("offer_letters").select("*")
        .eq("candidate_email", form.email.toLowerCase().trim())
        .eq("candidate_dob",   form.dob)
        .eq("candidate_phone", form.phone)
        .eq("company",         "Kyndryl")
        .single();
      if (error || !data) { setLoginErr("No offer found. Contact hr.onboarding@kyndryl.com"); }
      else {
        setOffer(data);
        addLog("Portal access — login successful", "access");
        setScreen("esign");
      }
    } catch(err) { setLoginErr("Connection error. Please try again."); }
    setLoading(false);
  };

  const handleSign = (sig) => {
    setSigned(true);
    addLog(`E-signature applied (${sig === "signed" ? "drawn" : `typed: ${sig}`})`, "sign");
    setScreen("offer");
  };

  const handleSkipSign = () => {
    addLog("E-signature skipped", "access");
    setScreen("offer");
  };

  const handleDownload = async () => {
    if (!offer?.file_path) return;
    setDl(true);
    try {
      const db = await getSB();
      const { data } = await db.storage.from("offer-letters").createSignedUrl(offer.file_path, 60);
      if (data?.signedUrl) {
        const a = document.createElement("a"); a.href = data.signedUrl; a.download = offer.file_name||"offer-letter.pdf"; a.click();
        await db.from("offer_letters").update({ download_count:(offer.download_count||0)+1 }).eq("id",offer.id);
        setOffer(p=>({...p,download_count:(p.download_count||0)+1}));
        addLog("Offer letter downloaded", "download");
      }
    } catch(e) { alert("Download failed. Please try again."); }
    setDl(false);
  };

  if (screen === "admin") return <AdminPanel onBack={() => setScreen("login")}/>;

  return (
    <div style={{ minHeight:"100vh", background:K.bg, fontFamily:"'IBM Plex Sans',sans-serif", color:K.textPri }}>
      <CSS/>

      <header style={{ background:K.bgAlt, borderBottom:`1px solid ${K.border}`, padding:"0 clamp(16px,4vw,40px)", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <KynLogo h={isDesktop?26:20}/>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {screen!=="login"&&<button onClick={()=>{setScreen("login");setOffer(null);setForm({email:"",dob:"",phone:""});setSigned(false);setAuditLogs([]);}} style={{background:"none",border:`1px solid ${K.border}`,borderRadius:4,padding:"5px 12px",fontSize:12,color:K.textSec,cursor:"pointer"}}>Sign Out</button>}

        </div>
      </header>

      <main style={{ maxWidth: screen==="offer"?980:460, margin:"0 auto", padding:"clamp(28px,5vw,52px) clamp(16px,4vw,40px) 80px" }}>

        {/* ── LOGIN ── */}
        {screen === "login" && (
          <div className="fu">
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ width:56, height:56, borderRadius:10, background:`${K.red}15`, border:`1px solid ${K.red}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 14px" }}>📋</div>
              <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.3px", marginBottom:6 }}>Offer Letter Portal</h1>
              <p style={{ color:K.textSec, fontSize:13, lineHeight:1.6 }}>Secure access to your Kyndryl offer letter.</p>
            </div>

            <div style={{ background:K.surface, border:`1px solid ${K.border}`, borderRadius:10, overflow:"hidden" }}>
              <div style={{ height:3, background:K.red }}/>
              <div style={{ padding:24, display:"flex", flexDirection:"column", gap:14 }}>
                <Field label="Registered Email *" type="email" placeholder="your@gmail.com" value={form.email} onChange={setF("email")} error={errs.email}/>
                <Field label="Date of Birth *" type="date" placeholder="" value={form.dob} onChange={setF("dob")} error={errs.dob}/>
                <Field label="Mobile Number *" type="tel" placeholder="10-digit number" value={form.phone} onChange={setF("phone")} error={errs.phone}/>
              </div>

              {loginErr && (
                <div style={{ margin:"0 24px 16px", padding:"11px 14px", background:`${K.red}0e`, border:`1px solid ${K.red}33`, borderRadius:6, fontSize:13, color:K.redLt }} className="mono">
                  ⚠ {loginErr}
                </div>
              )}

              <div style={{ padding:"0 24px 24px" }}>
                <Btn full onClick={handleLogin} loading={loading}>Access Offer Letter →</Btn>
              </div>
            </div>

            <p style={{ textAlign:"center", fontSize:11, color:K.textMute, marginTop:14 }} className="mono">
              🔒 AES-256 ENCRYPTED · AUDIT LOGGED · KYNDRYL TALENT ACQUISITION
            </p>
          </div>
        )}

        {/* ── E-SIGN ── */}
        {screen === "esign" && offer && (
          <div className="fu">
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:`${K.red}12`, border:`1px solid ${K.red}28`, borderRadius:4, padding:"3px 10px", marginBottom:12 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:K.red }}/>
                <span style={{ fontSize:10, color:K.red, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase" }} className="mono">Step 1 of 2 — E-Signature</span>
              </div>
              <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.3px", marginBottom:4 }}>Acknowledge Receipt</h1>
              <p style={{ color:K.textSec, fontSize:13 }}>Hi <strong style={{ color:K.red }}>{offer.candidate_name}</strong> — please sign to confirm you received your offer letter.</p>
            </div>
            <ESignPad onSign={handleSign} onSkip={handleSkipSign}/>
          </div>
        )}

        {/* ── OFFER VIEW ── */}
        {screen === "offer" && offer && (
          <div className="fu">
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:`${K.red}12`, border:`1px solid ${K.red}28`, borderRadius:4, padding:"3px 10px", marginBottom:12 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:K.red }}/>
                <span style={{ fontSize:10, color:K.red, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase" }} className="mono">Step 2 of 2 — Download</span>
              </div>
              <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.3px" }}>Your Offer Letter</h1>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:isDesktop?"1fr 320px":"1fr", gap:20, alignItems:"start" }}>
              {/* Main card */}
              <div style={{ background:K.surface, border:`1px solid ${K.border}`, borderRadius:10, overflow:"hidden" }}>
                <div style={{ height:3, background:K.red }}/>
                <div style={{ padding:"20px 22px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 20px", marginBottom:20 }}>
                    {[
                      { l:"Candidate",  v:offer.candidate_name,  mono:false },
                      { l:"Role",       v:offer.job_title,        mono:false },
                      { l:"Email",      v:offer.candidate_email,  mono:true  },
                      { l:"Mobile",     v:offer.candidate_phone,  mono:true  },
                      { l:"Joining",    v:fmtDate(offer.joining_date), mono:false },
                      { l:"Downloads",  v:`${offer.download_count} time${offer.download_count!==1?"s":""}`, mono:true },
                    ].map((f,i) => (
                      <div key={i}>
                        <p style={{ fontSize:10, fontWeight:600, color:K.textMute, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:3 }} className="mono">{f.l}</p>
                        <p style={{ fontSize:13, color:K.textPri, fontWeight:500 }} className={f.mono?"mono":""}>{f.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Status */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:K.surfaceUp, border:`1px solid ${K.border}`, borderRadius:6, marginBottom:18 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:offer.status==="accepted"?K.green:offer.status==="declined"?K.red:"#f59e0b", flexShrink:0 }} className={offer.status==="pending"?"blink":""}/>
                    <span style={{ fontSize:12, fontWeight:600, color:K.textSec }} className="mono">
                      STATUS: {offer.status.toUpperCase()}
                    </span>
                    {signed && <span style={{ marginLeft:"auto", fontSize:11, color:K.green }} className="mono">✓ E-SIGNED</span>}
                  </div>

                  <Btn full onClick={handleDownload} loading={downloading}>
                    ↓ Download Offer Letter PDF
                  </Btn>
                </div>
              </div>

              {/* Audit sidebar */}
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <AuditLog logs={auditLogs}/>
                <div style={{ background:K.surface, border:`1px solid ${K.border}`, borderRadius:8, padding:16 }}>
                  <p style={{ fontSize:10, fontWeight:600, color:K.textSec, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:10 }} className="mono">Session Info</p>
                  {[
                    { l:"Company",  v:"Kyndryl" },
                    { l:"Portal",   v:"Offer Access" },
                    { l:"Signed",   v:signed?"Yes":"Skipped" },
                  ].map((f,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:i<2?`1px solid ${K.border}`:"none" }}>
                      <span style={{ fontSize:11, color:K.textMute }} className="mono">{f.l}</span>
                      <span style={{ fontSize:11, color:K.textSec, fontWeight:500 }} className="mono">{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer style={{ borderTop:`1px solid ${K.border}`, padding:"14px 24px", textAlign:"center", fontSize:10, color:K.textMute, background:K.bgAlt }} className="mono">
        © {new Date().getFullYear()} KYNDRYL, INC. · ALL RIGHTS RESERVED · CONFIDENTIAL
      </footer>
    </div>
  );
}
