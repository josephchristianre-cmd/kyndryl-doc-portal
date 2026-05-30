import { useState, useRef, useEffect, useCallback } from "react";

// ─── EMAILJS CONFIG ───────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = "vJyN2T-5XTZ0RC3e-";
const EMAILJS_SERVICE_ID  = "service_q2xite5";
const EMAILJS_TEMPLATE_ID = "template_8dv03qr";
const EMAILJS_ENABLED     = true;

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL     = "https://rukjeevvglztxaydhcyr.supabase.co";
const SUPABASE_ANON    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1a2plZXZ2Z2x6dHhheWRoY3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTA1MDEsImV4cCI6MjA5NTYyNjUwMX0.crHJSqyToPRcGaH2yOYs1BshIS8Ns-7KPVOXdxvhDmM";
const SUPABASE_ENABLED = true;

// ─── Kyndryl Brand ────────────────────────────────────────────────────────────
const K = {
  red:      "#FF462D",
  redDark:  "#E03520",
  redDeep:  "#B82A18",
  redLight: "#FF6B55",
  black:    "#0A0A0A",
  blackAlt: "#111111",
  darkGray: "#1A1A1A",
  midGray:  "#2A2A2A",
  border:   "#2E2E2E",
  borderUp: "#3A3A3A",
  textPri:  "#F5F5F5",
  textSec:  "#9A9A9A",
  textMute: "#555555",
  white:    "#FFFFFF",
  green:    "#22c55e",
  surface:  "#161616",
  surfaceUp:"#1E1E1E",
};

// ─── Docs config ──────────────────────────────────────────────────────────────
const DOCS = [
  { id:"pan",    label:"PAN Card",                  short:"PAN",     emoji:"🪪", accept:"image/*,.pdf", maxMB:5,  required:true  },
  { id:"aadh",   label:"Aadhaar Card",              short:"Aadhaar", emoji:"🪪", accept:"image/*,.pdf", maxMB:5,  required:true  },
  { id:"resume", label:"Resume / CV",               short:"Resume",  emoji:"📄", accept:".pdf,.doc,.docx", maxMB:10, required:true  },
  { id:"offer",  label:"Signed Offer Letter",       short:"Offer",   emoji:"✍️", accept:".pdf",         maxMB:10, required:true  },
  { id:"exp",    label:"Experience Letter",         short:"Exp Ltr", emoji:"🏢", accept:"image/*,.pdf", maxMB:10, required:true  },
  { id:"pay",    label:"Last 3 Payslips",           short:"Payslips",emoji:"💰", accept:".pdf,.zip",    maxMB:20, required:true  },
  { id:"degree", label:"Degree Certificate",        short:"Degree",  emoji:"🎓", accept:"image/*,.pdf", maxMB:10, required:true  },
  { id:"photo",  label:"Passport Photo",            short:"Photo",   emoji:"📸", accept:"image/*",      maxMB:2,  required:true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtSize = b => b<1048576?`${(b/1024).toFixed(0)} KB`:`${(b/1048576).toFixed(1)} MB`;
const getExt  = n => n.split(".").pop().toUpperCase();
const genOTP  = () => Math.floor(100000+Math.random()*900000).toString();
const genRef  = () => `KYN-${Date.now().toString(36).slice(-8).toUpperCase()}`;

// ─── SDK Loaders ──────────────────────────────────────────────────────────────
const loadEmailJS = () => new Promise(res => {
  if (window.emailjs){res(window.emailjs);return;}
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  s.onload=()=>res(window.emailjs); document.head.appendChild(s);
});
const getSupabase = () => new Promise((res,rej) => {
  if (window._sb){res(window._sb);return;}
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  s.onload=()=>{window._sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON);res(window._sb);};
  s.onerror=rej; document.head.appendChild(s);
});
const sendOTP = async({toEmail,toName,otpCode})=>{
  const ejs=await loadEmailJS();
  await ejs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,
    {to_email:toEmail,to_name:toName,otp_code:otpCode,company_name:"Kyndryl"},
    {publicKey:EMAILJS_PUBLIC_KEY});
};
const saveToSupabase = async({user,files,refNumber})=>{
  if(!SUPABASE_ENABLED) return;
  const db=await getSupabase();
  const{data:cand,error:ce}=await db.from("candidates").upsert({
    name:user.name,email:user.email,phone:user.phone,
    job_title:user.jobTitle,submission_status:"submitted",
    reference_number:refNumber,submitted_at:new Date().toISOString(),
  },{onConflict:"email"}).select().single();
  if(ce) throw ce;
  for(const[docId,file] of Object.entries(files)){
    const path=`${user.email.replace(/[^a-z0-9]/gi,"_").toLowerCase()}/${docId}_${Date.now()}_${file.name}`;
    const{error:ue}=await db.storage.from("documents").upload(path,file,{upsert:true});
    if(!ue) await db.from("documents").insert({candidate_id:cand.id,doc_type:docId,file_name:file.name,file_path:path,file_size:file.size});
  }
};

