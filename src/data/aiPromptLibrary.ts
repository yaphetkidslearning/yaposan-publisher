import type { AiPresetPrompt } from "../types/aiWriting";
export const AI_PROMPT_LIBRARY: AiPresetPrompt[] = [
  {id:"business-announcement",label:"Business announcement",category:"Business",action:"write",prompt:"Write a concise professional business announcement with a clear next step."},
  {id:"business-summary",label:"Executive summary",category:"Business",action:"summarize",prompt:"Create an executive summary highlighting the decision, impact, and next action."},
  {id:"marketing-flyer",label:"Promotional flyer",category:"Marketing",action:"marketing",prompt:"Create persuasive flyer copy with a strong headline, three benefits, and a call to action."},
  {id:"marketing-product",label:"Product promotion",category:"Marketing",action:"marketing",prompt:"Write product marketing copy focused on customer benefits, trust, and urgency."},
  {id:"social-instagram",label:"Instagram post",category:"Social Media",action:"social",prompt:"Write an engaging Instagram caption with a hook, useful detail, CTA, and relevant hashtags."},
  {id:"social-linkedin",label:"LinkedIn update",category:"Social Media",action:"social",prompt:"Write a professional LinkedIn post with a strong opening, insight, and discussion question."},
  {id:"education-event",label:"School event",category:"Education",action:"write",prompt:"Write a welcoming school event announcement for families with date, location, and preparation details."},
  {id:"education-explain",label:"Explain simply",category:"Education",action:"rewrite",prompt:"Explain the selected text in clear language suitable for a general audience."},
  {id:"church-bulletin",label:"Church bulletin",category:"Church",action:"write",prompt:"Write a warm church bulletin announcement including purpose, schedule, and invitation."},
  {id:"church-social",label:"Church social post",category:"Church",action:"social",prompt:"Create a respectful and welcoming church social media post with a clear invitation."},
  {id:"creative-headline",label:"Creative headlines",category:"Creative",action:"headline",prompt:"Generate a memorable, original headline that is short and visually strong."},
  {id:"creative-caption",label:"Story caption",category:"Creative",action:"caption",prompt:"Write an imaginative caption that adds emotion and context without repeating the headline."},
];
