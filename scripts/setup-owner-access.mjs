import fs from 'node:fs';
import crypto from 'node:crypto';

const requestedEmail=(process.argv[2]||process.env.ADMIN_BOOTSTRAP_EMAIL||'').trim().toLowerCase();
if(!requestedEmail){console.error('Platform Owner email is required. Use a real mailbox so Admin password recovery works.\nExample: npm run owner:setup -- admin@yaposan.com');process.exit(1);}
const email=requestedEmail;
if(!/^\S+@\S+\.\S+$/.test(email)){console.error('Platform Owner email must be a valid email address.');process.exit(1);}
if(/\.(local|localhost)$/i.test(email)||email.endsWith('@localhost'))console.warn('WARNING: This local-only email cannot receive Resend recovery mail. Use a deliverable production mailbox before deployment.');
let text=fs.existsSync('.env')?fs.readFileSync('.env','utf8'):'';
const current={};
for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#')||!line.includes('='))continue;const i=line.indexOf('=');current[line.slice(0,i).trim()]=line.slice(i+1).trim().replace(/^[\'\"]|[\'\"]$/g,'');}
const sameBootstrap=current.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase()===email && (current.ADMIN_BOOTSTRAP_PASSWORD?.length??0)>=14;
const password=sameBootstrap?current.ADMIN_BOOTSTRAP_PASSWORD:crypto.randomBytes(18).toString('base64url');
const secret=(current.ADMIN_SESSION_SECRET?.length??0)>=32?current.ADMIN_SESSION_SECRET:crypto.randomBytes(32).toString('base64url');
function set(k,v){const re=new RegExp(`^${k}=.*$`,'m');text=re.test(text)?text.replace(re,`${k}=${v}`):`${text}${text&&!text.endsWith('\n')?'\n':''}${k}=${v}\n`;}
set('EXPO_PUBLIC_API_URL','http://localhost:4100');set('PUBLIC_API_URL','http://localhost:4100');set('PORT','4100');set('ADMIN_BOOTSTRAP_EMAIL',email);set('ADMIN_BOOTSTRAP_PASSWORD',password);set('ADMIN_SESSION_SECRET',secret);fs.writeFileSync('.env',text);
console.log('\nYaposan Platform Owner local access configured.');
console.log('Admin URL: http://localhost:8081/yaposan-admin');
console.log(`Email: ${email}`);
console.log(`${sameBootstrap?'Existing':'Temporary bootstrap'} password: ${password}`);
if(current.ADMIN_BOOTSTRAP_EMAIL && current.ADMIN_BOOTSTRAP_EMAIL.toLowerCase()!==email)console.log('NOTICE: Changing the bootstrap email does not replace an admin principal immediately. If exactly one persisted super-admin exists, the next successful bootstrap sign-in can safely migrate that principal to this configured owner email. Multiple existing admins require recovery from an authenticated super-admin.');
console.log('Restart the Yaposan API after running this command so the updated .env is loaded.');
console.log('Keep this password private. After the first persistent admin principal exists, remove ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD from production and keep ADMIN_SESSION_SECRET stable.\n');
