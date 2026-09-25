export type TrustedSource={id:string;name:string;organization:string;description:string;category:string;url:string;reference:string;lastChecked?:string};
const sources:TrustedSource[]=[
  {id:'national-consumer-helpline',name:'National Consumer Helpline',organization:'Department of Consumer Affairs, Government of India',description:'Official information and grievance support for consumer issues.',category:'Consumer support',url:'https://consumerhelpline.gov.in/',reference:'Official consumer grievance and information portal.'},
  {id:'consumer-protection-act-2019',name:'Consumer Protection Act, 2019',organization:'India Code, Government of India',description:'Official Act text and legislative details.',category:'Legislation',url:'https://www.indiacode.nic.in/indiacode/handle/123456789/21423?view_type=browse',reference:'India Code record for the Consumer Protection Act, 2019.'},
  {id:'department-consumer-affairs',name:'Department of Consumer Affairs',organization:'Government of India',description:'Official consumer protection information and updates.',category:'Government information',url:'https://consumeraffairs.nic.in/consumer-protection',reference:'Department consumer protection information.'},
];
export function getTrustedResources(){return sources}
export function retrieveTrustedSources(topic:string){
  const normalized=topic.toLocaleLowerCase();
  return /consumer|seller|purchase|deliver|refund|product|goods|e-commerce|online order|unfair trade|consumer protection|उपभोक्ता|विक्रेता|खरीद|उपभोक्ता संरक्षण/.test(normalized) ? sources : [];
}
