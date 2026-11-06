// Both the displayed value and its drill-down are derived from the same records.
export function dashboardMetrics(state,objects,now=Date.now()){
  const known=objects.filter(o=>!o.restricted),ids=new Set(known.map(o=>o.id));
  const signals=state.signals.filter(s=>ids.has(s.objectId));
  const attentionIds=new Set(signals.map(s=>s.objectId));
  return {
    attention:known.filter(o=>attentionIds.has(o.id)),signals,
    active:known.filter(o=>o.state==='active'),
    multi:known.filter(o=>(o.ourProducts?.length||0)>=2),
    recent:known.filter(o=>new Date(o.createdAt)>=now-7*86400000),
    focus:known.filter(o=>o.focus),known
  };
}
export function teamMetrics(state,userId,now=Date.now()){
  const objects=state.objects.filter(o=>o.ownerId===userId&&!o.restricted);
  const steps=state.steps.filter(s=>s.assigneeId===userId&&s.status==='planned');
  return {objects,steps,
    active:objects.filter(o=>o.state==='active'),
    visits:state.actions.filter(a=>a.authorId===userId&&a.type==='visit'&&new Date(a.at)>=now-7*86400000),
    recent:objects.filter(o=>o.source==='self'&&o.createdBy===userId&&new Date(o.createdAt)>=now-7*86400000),
    multi:objects.filter(o=>(o.ourProducts?.length||0)>=2),
    overdue:steps.filter(s=>new Date(s.dueAt)<now)
  };
}
export function recordObjectId(state,kind,item){
  if(kind==='objects')return item.id;
  if(kind==='opportunities')return state.participations.find(p=>p.id===item.participationId)?.objectId;
  if(kind==='audit')return state.objects.some(o=>o.id===item.entityId)?item.entityId:null;
  return item.objectId||null;
}
