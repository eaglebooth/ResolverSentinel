"use client";
import Image from "next/image";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {namehash} from "viem/ens";
import {verifyPostcondition} from "@/lib/postconditions";
import {Activity,ArrowUpRight,Check,ChevronRight,Clock3,Database,Eye,FileKey2,Fingerprint,GitCompareArrows,Link2,LockKeyhole,Radio,RefreshCw,ScanSearch,ShieldAlert,ShieldCheck,TerminalSquare,UserRoundCheck,Wallet} from "lucide-react";
import {connect,current,isCorrectNetwork,readJson,readText,transact,validAddress,watchProvider,type Encodable} from "@/lib/chain";
import {addressLink,configuredContract,txLink} from "@/lib/network";

type Pane="watch"|"baseline"|"observe"|"assess"|"promote";
type Data=Record<string,unknown>;
const panes:{id:Pane;number:string;label:string;hint:string}[]=[
  {id:"watch",number:"01",label:"Open watch",hint:"Bind ENS identity"},
  {id:"baseline",number:"02",label:"Capture origin",hint:"Lock canonical event"},
  {id:"observe",number:"03",label:"Observe drift",hint:"Advance event stream"},
  {id:"assess",number:"04",label:"Run consensus",hint:"Classify continuity"},
  {id:"promote",number:"05",label:"Promote contact",hint:"Consume exact receipt"},
];
const fixture={
  localId:"my-watch",ensName:"alice.eth",node:String(namehash("alice.eth")),recordKey:"text:description",guardian:"",
  baselineTx:"",baselineIndex:"",baselineDigest:"",
  candidateTx:"",candidateIndex:"",candidateDigest:"",
};
const text=(value:unknown)=>String(value??"");
const number=(value:unknown)=>Number(value??0);
const short=(value:string,size=7)=>value?`${value.slice(0,size)}…${value.slice(-5)}`:"—";
const statusClass=(status:string)=>status.toLowerCase().replaceAll("_","-");
const parseSnapshot=(raw:unknown)=>{try{return JSON.parse(text(raw)) as Data}catch{return null}};

