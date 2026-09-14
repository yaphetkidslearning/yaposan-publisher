import { getDatabase } from "../../server/database";

const prefix=String(process.argv[2]??"writer");
const count=Number(process.argv[3]??20);
const db=await getDatabase();
try{
  for(let i=0;i<count;i++)await db.insert("auditEvents",{action:`phase11747.concurrent.${prefix}.${i}`,target:prefix,metadata:{writer:prefix,index:i}});
}finally{await db.close()}
