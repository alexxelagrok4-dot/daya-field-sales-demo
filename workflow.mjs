export const roleGuides={
  leader:{home:'dashboard',title:'Решения руководителя',text:'Разберите фокусные объекты и просрочки. Завершайте разбор понятным следующим шагом для ответственного.'},
  field:{home:'day',title:'Мой день в поле',text:'Примите новые передачи, выполните срочные шаги и зафиксируйте результат. У каждого активного объекта должен быть следующий шаг.'},
  office:{home:'workbench',title:'От заявки до передачи',text:'Опишите объект, добавьте участника и продуктовую возможность. Затем передайте полевику и проверьте принятие.'},
  key:{home:'workbench',title:'Развитие клиентов',text:'Смотрите все объекты клиента, находите потребности в других продуктах и фиксируйте новые стройки через существующие связи.'},
  owner:{home:'dashboard',title:'Контроль результата',text:'Оцените риски, движение и покрытие продуктами. Открывайте состав показателя и оставляйте решения в комментариях к сигналам.'},
  admin:{home:'settings',title:'Настройка рабочего контура',text:'Проверьте территории и владельцев, затем продукты и нормативы. Черновые нормативы утверждаются отдельно.'}
};
export function splitSteps(steps,now=new Date()){
  const today=now.toLocaleDateString('en-CA',{timeZone:'Europe/Moscow'});
  const sorted=[...steps].sort((a,b)=>a.dueAt.localeCompare(b.dueAt));
  return {overdue:sorted.filter(x=>new Date(x.dueAt)<now),today:sorted.filter(x=>new Date(x.dueAt)>=now&&new Date(x.dueAt).toLocaleDateString('en-CA',{timeZone:'Europe/Moscow'})===today),later:sorted.filter(x=>new Date(x.dueAt)>=now&&new Date(x.dueAt).toLocaleDateString('en-CA',{timeZone:'Europe/Moscow'})!==today)};
}
export function officeQueue(state){
  return state.objects.filter(o=>!o.restricted&&!o.archived&&o.source==='office'&&(o.createdBy===state.user.id||o.officeOwnerId===state.user.id)).map(o=>{
    const parts=state.participations.filter(p=>p.objectId===o.id);
    const opportunities=state.opportunities.filter(v=>parts.some(p=>p.id===v.participationId));
    const missing=[];if(!parts.length)missing.push('Участник');if(!opportunities.length)missing.push('Продуктовая возможность');
    const status=o.state!=='active'?'inactive':o.scale==='small'&&o.type==='Частный'?'office':o.acceptedAt&&o.handoffAt?'accepted':o.handoffAt?'waiting':missing.length?'prepare':'ready';
    return {object:o,missing,status};
  }).sort((a,b)=>({ready:0,prepare:1,waiting:2,office:3,accepted:4,inactive:5})[a.status]-({ready:0,prepare:1,waiting:2,office:3,accepted:4,inactive:5})[b.status]||a.object.createdAt.localeCompare(b.object.createdAt));
}
