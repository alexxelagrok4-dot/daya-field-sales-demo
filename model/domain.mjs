const randomUUID=()=>globalThis.crypto.randomUUID();
export const uid=()=>randomUUID();
export const fail=(message,status=422)=>{throw Object.assign(new Error(message),{status});};
export const day=ms=>ms/86400000;
export function moscowDate(value){return new Date(value).toLocaleDateString('en-CA',{timeZone:'Europe/Moscow'});}
export function businessDays(from,to,holidays=[]){let count=0;let d=new Date(moscowDate(from)+'T12:00:00Z');const end=new Date(moscowDate(to)+'T12:00:00Z');while(d<end){d.setUTCDate(d.getUTCDate()+1);if(d.getUTCDay()!==0&&d.getUTCDay()!==6&&!holidays.includes(d.toISOString().slice(0,10)))count++;}return count;}
export function distance(a,b){const r=Math.PI/180;const dlat=(a.lat-b.lat)*r,dlng=(a.lng-b.lng)*r;const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function inside(lng,lat,poly){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [x,y]=poly[i],[xx,yy]=poly[j];const cross=(lat-y)*(xx-x)-(lng-x)*(yy-y);if(Math.abs(cross)<1e-10&&lng>=Math.min(x,xx)&&lng<=Math.max(x,xx)&&lat>=Math.min(y,yy)&&lat<=Math.max(y,yy))return true;if((y>lat)!==(yy>lat)&&lng<(xx-x)*(lat-y)/(yy-y)+x)result=!result;}return result;}
export const parts=(s,id)=>s.participations.filter(p=>p.objectId===id);
export const opps=(s,id)=>s.opportunities.filter(o=>parts(s,id).some(p=>p.id===o.participationId));
export const acts=(s,id)=>s.actions.filter(a=>a.objectId===id);
export const isOurs=o=>o.status==='ours'&&!!o.contractRef&&!!o.shipmentRef;
export function evidence(s,o){const p=parts(s,o.id),v=opps(s,o.id),a=acts(s,o.id);return [
 Number.isFinite(o.lat)&&Number.isFinite(o.lng)&&!!o.address&&!!o.source,
 !!o.type&&!!o.scale&&!!o.constructionStage&&s.settings.products.every(x=>!!o.potential?.[x.id]),
 p.some(x=>['customer','general'].includes(x.role))&&p.some(x=>['contractor','subcontractor'].includes(x.role))&&p.some(x=>x.decisionMaker),
 a.some(x=>['meeting','call','visit'].includes(x.type)&&x.contactId&&p.some(y=>y.id===x.participationId&&y.decisionMaker)&&s.contacts.some(c=>c.id===x.contactId&&p.some(y=>y.id===x.participationId&&y.clientId===c.clientId))),
 v.some(x=>['need','quoted','feedback','ours','competitor','later'].includes(x.status)&&x.volume&&x.needDate),
 a.some(x=>x.type==='quote'&&v.some(y=>y.id===x.opportunityId)),
 a.some(x=>x.type==='feedback'&&a.some(q=>q.id===x.quoteId&&q.type==='quote'&&q.opportunityId===x.opportunityId)),
 v.some(isOurs),
 new Set(v.filter(isOurs).map(x=>x.product)).size>=2||new Set(v.filter(isOurs).map(x=>x.participationId)).size>=2
 ];}
