import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED = new Set(["name","npsn","status","level","accreditation","principal","students","staff","address","city","phone","email","maps_url"]);
const aliases: Record<string,string[]> = {
  name:["name","nama_sekolah","sekolah"], npsn:["npsn"], status:["status","status_sekolah"], level:["level","jenjang"],
  accreditation:["accreditation","akreditasi"], principal:["principal","kepala_sekolah","kepsek"], students:["students","jumlah_siswa","peserta_didik","pd"],
  staff:["staff","guru_tendik","ptk","jumlah_guru"], address:["address","alamat"], city:["city","kota"], phone:["phone","telepon"], email:["email"], maps_url:["maps_url"]
};

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
function jsonResponse(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}})}
function cleanText(html:string){return html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim()}
function normalize(field:string,v:any){if(v===null||v===undefined)return null;if(["students","staff"].includes(field)){const n=Number(String(v).replace(/[^0-9]/g,""));return Number.isFinite(n)?n:null}return String(v).trim().replace(/\s+/g," ")}
function same(a:any,b:any){return JSON.stringify(a)===JSON.stringify(b)}
function deepFind(obj:any, keys:string[]):any{if(!obj||typeof obj!=="object")return undefined;for(const k of keys){if(Object.prototype.hasOwnProperty.call(obj,k))return obj[k]}for(const v of Object.values(obj)){if(v&&typeof v==="object"){const found=deepFind(v,keys);if(found!==undefined)return found}}}
function getPath(obj:any,path:string){return path.split(".").reduce((a,k)=>a?.[k],obj)}
function parseJson(data:any,fields:string[],config:any){const out:Record<string,{value:any,confidence:number}>={};for(const f of fields){const path=config?.paths?.[f];const raw=path?getPath(data,path):deepFind(data,aliases[f]||[f]);const value=normalize(f,raw);if(value!==null&&value!=="")out[f]={value,confidence:path?95:82}}return out}
function parseHtml(html:string,fields:string[],config:any){const text=cleanText(html),out:Record<string,{value:any,confidence:number}>={};const defaults:Record<string,RegExp[]>={
 npsn:[/NPSN\s*[:\-]?\s*(\d{8})/i], students:[/(?:Peserta Didik|Jumlah Siswa|Siswa)\s*[:\-]?\s*([\d.,]+)/i], staff:[/(?:Guru\s*&?\s*Tendik|PTK|Jumlah Guru)\s*[:\-]?\s*([\d.,]+)/i],
 principal:[/(?:Kepala Sekolah|Kepala SDN?)[\s:,-]+([A-Za-zÀ-ÿ.'’\- ]{3,80})/i], accreditation:[/(?:Akreditasi)\s*[:\-]?\s*([A-C]|Unggul|Baik Sekali|Baik)/i],
 status:[/(?:Status Sekolah|Status)\s*[:\-]?\s*(Negeri|Swasta)/i], level:[/(?:Jenjang)\s*[:\-]?\s*(SD|Sekolah Dasar)/i],
 address:[/(?:Alamat)\s*[:\-]?\s*(.{10,180}?)(?=\s(?:Kecamatan|Kelurahan|NPSN|Status|Jenjang|Akreditasi)\b|$)/i], city:[/(Kota Tangerang)/i], name:[/(SD(?:N| Negeri)\s+Larangan\s+11)/i]
};
 for(const f of fields){let raw:any;const custom=config?.regex?.[f];if(custom){try{raw=text.match(new RegExp(custom,"i"))?.[1]}catch{}}if(raw===undefined){for(const re of defaults[f]||[]){const m=text.match(re);if(m){raw=m[1];break}}}const value=normalize(f,raw);if(value!==null&&value!=="")out[f]={value,confidence:custom?90:68}}return out}
}

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const auth=req.headers.get("Authorization");if(!auth)return jsonResponse({error:"Authorization required"},401);
  const url=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});const {data:{user}}=await userClient.auth.getUser();if(!user)return jsonResponse({error:"Unauthorized"},401);
  const db=createClient(url,service);
  const [{data:profile,error:pe},{data:sources,error:se}]=await Promise.all([db.from("school_profile").select("*").eq("id",1).single(),db.from("sync_sources").select("*").eq("enabled",true).order("priority")]);
  if(pe)throw pe;if(se)throw se;
  let checked=0,candidates=0,failed=0;
  for(const source of sources||[]){
   checked++;try{
    const r=await fetch(source.source_url,{headers:{"User-Agent":"SDN-Larangan-11-SmartSync/1.0"},redirect:"follow"});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const type=source.source_type==="json"||r.headers.get("content-type")?.includes("json")?"json":"html";const body=type==="json"?await r.json():await r.text();
    const fields=(Array.isArray(source.allowed_fields)?source.allowed_fields:[]).filter((x:string)=>ALLOWED.has(x));const parsed=type==="json"?parseJson(body,fields,source.parser_config):parseHtml(body,fields,source.parser_config);
    for(const [field,found] of Object.entries(parsed)){
      const current=normalize(field,profile[field]);if(same(current,found.value))continue;
      const {data:pending}=await db.from("sync_staging").select("id,candidate_value").eq("status","pending").eq("source_url",source.source_url).eq("field_name",field).limit(10);
      if((pending||[]).some((x:any)=>same(x.candidate_value,found.value)))continue;
      const payload={source_type:type,extracted_field:field};const {error}=await db.from("sync_staging").insert({source_name:source.name,source_url:source.source_url,field_name:field,current_value:current,candidate_value:found.value,confidence:found.confidence,status:"pending",fetched_at:new Date().toISOString(),payload});if(error)throw error;candidates++;
    }
    await db.from("sync_runs").insert({source_url:source.source_url,status:"success",note:`${Object.keys(parsed).length} field terbaca`});
   }catch(e){failed++;await db.from("sync_runs").insert({source_url:source.source_url,status:"failed",note:String(e?.message||e)});}
  }
  return jsonResponse({ok:true,checked,candidates,failed});
 }catch(e){return jsonResponse({error:String(e?.message||e)},500)}
});