export default function Home(){
  const[contract,setContract]=useState(configuredContract);
  const[account,setAccount]=useState("");
  const[networkOk,setNetworkOk]=useState(false);
  const[pane,setPane]=useState<Pane>("watch");
  const[form,setForm]=useState(fixture);
  const[watchId,setWatchId]=useState("");
  const[watch,setWatch]=useState<Data|null>(null);
  const[stats,setStats]=useState<Data|null>(null);
  const[version,setVersion]=useState("");
  const[phase,setPhase]=useState("Connect a wallet or inspect an existing watch.");
  const[busy,setBusy]=useState("");
  const[txHash,setTxHash]=useState("");
  const contextGeneration=useRef(0);
  const update=(key:keyof typeof fixture,value:string)=>setForm(current=>{
    const next={...current,[key]:value};
    if(key==="ensName"){try{next.node=namehash(value.trim().toLowerCase())}catch{next.node=""}}
    return next;
  });
  const status=text(watch?.status)||"UNWATCHED";
  const revision=number(watch?.revision);
  const owner=Boolean(account)&&text(watch?.owner).toLowerCase()===account.toLowerCase();
  const guardian=Boolean(account)&&text(watch?.guardian).toLowerCase()===account.toLowerCase();
  const participant=owner||guardian;
  const baseline=parseSnapshot(watch?.baseline);
  const candidate=parseSnapshot(watch?.candidate);

  const sync=useCallback(async(id=watchId)=>{
    const generation=contextGeneration.current;
    setBusy("sync");
    try{
      if(!validAddress(contract))throw new Error("Enter the deployed ResolverSentinel contract");
      const [schema,counts]=await Promise.all([readText(contract,"version"),readJson(contract,"get_stats")]);
      if(schema!=="resolver-sentinel/0.1.0")throw new Error("Contract is not ResolverSentinel 0.1.0");
      if(generation!==contextGeneration.current)return false;
      setVersion(schema);setStats(counts);
      if(id){const currentWatch=await readJson(contract,"get_watch",[id]);if(generation!==contextGeneration.current)return false;if(text(currentWatch.watch_id)!==id)throw new Error("Watch readback identity mismatch");setWatch(currentWatch)}
      else setWatch(null);
      setPhase("Latest-final contract state synchronized.");
      return true;
    }catch(error){setWatch(null);setPhase(error instanceof Error?error.message:String(error));return false}
    finally{setBusy("")}
  },[contract,watchId]);

  useEffect(()=>{
    current().then(setAccount).catch(()=>setAccount(""));isCorrectNetwork().then(setNetworkOk).catch(()=>setNetworkOk(false));
    return watchProvider(next=>{contextGeneration.current++;setAccount(next);setWatch(null);setPhase("Wallet changed — synchronize again.")},ok=>{contextGeneration.current++;setNetworkOk(ok);setWatch(null);setPhase(ok?"StudioNet detected — synchronize again.":"Wrong network.")});
  },[]);

  const gate=useMemo(()=>{
    if(!validAddress(contract))return[false,"Set the deployed contract address"] as const;
    if(!account)return[false,"Connect any funded StudioNet wallet"] as const;
    if(!networkOk)return[false,"Switch to GenLayer StudioNet · 61999"] as const;
    if(pane==="watch")return[validAddress(form.guardian)&&form.guardian.toLowerCase()!==account.toLowerCase(),"Creator becomes owner; bind a different guardian"] as const;
    if(!watchId||!watch)return[false,"Load an existing watch first"] as const;
    if(pane==="baseline")return[owner&&status==="DRAFT","Only the watch owner captures the first canonical event"] as const;
    if(pane==="observe")return[status!=="DRAFT","Any wallet may report a newer canonical event"] as const;
    if(pane==="assess")return[participant&&["CHANGE_PENDING","UNRESOLVED"].includes(status),"Only owner or guardian can assess an open revision"] as const;
    return[owner&&status==="REVIEWED_CONTINUITY"&&Boolean(watch.assessment_digest),"Owner consumes the exact current continuity receipt"] as const;
  },[contract,account,networkOk,pane,form.guardian,watchId,watch,owner,status,participant]);

  const submit=async()=>{
    if(!gate[0]){setPhase(gate[1]);return}
    let method="",args:Encodable[]=[];
    if(pane==="watch"){method="create_watch";args=[form.localId,form.ensName,form.node,form.recordKey,form.guardian]}
    if(pane==="baseline"){method="capture_baseline";args=[watchId,form.baselineTx,Number(form.baselineIndex),form.baselineDigest]}
    if(pane==="observe"){method="observe_change";args=[watchId,form.candidateTx,Number(form.candidateIndex),form.candidateDigest,revision]}
    if(pane==="assess"){method="assess_revision";args=[watchId,text(watch?.baseline_digest),text(watch?.candidate_digest),revision]}
    if(pane==="promote"){method="promote_contact";args=[watchId,text(watch?.assessment_digest),revision]}
    const generation=contextGeneration.current;
    try{
      setBusy(method);setTxHash("");setPhase(`${panes.find(item=>item.id===pane)?.label}: awaiting wallet signature`);
      if(await readText(contract,"version")!=="resolver-sentinel/0.1.0")throw new Error("Contract schema mismatch");
      if(generation!==contextGeneration.current)throw new Error("Wallet or contract changed; synchronize again");
      const hash=await transact(contract,account,method,args,(next,tx)=>{if(generation===contextGeneration.current){setPhase(`${method}: ${next.toLowerCase()}`);if(tx)setTxHash(tx)}});
      const id=pane==="watch"?`${account.toLowerCase()}:${form.localId}`:watchId;
      const fresh=await readJson(contract,"get_watch",[id]);
      if(generation!==contextGeneration.current)throw new Error("Transaction finalized; wallet context changed. Synchronize to inspect it.");
      verifyPostcondition({operation:pane,watchId:id,account,before:watch,fresh,args});
      setWatchId(id);setWatch(fresh);setTxHash(hash);
      const counts=await readJson(contract,"get_stats");if(generation!==contextGeneration.current)return;setStats(counts);
      setPhase(`${method}: FINALIZED and verified by exact readback`);
    }catch(error){setWatch(null);setPhase(error instanceof Error?error.message:String(error))}
    finally{setBusy("")}
  };

  const connectWallet=async()=>{try{setAccount(await connect());setNetworkOk(true);setPhase("Wallet connected. Synchronize or open a watch.")}catch(error){setPhase(error instanceof Error?error.message:String(error))}};
  const active=panes.find(item=>item.id===pane)!;
  const progress=status==="UNWATCHED"?0:status==="DRAFT"?18:status==="BASELINE_CAPTURED"?36:status==="CHANGE_PENDING"?58:["QUARANTINED","UNRESOLVED","REVIEWED_CONTINUITY"].includes(status)?78:100;

  return <main>
    <header className="topbar">
      <div className="brand"><div className="logo-shell"><Image src="/resolver-sentinel-logo.png" alt="ResolverSentinel" width={54} height={54} priority/></div><div><b>RESOLVER<span>SENTINEL</span></b><small>ENS IDENTITY DRIFT QUARANTINE</small></div></div>
      <div className="network"><i className={networkOk?"online":""}/><span>GENLAYER STUDIONET</span><b>61999</b></div>
      <div className="top-actions"><label className="contract-field"><span>CONTRACT</span><input disabled={!!busy} value={contract} onChange={event=>{contextGeneration.current++;setContract(event.target.value);setWatch(null);setStats(null);setVersion("")}} placeholder="Deployment address"/></label><button aria-label="Synchronize contract" className="sync-icon" onClick={()=>sync()} disabled={!!busy}><RefreshCw size={16}/></button><button className="wallet" disabled={!!busy} onClick={connectWallet}><Wallet size={16}/>{account?short(account):"CONNECT WALLET"}</button></div>
    </header>

    <section className="hero">
      <div className="hero-copy"><span className="eyebrow"><Radio size={13}/> EVENT-BOUND IDENTITY SECURITY</span><h1>Trust the record.<br/><em>Question the drift.</em></h1><p>ResolverSentinel turns canonical ENS resolver events into a revision stream. Deterministic source checks bind the event; GenLayer judges only the residual identity meaning.</p></div>
      <div className="hero-art"><Image src="/resolver-sentinel-logo.png" alt="ENS record drift shield" width={330} height={330} priority/><div className="orbit one"/><div className="orbit two"/><div className="signal"><Activity size={16}/> {version?"CONTRACT SYNCED":"AWAITING DEPLOYMENT"}</div></div>
      <div className="hero-metrics"><Metric label="WATCHES" value={stats?number(stats.watches):null}/><Metric label="REVIEWS" value={stats?number(stats.assessments):null}/><Metric label="PROMOTIONS" value={stats?number(stats.promotions):null}/></div>
    </section>

    <section className="workspace">
      <aside className="rail">
        <div className="section-label">WATCH PROCEDURE</div>
        <nav aria-label="Watch procedure">{panes.map(item=><button aria-label={item.label} disabled={!!busy} key={item.id} className={pane===item.id?"active":""} onClick={()=>setPane(item.id)}><span>{item.number}</span><div><b>{item.label}</b><small>{item.hint}</small></div><ChevronRight size={15}/></button>)}</nav>
        <div className="watch-loader"><label>WATCH ID<input disabled={!!busy} value={watchId} onChange={event=>{contextGeneration.current++;setWatchId(event.target.value);setWatch(null)}} placeholder="owner:local-id"/></label><button onClick={()=>sync()} disabled={!watchId||!!busy}><ScanSearch size={15}/> Load latest-final</button></div>
        <div className="scope-card"><Fingerprint size={20}/><span>BOUND NODE</span><code title={form.node}>{short(text(watch?.node)||form.node,10)}</code><small>{text(watch?.ens_name)||form.ensName}</small></div>
      </aside>

      <section className="console">
        <div className="console-head"><div><span>{active.number} / ACTIVE PROCEDURE</span><h2>{active.label}</h2></div><div className={`state-pill ${statusClass(status)}`}><i/>{status.replaceAll("_"," ")}</div></div>
        <div className="progress"><i style={{width:`${progress}%`}}/></div>
        <fieldset className="form-grid" disabled={!!busy} style={{margin:0,padding:0,border:0,minWidth:0}}>
          {pane==="watch"&&<>
            <Field label="LOCAL WATCH ID" value={form.localId} set={value=>update("localId",value)}/>
            <Field label="ENS NAME" value={form.ensName} set={value=>update("ensName",value)}/>
            <Field label="NAMEHASH / NODE" value={form.node} set={value=>update("node",value)} wide/>
            <label><span>RECORD PROFILE</span><select value={form.recordKey} onChange={event=>update("recordKey",event.target.value)}><option value="contenthash">contenthash</option><option value="text:url">text:url</option><option value="text:description">text:description</option><option value="text:com.twitter">text:com.twitter</option><option value="text:com.github">text:com.github</option><option value="text:email">text:email</option><option value="text:avatar">text:avatar</option><option value="addr:60">addr:60</option></select></label>
            <Field label="GUARDIAN WALLET" value={form.guardian} set={value=>update("guardian",value)} placeholder="different test/reviewer wallet"/>
          </>}
          {pane==="baseline"&&<>
            <SourceSummary icon={<Database/>} title="Capture the source record" text="The contract reads Ethereum RPC, decodes the event bytes, checks the finalized canonical block, and verifies the ENS Registry resolver and record at that block."/>
            <Field label="BASELINE TRANSACTION" value={form.baselineTx} set={value=>update("baselineTx",value)} wide/>
            <Field label="LOG INDEX" value={form.baselineIndex} set={value=>update("baselineIndex",value)}/>
            <Field label="EXPECTED SNAPSHOT SHA-256" value={form.baselineDigest} set={value=>update("baselineDigest",value)} wide/>
          </>}
          {pane==="observe"&&<>
            <SourceSummary icon={<Eye/>} title="Advance the event stream" text="Any wallet may report a later canonical event. A valid newer event invalidates every older trust receipt before semantic assessment begins."/>
            <Field label="CANDIDATE TRANSACTION" value={form.candidateTx} set={value=>update("candidateTx",value)} wide/>
            <Field label="LOG INDEX" value={form.candidateIndex} set={value=>update("candidateIndex",value)}/>
            <Field label="EXPECTED SNAPSHOT SHA-256" value={form.candidateDigest} set={value=>update("candidateDigest",value)} wide/>
          </>}
          {pane==="assess"&&<>
            <SourceSummary icon={<GitCompareArrows/>} title="Bounded identity judgment" text="Hard source predicates run first. Address and content-root changes fail deterministically; supported text-record changes use GenLayer consensus for continuity, drift, or unresolved evidence."/>
            <Digest label="BASELINE COMMITMENT" value={text(watch?.baseline_digest)}/><Digest label="CANDIDATE COMMITMENT" value={text(watch?.candidate_digest)}/>
          </>}
          {pane==="promote"&&<>
            <SourceSummary icon={<LockKeyhole/>} title="Consume one current receipt" text="Owner promotion checks the record again at a finalized Ethereum block. This is a dated verification; submitting a newer verified event removes the promoted receipt."/>
            <Digest label="ASSESSMENT RECEIPT" value={text(watch?.assessment_digest)}/><Digest label="EXPECTED REVISION" value={String(revision||"—")}/>
          </>}
        </fieldset>
        <div className="actionbar"><div><span>CALLER POLICY</span><b>{gate[1]}</b></div><button disabled={!gate[0]||!!busy} onClick={submit}>{busy?<Clock3 className="spin" size={17}/>:pane==="assess"?<ShieldAlert size={17}/>:pane==="promote"?<ShieldCheck size={17}/>:<ChevronRight size={17}/>} {busy?"WAITING FOR FINALITY":pane==="assess"?"RUN GENLAYER CONSENSUS":pane==="promote"?"PROMOTE EXACT CONTACT":"WRITE TO CONTRACT"}</button></div>
        <div role="status" aria-live="polite" className={`terminal ${phase.toLowerCase().includes("error")||phase.toLowerCase().includes("mismatch")?"error":""}`}><TerminalSquare size={18}/><div><b>{busy?busy.toUpperCase():"TRANSACTION STATE"}</b><span>{phase}</span></div>{txHash&&<a href={txLink(txHash)} target="_blank" rel="noreferrer">TX {short(txHash)} <ArrowUpRight size={13}/></a>}</div>
      </section>

      <aside className="evidence-panel">
        <div className="section-label">AUTHORITATIVE RECORD</div>
        <div className="identity"><div className="identity-icon"><UserRoundCheck/></div><div><span>ENS IDENTITY</span><b>{text(watch?.ens_name)||form.ensName}</b><small>REVISION {revision||"—"}</small></div></div>
        <Timeline label="TRUSTED BASELINE" snapshot={baseline} active={Boolean(baseline)}/>
        <Timeline label="OBSERVED CANDIDATE" snapshot={candidate} active={Boolean(candidate)} danger={status==="QUARANTINED"}/>
        <div className={`verdict ${statusClass(status)}`}><span>CONSENSUS VERDICT</span><b>{text(watch?.verdict)||"NOT ASSESSED"}</b><p>{text(watch?.summary)||"The gate remains closed until exact source evidence and current-revision consensus agree."}</p>{Boolean(watch?.reason_codes)&&<code>{text(watch?.reason_codes)}</code>}</div>
        {number(watch?.verified_block)>0&&<p>Verified at Ethereum finalized block {number(watch?.verified_block).toLocaleString()}. Changes since that block require another observation.</p>}
        <div className="truth-grid"><Truth icon={<FileKey2/>} label="SOURCE" value="ETHEREUM RPC"/><Truth icon={<Fingerprint/>} label="NODE" value={short(text(watch?.node)||form.node,6)}/><Truth icon={<Activity/>} label="SCHEMA" value={version||"UNSYNCED"}/></div>
        {validAddress(contract)&&<a className="explorer-link" href={addressLink(contract)} target="_blank"><Link2 size={15}/> INSPECT CONTRACT <ArrowUpRight size={13}/></a>}
      </aside>
    </section>
    <footer><span>CANONICAL EVENT · BOUNDED JUDGMENT · REVISION-SAFE CONSEQUENCE</span><span>DEPLOYER HAS NO PROTOCOL ROLE · REVIEWERS USE THE SAME PUBLIC PATH</span></footer>
  </main>;
}