export function stage(s,o){const e=evidence(s,o);const first=e.indexOf(false);return first===-1?9:Math.max(1,first);}
export function canEdit(user,o){return ['leader','admin'].includes(user.role)||user.role==='field'&&o.ownerId===user.id||user.role==='office'&&(o.createdBy===user.id&&!o.handoffAt||o.scale==='small'&&o.type==='Частный'&&o.officeOwnerId===user.id);}
export function canSee(user,o){return ['leader','admin','owner','key','office'].includes(user.role)||o.ownerId===user.id;}
export function signals(s,now=new Date()){
 const out=[],t=s.settings.thresholds,add=(type,o,title,detail,opId='')=>out.push({id:type+':'+o.id+':'+opId,type,objectId:o.id,ownerId:o.ownerId,title,detail,focus:o.focus,severity:o.focus?'critical':'warning'});
 for(const o of s.objects.filter(x=>!x.archived&&x.state==='active')){
  const a=acts(s,o.id),v=opps(s,o.id),steps=s.steps.filter(x=>x.objectId===o.id&&x.status==='planned');
  if(!steps.length)add('no-step',o,'Нет следующего шага','Назначьте действие и срок');
  for(const x of steps){if(new Date(x.dueAt)<now)add('overdue',o,'Следующий шаг просрочен',x.title,x.id);if(x.reschedules>=t.reschedules)add('rescheduled',o,'Шаг многократно перенесён',`${x.reschedules} переносов · ${x.title}`,x.id);}
  const touches=a.filter(x=>['visit','meeting','call'].includes(x.type)).map(x=>+new Date(x.at));const last=Math.max(+new Date(o.createdAt),...touches);const limit=o.focus?t.focusTouch:o.scale==='medium'?t.mediumTouch:t.otherTouch;
  if(day(+now-last)>limit)add('no-touch',o,'Объект остывает',`${Math.floor(day(+now-last))} дней без касания · норматив ${limit}`);
  if(o.source==='office'&&!(o.scale==='small'&&o.type==='Частный')){
   if(!o.handoffAt&&(+now-new Date(o.createdAt))/3600000>t.handoffHours)add('handoff',o,'Офис не передал объект','Передача более чем через '+t.handoffHours+' ч');
   if(o.handoffAt&&!a.some(x=>x.type==='visit')&&businessDays(o.handoffAt,now,s.settings.holidays)>t.firstVisitBusinessDays)add('no-visit',o,'Нет первого визита','Срок первого визита истёк');
  }
  if(o.acceptedAt&&day(+now-new Date(o.acceptedAt))>t.competitorDays&&!o.competitorCheckedAt)add('competitors',o,'Конкуренты не проверены','Проверьте присутствие и продукты конкурентов');
  if(o.focus&&day(+now-new Date(o.createdAt))>t.decisionMakerDays&&!evidence(s,o)[3])add('no-lpr',o,'Нет контакта с ЛПР','Нужна встреча с тем, кто выбирает подрядчиков');
  for(const q of a.filter(x=>x.type==='quote'))if(!a.some(x=>x.type==='feedback'&&x.quoteId===q.id)&&businessDays(q.at,now,s.settings.holidays)>t.quoteBusinessDays)add('quote',o,'КП без обратной связи','Ответ не зафиксирован',q.id);
  for(const product of s.settings.recommendations[o.constructionStage]||[]){const pv=v.filter(x=>x.product===product);if(!pv.length||pv.some(x=>x.status==='unknown'))add('missing-product',o,'Не отработан продукт по стадии',s.settings.products.find(x=>x.id===product)?.name||product,product);}
  if(['preparation','earth'].includes(o.constructionStage)&&v.some(x=>x.product==='cabins'&&isOurs(x))&&!a.some(x=>x.type==='quote'&&v.some(y=>y.id===x.opportunityId&&y.product==='formwork')))add('cabins-no-formwork',o,'Бытовка есть — КП на опалубку нет','Используйте ранний вход на объект');
  if(['finishing','complete'].includes(o.constructionStage)&&!v.some(x=>x.product==='buyback'&&x.status!=='unknown'))add('buyback',o,'Не предложен выкуп','Отработайте освобождающееся оборудование');
  for(const x of v)if(x.status==='competitor'&&!x.returnDate)add('competitor-plan',o,'Продукт у конкурента без плана','Назначьте дату возврата к вопросу',x.id);
  for(const p of parts(s,o.id))if(!v.some(isOurs)&&s.participations.some(x=>x.clientId===p.clientId&&x.objectId!==o.id&&opps(s,x.objectId).some(isOurs)))add('client-expansion',o,'Клиент на объекте без нас',s.clients.find(x=>x.id===p.clientId)?.name||'',p.clientId);
 }
 const date=new Date(moscowDate(now)+'T00:00:00+03:00');
 const local=new Date(moscowDate(now)+'T12:00:00Z');const offset=(local.getUTCDay()+6)%7;const start=new Date(+date-offset*86400000);
 for(const u of s.users.filter(x=>x.role==='field')){const owned=s.objects.filter(o=>o.ownerId===u.id&&!o.archived);if(!owned.length)continue;const a=s.actions.filter(x=>x.authorId===u.id&&new Date(x.at)>=start);const visits=a.filter(x=>x.type==='visit');const weeklyNew=owned.filter(o=>o.source==='self'&&o.createdBy===u.id&&new Date(o.createdAt)>=start).length;const addUser=(type,title,detail)=>out.push({id:type+':'+u.id,type,ownerId:u.id,title,detail,focus:false,severity:'warning'});
  if(t.weeklyVisits!==null&&visits.length<t.weeklyVisits)addUser('few-visits','Визиты: ниже недельного норматива',`${visits.length} / ${t.weeklyVisits} · неделя ещё может быть не завершена`);
  if(weeklyNew===0)addUser('no-new','Нет самостоятельно найденных объектов','С начала текущей недели');
  else if(t.weeklyObjects!==null&&weeklyNew<t.weeklyObjects)addUser('few-new','Новые объекты: ниже норматива',`${weeklyNew} / ${t.weeklyObjects}`);
  const steps=s.steps.filter(x=>x.assigneeId===u.id&&x.status==='planned');const overdue=steps.filter(x=>new Date(x.dueAt)<now).length;
  if(steps.length&&overdue/steps.length*100>t.overdueShare)addUser('late-share','Накапливаются просрочки',`${overdue} из ${steps.length} открытых шагов`);
  if(!s.audit.some(x=>x.event==='stage-progress'&&x.ownerId===u.id&&new Date(x.at)>=start))addUser('no-progress','Нет продвижения по воронке','С начала недели нет зафиксированных переходов');
  for(const v of visits){const o=owned.find(x=>x.id===v.objectId);if(o&&(!v.geo||distance(o,v.geo)>t.visitRadiusMeters))addUser('geo-'+v.id,'Визит требует проверки геолокации',o.name);}
 }
 return out;
}
export function reconcile(s,now=new Date()){
 const at=now.toISOString();for(const o of s.objects)if(o.state==='paused'&&o.pauseUntil&&new Date(o.pauseUntil)<=now){o.state='active';s.version++;s.audit.push({id:uid(),at,actorId:'system',event:'resume',entityId:o.id});}
 const current=signals(s,now),ids=new Set(current.map(x=>x.id));for(const x of current){let saved=s.signalState.find(y=>y.id===x.id&&y.status==='open');if(!saved){saved={id:x.id,status:'open',firstSeen:at,comments:[]};s.signalState.push(saved);}Object.assign(x,{firstSeen:saved.firstSeen,comments:saved.comments});}
 for(const x of s.signalState)if(x.status==='open'&&!ids.has(x.id)){x.status='closed';x.closedAt=at;}
 return current;
}
export function visibleState(s,user,now=new Date()){
 const out=structuredClone(s);delete out.receipts;out.user=user;
 out.objects=out.objects.filter(o=>!o.archived).map(o=>canSee(user,o)?{...o,stage:stage(s,o),evidence:evidence(s,o),ourProducts:[...new Set(opps(s,o.id).filter(isOurs).map(x=>x.product))]}:{id:o.id,name:o.name,address:o.address,lat:o.lat,lng:o.lng,territoryId:o.territoryId,ownerId:o.ownerId,scale:o.scale,constructionStage:o.constructionStage,stage:stage(s,o),focus:o.focus,source:o.source,createdAt:o.createdAt,state:o.state,restricted:true,ourProducts:[]});
 const allowed=new Set(out.objects.filter(o=>!o.restricted).map(o=>o.id));out.participations=out.participations.filter(p=>allowed.has(p.objectId));const clientIds=new Set(out.participations.map(p=>p.clientId));if(user.role==='field'){out.clients=out.clients.filter(c=>clientIds.has(c.id)||c.createdBy===user.id);out.contacts=out.contacts.filter(c=>out.clients.some(x=>x.id===c.clientId));}
 out.opportunities=out.opportunities.filter(o=>out.participations.some(p=>p.id===o.participationId));out.actions=out.actions.filter(a=>allowed.has(a.objectId));out.steps=out.steps.filter(x=>allowed.has(x.objectId));
 out.signals=signals(s,now).map(x=>({...x,...s.signalState.find(y=>y.id===x.id&&y.status==='open')})).filter(x=>user.role==='field'?x.ownerId===user.id: user.role==='office'?!!x.objectId&&allowed.has(x.objectId):x.focus||(+now-new Date(x.firstSeen))/3600000>=s.settings.thresholds.managerDelayHours);
 out.audit=out.audit.filter(x=>['leader','owner','admin','key'].includes(user.role)||allowed.has(x.entityId)||x.actorId===user.id);out.notifications=out.notifications.filter(x=>x.userId===user.id);out.signalState=[];out.serverNow=now.toISOString();return out;
}