// ─── useIsDesktop ─────────────────────────────────────────────────────────────
const useIsDesktop = ()=>{
  const[d,setD]=useState(()=>typeof window!=="undefined"?window.innerWidth>=900:true);
  useEffect(()=>{
    let t;
    const fn=()=>{clearTimeout(t);t=setTimeout(()=>setD(window.innerWidth>=900),150);};
    window.addEventListener("resize",fn);
    return()=>{window.removeEventListener("resize",fn);clearTimeout(t);};
  },[]);
  return d;
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GlobalStyle=()=>{
  const done=useRef(false);
  if(!done.current&&typeof document!=="undefined"){
    done.current=true;
    const el=document.createElement("style");
    el.textContent=`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      html{scroll-behavior:smooth;}
      body{background:#0A0A0A;-webkit-tap-highlight-color:transparent;font-family:'IBM Plex Sans',sans-serif;}
      input,button,textarea,select{font-family:'IBM Plex Sans',sans-serif;}
      ::-webkit-scrollbar{width:4px;}
      ::-webkit-scrollbar-track{background:#0A0A0A;}
      ::-webkit-scrollbar-thumb{background:#2E2E2E;border-radius:2px;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      .fu{animation:fadeUp 0.45s cubic-bezier(.4,0,.2,1) both;}
      @keyframes spin{to{transform:rotate(360deg)}}
      .spin{animation:spin 0.85s linear infinite;display:inline-block;}
      @keyframes pop{from{transform:scale(0.4);opacity:0}to{transform:scale(1);opacity:1}}
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      .shimmer{background:linear-gradient(90deg,#1E1E1E 25%,#2A2A2A 50%,#1E1E1E 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
      @keyframes confetti-fall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
      .kyn-field{width:100%;background:#161616;border:1px solid #2E2E2E;border-radius:6px;color:#F5F5F5;font-size:15px;outline:none;transition:all 0.15s;}
      .kyn-field:focus{border-color:#FF462D;box-shadow:0 0 0 2px rgba(255,70,45,0.2);}
      .kyn-field::placeholder{color:#555555;}
      .preview-img{width:100%;height:100%;object-fit:contain;}
    `;
    document.head.appendChild(el);
  }
  return null;
};

// ─── Kyndryl Logo ─────────────────────────────────────────────────────────────
const KyndrylLogo=({h=32})=>(
  <svg height={h} viewBox="0 0 180 40" fill="none">
    <text x="0" y="30" fontFamily="'IBM Plex Sans',Arial,sans-serif" fontSize="28" fontWeight="700" fill="#F5F5F5" letterSpacing="-0.5">Kyndryl</text>
    <rect x="0" y="34" width="100" height="2" rx="1" fill="#FF462D"/>
  </svg>
);

// ─── Step Indicator (horizontal stepper — unique to Kyndryl) ─────────────────
const Stepper=({steps,current})=>(
  <div style={{display:"flex",alignItems:"center",gap:0,width:"100%"}}>
    {steps.map((s,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:"none"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div style={{
            width:32,height:32,borderRadius:"50%",
            background:i<current?"#FF462D":i===current?"transparent":"transparent",
            border:`2px solid ${i<=current?"#FF462D":"#2E2E2E"}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:13,fontWeight:700,flexShrink:0,
            color:i<current?"#fff":i===current?"#FF462D":"#555",
            transition:"all 0.3s",
            boxShadow:i===current?"0 0 0 4px rgba(255,70,45,0.15)":"none",
          }}>
            {i<current?"✓":i+1}
          </div>
          <span style={{fontSize:10,fontWeight:500,color:i<=current?"#FF462D":"#555",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{s}</span>
        </div>
        {i<steps.length-1&&(
          <div style={{flex:1,height:2,background:i<current?"#FF462D":"#2E2E2E",margin:"0 8px",marginBottom:20,transition:"background 0.3s"}}/>
        )}
      </div>
    ))}
  </div>
);

// ─── Button ───────────────────────────────────────────────────────────────────
const Btn=({children,onClick,disabled,loading,full,ghost,sm,danger})=>(
  <button onClick={onClick} disabled={disabled||loading} style={{
    width:full?"100%":"auto",
    padding:sm?"8px 18px":"13px 28px",
    borderRadius:6,
    background:ghost?"transparent":danger?"rgba(255,70,45,0.1)":disabled||loading?"#1E1E1E":`#FF462D`,
    border:ghost?`1px solid #3A3A3A`:danger?`1px solid rgba(255,70,45,0.3)`:"none",
    color:ghost?"#9A9A9A":danger?"#FF462D":disabled||loading?"#555":"#fff",
    fontSize:sm?13:15,fontWeight:600,
    cursor:disabled||loading?"not-allowed":"pointer",
    boxShadow:ghost||disabled||loading||danger?"none":"0 2px 12px rgba(255,70,45,0.35)",
    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
    transition:"all 0.15s",touchAction:"manipulation",
    WebkitTapHighlightColor:"transparent",letterSpacing:"0.01em",
  }}
    onMouseEnter={e=>{if(!disabled&&!loading&&!ghost&&!danger){e.currentTarget.style.background="#E03520";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 20px rgba(255,70,45,0.45)";}}}
    onMouseLeave={e=>{if(!ghost&&!danger){e.currentTarget.style.background=disabled||loading?"#1E1E1E":"#FF462D";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=disabled||loading?"none":"0 2px 12px rgba(255,70,45,0.35)";}}}
  >
    {loading?<><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round"/></svg>Please wait…</>:children}
  </button>
);

// ─── Input ────────────────────────────────────────────────────────────────────
const Field=({label,type="text",placeholder,value,onChange,error,hint,icon,right,autoComplete})=>(
  <div>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:600,color:"#9A9A9A",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#555",pointerEvents:"none",fontSize:16}}>{icon}</div>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        autoComplete={autoComplete||"off"} className="kyn-field"
        style={{padding:`12px ${right?46:14}px 12px ${icon?42:14}px`}}/>
      {right&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)"}}>{right}</div>}
    </div>
    {error&&<p style={{color:"#FF6B55",fontSize:12,marginTop:5,display:"flex",alignItems:"center",gap:4}}>⚠ {error}</p>}
    {hint&&!error&&<p style={{color:"#555",fontSize:11,marginTop:4}}>{hint}</p>}
  </div>
);

// ─── OTP Boxes ────────────────────────────────────────────────────────────────
const OTPBox=({value,onChange})=>{
  const r0=useRef(),r1=useRef(),r2=useRef(),r3=useRef(),r4=useRef(),r5=useRef();
  const refs=[r0,r1,r2,r3,r4,r5];
  const digits=value.padEnd(6," ").split("");
  const onKey=(i,e)=>{
    if(e.key==="Backspace"){onChange(value.slice(0,-1));if(i>0&&!digits[i].trim())refs[i-1].current?.focus();return;}
    if(/^\d$/.test(e.key)){const a=[...digits.map(d=>d.trim())];a[i]=e.key;onChange(a.join("").replace(/\s/g,"").slice(0,6));if(i<5)refs[i+1].current?.focus();}
  };
  const onPaste=e=>{const t=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);onChange(t);e.preventDefault();refs[Math.min(t.length,5)].current?.focus();};
  return(
    <div style={{display:"flex",gap:10,justifyContent:"center"}}>
      {refs.map((ref,i)=>(
        <input key={i} ref={ref} type="tel" inputMode="numeric" maxLength={1}
          value={digits[i].trim()} onKeyDown={e=>onKey(i,e)} onPaste={onPaste} onChange={()=>{}}
          style={{
            width:"clamp(44px,10vw,58px)",height:"clamp(52px,12vw,66px)",
            textAlign:"center",fontSize:"clamp(22px,4vw,28px)",fontWeight:700,
            background:K.surface,border:`1.5px solid ${digits[i].trim()?K.red:K.border}`,
            borderRadius:6,color:K.textPri,outline:"none",
            fontFamily:"'IBM Plex Mono',monospace",
            transition:"all 0.15s",boxShadow:digits[i].trim()?`0 0 0 2px ${K.red}33`:"none",
          }}
          onFocus={e=>e.target.style.borderColor=K.red}
          onBlur={e=>e.target.style.borderColor=digits[i].trim()?K.red:K.border}
        />
      ))}
    </div>
  );
};

// ─── UNIQUE FEATURE 1: Document Preview Panel ─────────────────────────────────
// When candidate uploads image/PDF — shows a thumbnail preview inline
const DocPreview=({file})=>{
  const[preview,setPreview]=useState(null);
  useEffect(()=>{
    if(!file) return;
    if(file.type.startsWith("image/")){
      const url=URL.createObjectURL(file);
      setPreview({type:"image",url});
      return()=>URL.revokeObjectURL(url);
    }
    setPreview({type:getExt(file.name),url:null});
  },[file]);
  if(!preview) return null;
  return(
    <div style={{marginTop:8,borderRadius:6,overflow:"hidden",border:`1px solid ${K.border}`,background:K.surface}}>
      {preview.type==="image"?(
        <img src={preview.url} alt="preview" style={{width:"100%",maxHeight:100,objectFit:"cover",display:"block"}}/>
      ):(
        <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:4,background:`${K.red}22`,border:`1px solid ${K.red}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:K.red,fontFamily:"monospace"}}>{preview.type}</div>
          <div>
            <div style={{fontSize:12,color:K.textPri,fontWeight:500}}>{file.name}</div>
            <div style={{fontSize:11,color:K.textSec,marginTop:2}}>{fmtSize(file.size)}</div>
          </div>
          <div style={{marginLeft:"auto",fontSize:18}}>✅</div>
        </div>
      )}
    </div>
  );
};

// ─── UNIQUE FEATURE 2: Upload Row with Preview ────────────────────────────────
const DocRow=({doc,file,onFile,onRemove,error,index})=>{
  const[drag,setDrag]=useState(false);
  const uploaded=!!file;
  const validate=f=>{
    if(!f) return;
    if(f.size>doc.maxMB*1024*1024){onFile(doc.id,null,`Max size is ${doc.maxMB}MB`);return;}
    onFile(doc.id,f,null);
  };
  return(
    <div style={{
      border:`1px solid ${error?K.red:uploaded?K.green:drag?K.red:K.border}`,
      borderRadius:8,overflow:"hidden",
      background:uploaded?"rgba(34,197,94,0.04)":drag?`${K.red}06`:K.surface,
      transition:"all 0.2s",position:"relative",
    }}
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);validate(e.dataTransfer.files[0]);}}>
      {!uploaded&&(
        <input type="file" accept={doc.accept}
          capture={doc.accept.startsWith("image")?"environment":undefined}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0,cursor:"pointer",zIndex:10,fontSize:16}}
          onChange={e=>{if(e.target.files?.[0])validate(e.target.files[0]);e.target.value="";}}
        />
      )}
      <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
        {/* Index number */}
        <div style={{
          width:28,height:28,borderRadius:4,flexShrink:0,
          background:uploaded?`${K.green}15`:error?`${K.red}15`:K.surfaceUp,
          border:`1px solid ${uploaded?`${K.green}44`:error?`${K.red}44`:K.borderUp}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:11,fontWeight:700,color:uploaded?K.green:error?K.red:K.textMute,
          fontFamily:"'IBM Plex Mono',monospace",
        }}>
          {uploaded?"✓":error?"!":String(index+1).padStart(2,"0")}
        </div>
        <div style={{fontSize:18,flexShrink:0}}>{doc.emoji}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:K.textPri}}>{doc.label}</div>
          {uploaded?(
            <div style={{fontSize:11,color:K.green,marginTop:2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</span>
              <span style={{color:K.textMute}}>· {fmtSize(file.size)}</span>
              <span style={{background:`${K.green}15`,color:K.green,padding:"1px 5px",borderRadius:3,fontSize:10,fontWeight:700}}>{getExt(file.name)}</span>
            </div>
          ):error?(
            <div style={{fontSize:11,color:K.redLight,marginTop:2}}>{error}</div>
          ):(
            <div style={{fontSize:11,color:K.textMute,marginTop:2}}>{drag?"📂 Drop to attach":`PDF, JPG, PNG · max ${doc.maxMB}MB`}</div>
          )}
        </div>
        {uploaded?(
          <button onClick={()=>onRemove(doc.id)} style={{
            width:32,height:32,borderRadius:4,flexShrink:0,
            background:"rgba(255,70,45,0.08)",border:"1px solid rgba(255,70,45,0.2)",
            color:"#FF6B55",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,zIndex:11,position:"relative",
          }}>×</button>
        ):(
          <div style={{pointerEvents:"none",flexShrink:0,padding:"6px 12px",borderRadius:4,
            background:`${K.red}0f`,border:`1px solid ${K.red}22`,
            color:K.red,fontSize:11,fontWeight:600}}>
            {drag?"Drop":"Browse"}
          </div>
        )}
      </div>
      {/* Image/PDF preview */}
      {uploaded&&<div style={{padding:"0 14px 12px"}}><DocPreview file={file}/></div>}
      {!uploaded&&doc.accept.startsWith("image")&&(
        <div style={{padding:"0 14px 10px",fontSize:11,color:K.textMute}}>📷 Mobile: tap to take photo directly</div>
      )}
    </div>
  );
};

// ─── UNIQUE FEATURE 3: Completion Bar (segmented) ─────────────────────────────
const CompletionBar=({files})=>{
  const done=Object.keys(files).length;
  const total=DOCS.length;
  const pct=Math.round((done/total)*100);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:12,color:K.textSec,fontFamily:"'IBM Plex Mono',monospace"}}>{done}/{total} documents</span>
        <span style={{fontSize:12,fontWeight:700,color:done===total?K.green:K.red,fontFamily:"'IBM Plex Mono',monospace"}}>{pct}%</span>
      </div>
      {/* Segmented bar — each segment = one doc */}
      <div style={{display:"flex",gap:3,height:6}}>
        {DOCS.map((doc,i)=>(
          <div key={doc.id} style={{
            flex:1,borderRadius:2,
            background:files[doc.id]?K.green:K.surfaceUp,
            transition:"background 0.4s ease",
          }}/>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>
        {DOCS.map(doc=>(
          <div key={doc.id} style={{
            fontSize:10,padding:"3px 8px",borderRadius:4,fontWeight:500,
            background:files[doc.id]?`${K.green}18`:`${K.red}0a`,
            color:files[doc.id]?K.green:K.textMute,
            border:`1px solid ${files[doc.id]?`${K.green}33`:K.border}`,
            transition:"all 0.3s",
          }}>
            {files[doc.id]?"✓ ":""}{doc.short}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── UNIQUE FEATURE 4: Confetti on success ────────────────────────────────────
const Confetti=()=>{
  const colors=["#FF462D","#FF6B55","#ffffff","#FFB3A7","#FF8875"];
  const pieces=Array.from({length:40},(_,i)=>({
    id:i,
    left:`${Math.random()*100}%`,
    color:colors[Math.floor(Math.random()*colors.length)],
    size:Math.random()*8+4,
    delay:`${Math.random()*2}s`,
    duration:`${Math.random()*2+2}s`,
    rotate:Math.random()*360,
  }));
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      {pieces.map(p=>(
        <div key={p.id} style={{
          position:"absolute",top:-20,left:p.left,
          width:p.size,height:p.size,
          background:p.color,
          borderRadius:Math.random()>0.5?"50%":"2px",
          animation:`confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          transform:`rotate(${p.rotate}deg)`,
        }}/>
      ))}
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header=({isDesktop,step,totalSteps,user,showUser})=>(
  <header style={{
    position:"sticky",top:0,zIndex:100,
    background:"rgba(10,10,10,0.96)",backdropFilter:"blur(16px)",
    borderBottom:`1px solid ${K.border}`,
  }}>
    <div style={{maxWidth:1100,margin:"0 auto",padding:"0 clamp(16px,3vw,48px)",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
      <KyndrylLogo h={isDesktop?28:22}/>
      {showUser&&isDesktop&&<span style={{fontSize:12,color:K.textMute,fontFamily:"'IBM Plex Mono',monospace"}}>{user?.email}</span>}
      <div style={{fontSize:11,color:K.textMute,padding:"4px 10px",background:K.surface,border:`1px solid ${K.border}`,borderRadius:4,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.05em"}}>
        Talent Onboarding
      </div>
    </div>
  </header>
);

// ─── Shell — OUTSIDE main component so it never remounts on state change ────────
const Shell = ({ children, showUser=false, wide=false, isDesktop, user, submitting, uploadPct }) => (
  <div style={{minHeight:"100vh",background:K.black,color:K.textPri,fontFamily:"'IBM Plex Sans',sans-serif"}}>
    <GlobalStyle/>
    {submitting&&(
      <div style={{position:"fixed",top:0,left:0,right:0,height:3,zIndex:300,background:K.surfaceUp}}>
        <div style={{height:"100%",background:K.red,width:`${uploadPct}%`,transition:"width 0.2s",boxShadow:`0 0 8px ${K.red}`}}/>
      </div>
    )}
    <Header isDesktop={isDesktop} user={user} showUser={showUser}/>
    <main style={{maxWidth:wide?1100:520,margin:"0 auto",padding:"clamp(28px,5vw,56px) clamp(14px,4vw,40px) 80px"}}>
      {children}
    </main>
    <footer style={{borderTop:`1px solid ${K.border}`,padding:"16px 24px",textAlign:"center",fontSize:11,color:K.textMute,fontFamily:"'IBM Plex Mono',monospace"}}>
      © {new Date().getFullYear()} Kyndryl, Inc. · All rights reserved · Confidential
    </footer>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function KyndrylDocPortal(){
  const isDesktop=useIsDesktop();
  const[screen,setScreen]=useState("auth");       // auth | otp | upload | success
  const[authMode,setAuthMode]=useState("signup"); // signup | signin
  const[user,setUser]=useState({name:"",email:"",phone:"",jobTitle:"",password:""});
  const[errs,setErrs]=useState({});
  const[showPass,setShowPass]=useState(false);
  const[loading,setLoading]=useState(false);

  // OTP
  const[otp,setOtp]=useState("");
  const[otpReal,setOtpReal]=useState("");
  const[otpErr,setOtpErr]=useState("");
  const[otpSent,setOtpSent]=useState(false);
  const[otpTimer,setOtpTimer]=useState(0);
  const[copied,setCopied]=useState(false);

  // Upload
  const[files,setFiles]=useState({});
  const[fileErr,setFileErr]=useState({});
  const[submitting,setSubmit]=useState(false);
  const[uploadPct,setUploadPct]=useState(0);
  const[refNum,setRefNum]=useState("");
  const[showConfetti,setShowConfetti]=useState(false);

  useEffect(()=>{
    if(otpTimer<=0) return;
    const t=setInterval(()=>setOtpTimer(p=>p-1),1000);
    return()=>clearInterval(t);
  },[otpTimer]);

  const setF=k=>e=>setUser(p=>({...p,[k]:e.target.value}));

  const validateSignUp=()=>{
    const e={};
    if(!user.name.trim())                               e.name="Full name required";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) e.email="Valid email required";
    if(!/^[6-9]\d{9}$/.test(user.phone))                e.phone="Valid 10-digit mobile required";
    if(!user.jobTitle.trim())                           e.jobTitle="Job title required";
    if(user.password.length<8)                          e.password="Minimum 8 characters";
    setErrs(e); return!Object.keys(e).length;
  };
  const validateSignIn=()=>{
    const e={};
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) e.email="Valid email required";
    if(!user.password)                                  e.password="Password required";
    setErrs(e); return!Object.keys(e).length;
  };

  const doSendOtp=async()=>{
    if(!validateSignUp()) return;
    setLoading(true);
    const code=genOTP(); setOtpReal(code); setOtp(""); setOtpErr(""); setOtpSent(false);
    if(EMAILJS_ENABLED){
      try{await sendOTP({toEmail:user.email,toName:user.name,otpCode:code}); setOtpSent(true);}
      catch(e){console.error("[EmailJS]",e);}
    }
    setOtpTimer(60); setLoading(false); setScreen("otp");
  };

  const doSignIn=async()=>{
    if(!validateSignIn()) return;
    setLoading(true); await new Promise(r=>setTimeout(r,1000));
    setLoading(false); setScreen("upload");
  };

  const verifyOtp=async()=>{
    if(otp.length<6){setOtpErr("Enter complete 6-digit OTP");return;}
    if(otp!==otpReal){setOtpErr("Incorrect OTP — please try again");return;}
    setLoading(true); await new Promise(r=>setTimeout(r,600));
    setLoading(false); setScreen("upload");
  };

  const resendOtp=async()=>{
    const code=genOTP(); setOtpReal(code); setOtp(""); setOtpErr(""); setOtpTimer(60);
    if(EMAILJS_ENABLED) try{await sendOTP({toEmail:user.email,toName:user.name,otpCode:code}); setOtpSent(true);}catch{}
  };

  const handleFile=useCallback((id,file,error)=>{
    if(error){setFileErr(p=>({...p,[id]:error}));setFiles(p=>{const n={...p};delete n[id];return n;});}
    else{setFiles(p=>({...p,[id]:file}));setFileErr(p=>{const n={...p};delete n[id];return n;});}
  },[]);
  const removeFile=useCallback(id=>{
    setFiles(p=>{const n={...p};delete n[id];return n;});
    setFileErr(p=>{const n={...p};delete n[id];return n;});
  },[]);

  const handleSubmit=async()=>{
    const missing={};
    DOCS.forEach(d=>{if(!files[d.id])missing[d.id]="Required";});
    if(Object.keys(missing).length){setFileErr(missing);window.scrollTo({top:0,behavior:"smooth"});return;}
    setSubmit(true);
    const ref=genRef(); setRefNum(ref);
    if(SUPABASE_ENABLED){
      try{
        setUploadPct(10);
        await saveToSupabase({user,files,refNumber:ref});
        for(let i=40;i<=100;i+=5){await new Promise(r=>setTimeout(r,60));setUploadPct(i);}
      }catch(e){
        console.error("[Supabase]",e);
        for(let i=0;i<=100;i+=5){await new Promise(r=>setTimeout(r,50));setUploadPct(i);}
      }
    }else{
      for(let i=0;i<=100;i+=3){await new Promise(r=>setTimeout(r,55));setUploadPct(i);}
    }
    setSubmit(false);
    setShowConfetti(true);
    setTimeout(()=>setShowConfetti(false),4000);
    setScreen("success");
  };

  const uploadedCount=Object.keys(files).length;
  const allDone=uploadedCount===DOCS.length;

  // Shell defined outside — passed as component with props

  // ════════════════ AUTH SCREEN ════════════════
  if(screen==="auth") return(
    <Shell isDesktop={isDesktop} user={user} submitting={submitting} uploadPct={uploadPct}>
      <div className="fu">
        {/* Hero */}
        <div style={{marginBottom:36,textAlign:"center"}}>
          <div style={{
            width:64,height:64,borderRadius:12,margin:"0 auto 16px",
            background:`${K.red}18`,border:`1px solid ${K.red}33`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
          }}>📋</div>
          <h1 style={{fontSize:"clamp(22px,5vw,30px)",fontWeight:700,letterSpacing:"-0.5px",marginBottom:8}}>
            {authMode==="signup"?"Create your account":"Welcome back"}
          </h1>
          <p style={{color:K.textSec,fontSize:14,lineHeight:1.6,maxWidth:400,margin:"0 auto"}}>
            {authMode==="signup"
              ?"Register with your offer letter email to submit your joining documents."
              :"Sign in with your registered credentials."}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex",background:K.surface,borderRadius:8,padding:4,marginBottom:28,border:`1px solid ${K.border}`}}>
          {["signup","signin"].map(m=>(
            <button key={m} onClick={()=>{setAuthMode(m);setErrs({});}} style={{
              flex:1,padding:"9px 0",borderRadius:6,border:"none",cursor:"pointer",
              background:authMode===m?K.red:"transparent",
              color:authMode===m?"#fff":K.textSec,
              fontSize:13,fontWeight:600,transition:"all 0.2s",
            }}>{m==="signup"?"New Candidate":"Returning Candidate"}</button>
          ))}
        </div>

        {/* Form */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {authMode==="signup"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:isDesktop?"1fr 1fr":"1fr",gap:16}}>
                <Field label="Full Name" placeholder="As on Aadhaar / PAN" value={user.name} onChange={setF("name")} error={errs.name} icon="👤" autoComplete="name"/>
                <Field label="Mobile" type="tel" placeholder="10-digit number" value={user.phone} onChange={setF("phone")} error={errs.phone} icon="📱" autoComplete="tel"/>
              </div>
              <Field label="Job Title" placeholder="e.g. Senior Consultant" value={user.jobTitle} onChange={setF("jobTitle")} error={errs.jobTitle} icon="💼"/>
            </>
          )}
          <Field label="Email Address" type="email" placeholder="your.email@gmail.com" value={user.email} onChange={setF("email")} error={errs.email} icon="📧" autoComplete="email"/>
          <Field label="Password" type={showPass?"text":"password"} placeholder={authMode==="signup"?"Set a password (min 8 chars)":"Your password"} value={user.password} onChange={setF("password")} error={errs.password} icon="🔒" autoComplete={authMode==="signup"?"new-password":"current-password"}
            right={<button onClick={()=>setShowPass(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",color:K.textMute,fontSize:16,padding:4}}>{showPass?"🙈":"👁"}</button>}
          />
        </div>

        <div style={{marginTop:22}}>
          <Btn full onClick={authMode==="signup"?doSendOtp:doSignIn} loading={loading}>
            {authMode==="signup"?"Send Verification OTP →":"Sign In →"}
          </Btn>
        </div>

        {/* Security note */}
        <div style={{marginTop:20,padding:"12px 14px",background:K.surface,border:`1px solid ${K.border}`,borderRadius:6,fontSize:12,color:K.textMute,lineHeight:1.6}}>
          🔒 This portal is exclusively for Kyndryl candidates. Use the email address mentioned in your offer letter.
        </div>
      </div>
    </Shell>
  );

  // ════════════════ OTP SCREEN ════════════════
  if(screen==="otp") return(
    <Shell isDesktop={isDesktop} user={user} submitting={submitting} uploadPct={uploadPct}>
      <div className="fu" style={{textAlign:"center"}}>
        <div style={{width:60,height:60,borderRadius:12,margin:"0 auto 18px",background:`${K.red}15`,border:`1px solid ${K.red}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>📧</div>
        <h1 style={{fontSize:"clamp(20px,4vw,26px)",fontWeight:700,marginBottom:8,letterSpacing:"-0.3px"}}>Verify your email</h1>
        <p style={{color:K.textSec,fontSize:14,lineHeight:1.7,maxWidth:360,margin:"0 auto 20px"}}>
          Verification code for <strong style={{color:K.textPri}}>{user.email}</strong>
        </p>

        {/* OTP Display */}
        <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:8,padding:"16px 18px",marginBottom:22,textAlign:"left",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:K.red}}/>
          <div style={{fontSize:11,fontWeight:600,color:K.red,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:8}}>🔐 Your OTP</div>
          <p style={{fontSize:12,color:K.textSec,marginBottom:12,lineHeight:1.5}}>
            {otpSent?<>Also sent to <strong style={{color:K.textPri}}>{user.email}</strong></>:<>Enter this code below. Valid for 10 minutes.</>}
          </p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:K.blackAlt,borderRadius:6,padding:"12px 16px"}}>
            <div>
              <div style={{fontSize:11,color:K.textMute,marginBottom:2}}>One-Time Password</div>
              <div style={{fontSize:34,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,color:K.red,letterSpacing:"0.2em"}}>{otpReal}</div>
            </div>
            <button onClick={()=>{navigator.clipboard?.writeText(otpReal);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
              style={{padding:"9px 16px",borderRadius:6,cursor:"pointer",background:copied?`${K.green}18`:K.surfaceUp,border:`1px solid ${copied?K.green:K.border}`,color:copied?K.green:K.textSec,fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all 0.2s"}}>
              {copied?"✓ Copied":"Copy"}
            </button>
          </div>
        </div>

        <OTPBox value={otp} onChange={setOtp}/>
        {otpErr&&<p style={{color:K.redLight,fontSize:13,marginTop:12}}>⚠ {otpErr}</p>}

        <div style={{marginTop:20}}><Btn full onClick={verifyOtp} loading={loading}>Verify & Continue →</Btn></div>
        <div style={{marginTop:14,fontSize:13,color:K.textMute}}>
          {otpTimer>0?<>Resend in <strong style={{color:K.textSec,fontFamily:"monospace"}}>{otpTimer}s</strong></>:<button onClick={resendOtp} style={{background:"none",border:"none",color:K.red,cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>Resend OTP</button>}
        </div>
        <p style={{marginTop:10,fontSize:12,color:K.textMute}}>
          Wrong email?{" "}
          <button onClick={()=>setScreen("auth")} style={{background:"none",border:"none",color:K.red,cursor:"pointer",fontWeight:600,fontSize:12,fontFamily:"inherit"}}>Go back</button>
        </p>
      </div>
    </Shell>
  );

  // ════════════════ UPLOAD SCREEN ════════════════
  if(screen==="upload") return(
    <Shell isDesktop={isDesktop} user={user} submitting={submitting} uploadPct={uploadPct} showUser wide>
      <div className="fu">
        {/* Page header */}
        <div style={{marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:`${K.red}12`,border:`1px solid ${K.red}28`,borderRadius:4,padding:"3px 10px",marginBottom:12}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:K.red}}/>
            <span style={{fontSize:10,color:K.red,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase"}}>Document Submission</span>
          </div>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
            <div>
              <h1 style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:700,letterSpacing:"-0.5px",lineHeight:1.3,marginBottom:6}}>Upload Your Documents</h1>
              <p style={{color:K.textSec,fontSize:14}}>
                Hi <strong style={{color:K.red}}>{user.name||"Candidate"}</strong> — {uploadedCount} of {DOCS.length} documents uploaded.
              </p>
            </div>
          </div>
        </div>

        {/* Desktop layout: 2-col */}
        {isDesktop?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:28,alignItems:"start"}}>
            {/* Left — doc list */}
            <div>
              {/* Security notice */}
              <div style={{background:`${K.red}08`,border:`1px solid ${K.red}22`,borderRadius:6,padding:"10px 14px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:10}}>
                <span style={{flexShrink:0,fontSize:16}}>🔒</span>
                <p style={{color:"#FF8875",fontSize:12,lineHeight:1.6}}>All uploads are <strong>AES-256 encrypted</strong>. Accessible only to Kyndryl Talent Acquisition. Automatically deleted after 90 days.</p>
              </div>

              {Object.keys(fileErr).length>0&&(
                <div style={{background:`${K.red}0a`,border:`1px solid ${K.red}25`,borderRadius:6,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#FFB3A7"}}>
                  ⚠ {Object.keys(fileErr).length} document(s) need attention before submitting.
                </div>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {DOCS.map((doc,i)=>(
                  <div key={doc.id} className="fu" style={{animationDelay:`${i*0.03}s`}}>
                    <DocRow doc={doc} file={files[doc.id]} onFile={handleFile} onRemove={removeFile} error={fileErr[doc.id]} index={i}/>
                  </div>
                ))}
              </div>

              <p style={{textAlign:"center",color:K.textMute,fontSize:11,marginTop:16,lineHeight:1.7}}>
                By submitting you confirm all documents are genuine. Fraudulent submissions may result in offer withdrawal.
              </p>
            </div>

            {/* Right — sticky sidebar */}
            <div style={{position:"sticky",top:80,display:"flex",flexDirection:"column",gap:14}}>
              {/* Completion bar card */}
              <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:8,padding:20}}>
                <div style={{fontSize:12,fontWeight:600,color:K.textSec,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Progress</div>
                <CompletionBar files={files}/>
              </div>

              {/* Submit button card */}
              <div style={{background:K.surface,border:`1px solid ${allDone?K.red:K.border}`,borderRadius:8,padding:20,transition:"border-color 0.3s"}}>
                <div style={{fontSize:12,color:K.textSec,marginBottom:12,lineHeight:1.5}}>
                  {allDone
                    ? <span style={{color:K.green}}>✅ All documents ready — review and submit.</span>
                    : `${DOCS.length-uploadedCount} more document${DOCS.length-uploadedCount!==1?"s":""} needed.`}
                </div>
                <Btn full loading={submitting} onClick={handleSubmit} disabled={!allDone&&uploadedCount>0}>
                  {submitting?`Uploading… ${uploadPct}%`:"Submit Documents →"}
                </Btn>
                {!allDone&&<p style={{textAlign:"center",fontSize:11,color:K.textMute,marginTop:8}}>Upload all {DOCS.length} documents to enable</p>}
              </div>

              {/* Logout */}
              <Btn ghost sm onClick={()=>setScreen("auth")}>← Sign Out</Btn>
            </div>
          </div>
        ):(
          /* Mobile layout */
          <div>
            <div style={{background:`${K.red}08`,border:`1px solid ${K.red}22`,borderRadius:6,padding:"10px 14px",marginBottom:16,display:"flex",gap:10}}>
              <span style={{flexShrink:0}}>🔒</span>
              <p style={{color:"#FF8875",fontSize:12,lineHeight:1.6}}>All uploads are encrypted. Accessible only to Kyndryl Talent Acquisition.</p>
            </div>

            {Object.keys(fileErr).length>0&&(
              <div style={{background:`${K.red}0a`,border:`1px solid ${K.red}25`,borderRadius:6,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#FFB3A7"}}>
                ⚠ {Object.keys(fileErr).length} document(s) need attention.
              </div>
            )}

            <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:8,padding:16,marginBottom:16}}>
              <CompletionBar files={files}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {DOCS.map((doc,i)=>(
                <DocRow key={doc.id} doc={doc} file={files[doc.id]} onFile={handleFile} onRemove={removeFile} error={fileErr[doc.id]} index={i}/>
              ))}
            </div>

            <Btn full loading={submitting} onClick={handleSubmit}>
              {submitting?`Uploading… ${uploadPct}%`:"Submit Documents →"}
            </Btn>
          </div>
        )}
      </div>
    </Shell>
  );

  // ════════════════ SUCCESS SCREEN ════════════════
  if(screen==="success") return(
    <>
      {showConfetti&&<Confetti/>}
      <Shell isDesktop={isDesktop} user={user} submitting={submitting} uploadPct={uploadPct}>
        <div className="fu" style={{textAlign:"center"}}>
          <div style={{
            width:88,height:88,borderRadius:"50%",margin:"0 auto 22px",
            background:"linear-gradient(135deg,#22c55e,#16a34a)",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 0 48px rgba(34,197,94,0.4)",
            animation:"pop 0.6s cubic-bezier(.175,.885,.32,1.275) both",
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <div style={{display:"inline-block",background:`${K.red}12`,border:`1px solid ${K.red}28`,borderRadius:4,padding:"3px 10px",marginBottom:14}}>
            <span style={{fontSize:10,color:K.red,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase"}}>Submission Complete</span>
          </div>

          <h1 style={{fontSize:"clamp(22px,5vw,32px)",fontWeight:700,letterSpacing:"-0.5px",marginBottom:10}}>
            Documents Submitted!
          </h1>
          <p style={{color:K.textSec,fontSize:14,lineHeight:1.7,maxWidth:420,margin:"0 auto 24px"}}>
            Thank you, <strong style={{color:K.red}}>{user.name}</strong>.<br/>
            Kyndryl Talent Acquisition will review your documents and reach out to <strong style={{color:K.textPri}}>{user.email}</strong> within 1–2 business days.
          </p>

          {/* Summary of submitted docs */}
          <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:8,padding:"16px 20px",maxWidth:420,margin:"0 auto 20px",textAlign:"left"}}>
            <div style={{fontSize:11,fontWeight:600,color:K.textSec,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Documents Submitted</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {DOCS.map(doc=>(
                <div key={doc.id} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:K.green}}>
                  <span style={{fontSize:10,flexShrink:0}}>✓</span>
                  <span style={{color:K.textSec}}>{doc.short}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference number */}
          <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:8,padding:"16px 24px",maxWidth:340,margin:"0 auto 24px"}}>
            <div style={{fontSize:11,color:K.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,fontFamily:"'IBM Plex Mono',monospace"}}>Reference Number</div>
            <div style={{fontSize:22,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,color:K.red,letterSpacing:"0.1em"}}>{refNum}</div>
            <div style={{fontSize:11,color:K.textMute,marginTop:4}}>Save this for future correspondence</div>
          </div>

          <Btn ghost onClick={()=>{setScreen("auth");setUser({name:"",email:"",phone:"",jobTitle:"",password:""});setFiles({});setFileErr({});setRefNum("");}}>
            ← Back to Portal
          </Btn>
        </div>
      </Shell>
    </>
  );
}
