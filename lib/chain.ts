"use client";
import {createClient} from "genlayer-js";
import {studionet as chain} from "genlayer-js/chains";

declare global {interface Window {ethereum?:{request:(input:{method:string;params?:unknown[]})=>Promise<unknown>;on?:(event:string,listener:(...args:unknown[])=>void)=>void;removeListener?:(event:string,listener:(...args:unknown[])=>void)=>void}}}

export type Encodable=string|number|bigint|boolean;
type Receipt={execution_result?:string;mode?:string;genvm_result?:{error_code?:string|null}};
type Tx={statusName?:string;txExecutionResultName?:string;consensus_data?:{leader_receipt?:Receipt[];validators?:Receipt[];votes?:Record<string,string>|Receipt[]}};
type Runtime={
  readContract:(i:{address:`0x${string}`;functionName:string;args:Encodable[];transactionHashVariant?:"latest-final"})=>Promise<Encodable>;
  writeContract:(i:{address:`0x${string}`;functionName:string;args:Encodable[];value:bigint})=>Promise<string|{txId:string}>;
  waitForTransactionReceipt:(i:{hash:`0x${string}`;status:"FINALIZED";interval:number;retries:number})=>Promise<Tx>;
  getTransaction:(i:{hash:`0x${string}`})=>Promise<Tx>;
};

export const validAddress=(value:string)=>/^0x[0-9a-fA-F]{40}$/.test(value);
const chainId=`0x${chain.id.toString(16)}`;
const errorCode=(error:unknown)=>typeof error==="object"&&error!==null&&"code" in error?Number((error as {code:unknown}).code):0;

export async function ensureNetwork(){
  if(!window.ethereum)throw new Error("A browser wallet is required");
  const current=String(await window.ethereum.request({method:"eth_chainId"})).toLowerCase();
  if(current===chainId.toLowerCase())return;
  try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId}]});}
  catch(error){
    if(errorCode(error)!==4902)throw new Error(`Switch the wallet to GenLayer StudioNet (${chain.id})`);
    await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId,chainName:chain.name,nativeCurrency:chain.nativeCurrency,rpcUrls:[chain.rpcUrls.default.http[0]],blockExplorerUrls:[chain.blockExplorers?.default.url]}]});
  }
  const after=String(await window.ethereum.request({method:"eth_chainId"})).toLowerCase();
  if(after!==chainId.toLowerCase())throw new Error("Wallet remained on the wrong network");
}

export async function connect(){
  if(!window.ethereum)throw new Error("Install a compatible browser wallet");
  const accounts=await window.ethereum.request({method:"eth_requestAccounts"}) as string[];
  await ensureNetwork();
  return accounts[0]||"";
}

export async function current(){
  if(!window.ethereum)return "";
  const accounts=await window.ethereum.request({method:"eth_accounts"}) as string[];
  return accounts[0]||"";
}

export async function isCorrectNetwork(){
  if(!window.ethereum)return false;
  return String(await window.ethereum.request({method:"eth_chainId"})).toLowerCase()===chainId.toLowerCase();
}

export function watchProvider(onAccount:(account:string)=>void,onNetwork:(ok:boolean)=>void){
  if(!window.ethereum?.on)return()=>{};
  const accountListener=(...args:unknown[])=>onAccount(((args[0]||[]) as string[])[0]||"");
  const chainListener=(...args:unknown[])=>onNetwork(String(args[0]||"").toLowerCase()===chainId.toLowerCase());
  window.ethereum.on("accountsChanged",accountListener);
  window.ethereum.on("chainChanged",chainListener);
  return()=>{window.ethereum?.removeListener?.("accountsChanged",accountListener);window.ethereum?.removeListener?.("chainChanged",chainListener)};
}

async function read(contract:string,method:string,args:Encodable[]=[]){
  if(!validAddress(contract))throw new Error("Enter a deployed ResolverSentinel contract");
  const client=createClient({chain}) as unknown as Runtime;
  let last:unknown;
  for(let attempt=0;attempt<3;attempt++){
    try{return await client.readContract({address:contract as `0x${string}`,functionName:method,args,transactionHashVariant:"latest-final"});}
    catch(error){last=error;if(attempt===2||!/failed to fetch|fetch failed|network error/i.test(error instanceof Error?error.message:String(error)))throw error;await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}
  }
  throw last;
}

export async function readJson(contract:string,method:string,args:Encodable[]=[]){return JSON.parse(String(await read(contract,method,args))) as Record<string,unknown>}
export async function readText(contract:string,method:string,args:Encodable[]=[]){return String(await read(contract,method,args))}

export async function transact(contract:string,account:string,method:string,args:Encodable[],onStatus:(status:string,hash?:string)=>void){
  if(!window.ethereum||!validAddress(contract)||!validAddress(account))throw new Error("Connect a wallet and set a valid contract address");
  await ensureNetwork();
  const active=await window.ethereum.request({method:"eth_accounts"}) as string[];
  if(active[0]?.toLowerCase()!==account.toLowerCase())throw new Error("Wallet account changed; reconnect and synchronize");
  const client=createClient({chain,provider:window.ethereum,account:account as `0x${string}`}) as unknown as Runtime;
  onStatus("SIGNATURE");
  const raw=await client.writeContract({address:contract as `0x${string}`,functionName:method,args,value:0n});
  const hash=typeof raw==="string"?raw:raw.txId;
  if(!/^0x[0-9a-fA-F]{64}$/.test(hash))throw new Error("Wallet returned an invalid transaction ID");
  onStatus("CONSENSUS",hash);
  await client.waitForTransactionReceipt({hash:hash as `0x${string}`,status:"FINALIZED",interval:2500,retries:360});
  const tx=await client.getTransaction({hash:hash as `0x${string}`});
  const receipts=[...(tx.consensus_data?.leader_receipt||[]),...(tx.consensus_data?.validators||[])];
  const leader=receipts.find(receipt=>receipt.mode==="leader")||receipts[0];
  if(String(tx.statusName||"").toUpperCase()!=="FINALIZED"||String(tx.txExecutionResultName||"").toUpperCase().includes("ERROR")||!leader||leader.execution_result!=="SUCCESS"||Boolean(leader.genvm_result?.error_code))throw new Error("Transaction finalized with an execution error");
  onStatus("READBACK",hash);
  return hash;
}

