export const VERSION=1;
export function cleanText(value,max=120,min=1){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw Error('Check the text fields.');return value.trim();}
export function requestRide(input){const fare=Number(input.fare);if(!Number.isInteger(fare)||fare<1||fare>100000)throw Error('Use a whole fare from NPR 1 to 100000.');return {id:crypto.randomUUID(),revision:0,status:'requested',pickup:cleanText(input.pickup),destination:cleanText(input.destination),fare,updated:Date.now()};}
export function transition(ride,action,actor,revision){
 if(!ride||ride.revision!==revision)throw Error('Journey changed. Refresh your view and try again.');
 const allowed={accept:['driver','requested','accepted'],arrive:['driver','accepted','arrived'],start:['rider','arrived','in_progress'],complete:['driver','in_progress','completed']};
 let next;
 if(action==='cancel'&&['requested','accepted','arrived'].includes(ride.status)&&['rider','driver'].includes(actor))next='cancelled';
 else if(allowed[action]?.[0]===actor&&allowed[action][1]===ride.status)next=allowed[action][2];
 else throw Error('This action is not available now.');
 return {...ride,status:next,revision:ride.revision+1,updated:Date.now()};
}
export function validateRide(r){if(!r||typeof r!=='object'||typeof r.id!=='string'||!Number.isInteger(r.revision)||r.revision<0||!['requested','accepted','arrived','in_progress','completed','cancelled'].includes(r.status)||!Number.isInteger(r.fare)||r.fare<1||r.fare>100000||!Number.isFinite(r.updated))throw Error('Invalid journey message.');cleanText(r.pickup);cleanText(r.destination);return r;}
export function encodeSignal(description,role){return btoa(JSON.stringify({v:VERSION,role,expires:Date.now()+600000,type:description.type,sdp:description.sdp}));}
export function decodeSignal(value,expected){if(typeof value!=='string'||value.length>64000)throw Error('Connection code is too long.');let d;try{d=JSON.parse(atob(value.trim()))}catch{throw Error('Paste the complete connection code.')}if(d.v!==VERSION||d.type!==expected||!['rider','driver'].includes(d.role)||typeof d.sdp!=='string'||d.sdp.length>45000||!Number.isFinite(d.expires)||d.expires<Date.now()||d.expires>Date.now()+660000)throw Error('This code is invalid, expired or not the expected type. Make a new connection.');return d;}
