export type EmailMessage={to:string|string[];subject:string;html:string;text?:string};
export async function sendEmail(message:EmailMessage,env=process.env){
 const apiKey=env.RESEND_API_KEY;const from=env.EMAIL_FROM;
 if(!apiKey||!from)throw new Error('EMAIL_NOT_CONFIGURED');
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify({from,to:Array.isArray(message.to)?message.to:[message.to],subject:message.subject,html:message.html,text:message.text})});
 const data=await response.json() as any;if(!response.ok)throw new Error(data?.message??`RESEND_${response.status}`);return data;
}
