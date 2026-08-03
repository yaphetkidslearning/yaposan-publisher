export type Phase41Status="not-started"|"implemented"|"verified"|"blocked";
export type Evidence={id:string;controlId:string;kind:"test-report"|"deployment"|"security-report"|"artifact-hash"|"health-check"|"approval";value:string;verified:boolean;verifiedAt?:string;verifiedBy?:string};
export type Phase41Control={id:string;area:string;title:string;status:Phase41Status;automated:boolean;requiredEvidence:Evidence["kind"][]};
export const PHASE41_CONTROLS:Phase41Control[]=[
 {id:"41.0",area:"Backend",title:"Production API server and structured errors",status:"implemented",automated:true,requiredEvidence:["test-report","health-check"]},
 {id:"41.1",area:"Data",title:"Database schema, migrations and transactional adapter",status:"implemented",automated:true,requiredEvidence:["test-report"]},
 {id:"41.2",area:"Identity",title:"Registration, login, sessions and authorization foundation",status:"implemented",automated:true,requiredEvidence:["test-report","security-report"]},
 {id:"41.3",area:"Cloud",title:"Cloud projects, offline operations and conflict strategy",status:"implemented",automated:true,requiredEvidence:["test-report","deployment"]},
 {id:"41.4",area:"Collaboration",title:"Realtime gateway contract, presence and reconnect readiness",status:"not-started",automated:true,requiredEvidence:["test-report","deployment"]},
 {id:"41.5",area:"Billing",title:"Stripe checkout, portal and verified webhooks",status:"implemented",automated:true,requiredEvidence:["test-report","security-report"]},
 {id:"41.6",area:"AI",title:"Secure AI proxy with provider secrets",status:"implemented",automated:true,requiredEvidence:["test-report","deployment"]},
 {id:"41.7",area:"Jobs",title:"Background job queue contract and progress model",status:"implemented",automated:true,requiredEvidence:["test-report"]},
 {id:"41.8",area:"Security",title:"Rate limits, password hashing, CSP and request correlation",status:"implemented",automated:true,requiredEvidence:["security-report"]},
 {id:"41.9",area:"Operations",title:"Health, readiness, logging and monitoring hooks",status:"implemented",automated:true,requiredEvidence:["health-check","deployment"]},
 {id:"41.10",area:"Recovery",title:"Backup, point-in-time recovery and disaster-recovery evidence",status:"not-started",automated:true,requiredEvidence:["test-report","approval"]},
 {id:"41.11",area:"API",title:"Versioned REST API, webhooks and integration services",status:"implemented",automated:true,requiredEvidence:["test-report"]},
 {id:"41.12",area:"Certification",title:"Evidence-backed Phase 41 production certification",status:"not-started",automated:true,requiredEvidence:["test-report","security-report","artifact-hash","health-check","approval"]}
];
export function controlEvidenceComplete(control:Phase41Control,evidence:Evidence[]){return control.requiredEvidence.every(kind=>evidence.some(x=>x.controlId===control.id&&x.kind===kind&&x.verified&&x.value.trim().length>0))}
export function phase41Score(controls:Phase41Control[],evidence:Evidence[]){if(!controls.length)return 0;return Math.round(controls.reduce((sum,c)=>sum+(c.status==="implemented"?60:c.status==="verified"&&controlEvidenceComplete(c,evidence)?100:0),0)/controls.length)}
export function phase41Blockers(controls:Phase41Control[],evidence:Evidence[]){return controls.flatMap(c=>{const issues:string[]=[];if(c.status!=="verified")issues.push(`${c.id}: ${c.title} is not verified`);for(const kind of c.requiredEvidence)if(!evidence.some(x=>x.controlId===c.id&&x.kind===kind&&x.verified))issues.push(`${c.id}: missing verified ${kind}`);return issues})}
export function certifyPhase41(controls:Phase41Control[],evidence:Evidence[]){const blockers=phase41Blockers(controls,evidence);return{certified:blockers.length===0,score:phase41Score(controls,evidence),blockers,certifiedAt:blockers.length?undefined:new Date().toISOString()}}