function Field({label,value,set,placeholder="",wide=false}:{label:string;value:string;set:(value:string)=>void;placeholder?:string;wide?:boolean}){return <label className={wide?"wide":""}><span>{label}</span><input value={value} onChange={event=>set(event.target.value)} placeholder={placeholder}/></label>}
function SourceSummary({icon,title,text:copy}:{icon:React.ReactNode;title:string;text:string}){return <div className="source-summary wide"><div>{icon}</div><section><span>REVIEW CONTROL</span><h3>{title}</h3><p>{copy}</p></section></div>}
function Digest({label,value}:{label:string;value:string}){return <div className="digest"><span>{label}</span><code title={value}>{value?short(value,12):"not available"}</code></div>}
function Metric({label,value}:{label:string;value:number|null}){return <div><span>{label}</span><b>{value===null?"—":String(value).padStart(2,"0")}</b></div>}
function Timeline({label,snapshot,active,danger=false}:{label:string;snapshot:Data|null;active:boolean;danger?:boolean}){return <div className={`timeline ${active?"active":""} ${danger?"danger":""}`}><i/><div><span>{label}</span><b>{snapshot?short(text(snapshot.record_value),10):"NO EVENT BOUND"}</b><small>{snapshot?`BLOCK ${number(snapshot.block_number).toLocaleString()} · LOG ${number(snapshot.log_index)}`:"Awaiting canonical receipt"}</small></div>{active&&<Check size={15}/>}</div>}
function Truth({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div>{icon}<span>{label}</span><b>{value}</b></div>}

