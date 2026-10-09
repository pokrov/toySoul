import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {hashPassword} from 'better-auth/crypto';
import {db} from '../src/lib/db';
import {localGenerate,type Design} from '../src/lib/design';
import {saveToy,finalize,pay,joinPool,runMatching,transition} from '../src/lib/services';
import type {User} from '../src/generated/prisma/client';
async function main(){
 const password=process.env.DEMO_PASSWORD;
 if(!password||password.length<10)throw new Error('Set DEMO_PASSWORD to at least 10 characters in .env.');
 const hashed=await hashPassword(password);
 await db.operationLock.upsert({where:{id:'exchange'},create:{id:'exchange'},update:{}});
 const accounts=[{name:'Soul Keeper',email:process.env.DEMO_ADMIN_EMAIL??'admin@soultoy.local',role:'ADMIN' as const},...['Alice','Yassine','Sara','Noor','Milo','Aya'].map(name=>({name,email:name.toLowerCase()+'@soultoy.local',role:'USER' as const}))];
 const users:User[]=[];
 for(const item of accounts){let user=await db.user.findUnique({where:{email:item.email}});if(!user){user=await db.user.create({data:{id:randomUUID(),...item,emailVerified:true}});await db.account.create({data:{id:randomUUID(),userId:user.id,accountId:user.id,providerId:'credential',password:hashed}});}users.push(user);}
 // Re-running seed never resets user work or an existing demonstration.
 if(await db.toy.count({where:{creatorId:{in:users.map(u=>u.id)}}})>0){console.log('Demo already seeded; existing work preserved.');return;}
 const admin=users[0],participants=users.slice(1);
 const prompts=['purple forest creature who collects stars','coral monster with glasses','mint sleepy bunny','yellow bunny with a scarf','blue robot carrying a flower','dreamy astronaut with a helmet'];
 const names=['Moonwhisp','Momo','Mossling','Sunday','Pip-01','Little Orbit','Lumi','Bramble','Rainy','Sol','Petal','Nova'];
 async function make(user:User,index:number,ready=true,paid=true){const config:Design={...localGenerate({prompt:prompts[index%6],mood:index%2?'Playful':'Dreamy'})[index%3],name:names[index]};const t=await saveToy(user,{config,secret:'I hope this little soul makes your day brighter. A tiny reminder that you are not alone.'});if(ready)await finalize(user,t.id);if(ready&&paid)await pay(user,t.id,'PAID');return t;}
 // Completed round for Alice, Yassine, Sara.
 for(let i=0;i<3;i++){const t=await make(participants[i],i);await joinPool(participants[i],t.id);}
 const complete=await runMatching(admin,'seed-completed-round');
 for(const m of complete.matches){for(const s of ['PRODUCTION','SHIPPED','DELIVERED'] as const)await transition(admin,m.id,s);await transition(participants.find(u=>u.id===m.recipientId)!,m.id,'RECEIVED');}
 // Active round for Noor, Milo, Aya.
 for(let i=3;i<6;i++){const t=await make(participants[i],i);await joinPool(participants[i],t.id);}
 const active=await runMatching(admin,'seed-active-round');
 for(const m of active.matches)await transition(admin,m.id,'PRODUCTION');
 // Three waiting entries plus one unpaid ready design and two drafts: 12 toys total.
 for(let i=6;i<9;i++){const t=await make(participants[i-6],i);await joinPool(participants[i-6],t.id);}
 await make(participants[3],9,true,false);
 await make(participants[4],10,false,false);
 await make(participants[5],11,false,false);
 console.log('Seeded 1 admin, 6 creators, 12 souls, completed + active rounds, 3 waiting entries, drafts, notifications and collections.');
 console.log('Demo emails: admin@soultoy.local; alice, yassine, sara, noor, milo, aya @soultoy.local. Password comes from DEMO_PASSWORD.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
