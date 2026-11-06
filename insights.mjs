import {recordObjectId} from './metric-data.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v?new Date(v).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',dateStyle:'short',timeStyle:'short'}):'—';
const kinds={objects:'объектов',signals:'сигналов',actions:'действий',steps:'шагов',opportunities:'возможностей',participations:'участий',audit:'событий',territories:'территорий'};
const actions={visit:'Визит',meeting:'Встреча',call:'Звонок',quote:'КП',feedback:'Обратная связь'};
const statuses={unknown:'Не выяснено',need:'Есть потребность',quoted:'КП направлено',feedback:'Обратная связь',ours:'У нас',competitor:'У конкурента','not-needed':'Не нужно',later:'Позже'};
const roles={customer:'Заказчик',general:'Генподрядчик',contractor:'Подрядчик',subcontractor:'Субподрядчик'};

export function createInsights(){
  const targets=new Map();let sequence=0,active=null,origin=null,search='';
  function records(state){return active?(state[active.kind]||[]).filter(r=>active.ids.includes(r.id)&&(active.kind!=='objects'||!r.restricted)):[];}
  function related(state){const ids=new Set(records(state).map(r=>recordObjectId(state,active.kind,r)));return state.objects.filter(o=>ids.has(o.id)&&!o.restricted);}
  function objectButton(o){return o?`<button class="link-button" data-act="openObject" data-id="${esc(o.id)}">${esc(o.name)} →</button>`:'—';}
  function describe(s,r){
    const o=s.objects.find(o=>o.id===recordObjectId(s,active.kind,r));
    const name=id=>s.users.find(u=>u.id===id)?.name||'Не назначен';
    const product=id=>s.settings.products.find(p=>p.id===id)?.name||id;
    if(active.kind==='objects'){
      const signals=s.signals.filter(x=>x.objectId===r.id);
      const step=s.steps.filter(x=>x.objectId===r.id&&x.status==='planned').sort((a,b)=>a.dueAt.localeCompare(b.dueAt))[0];
      return [objectButton(r)+`<p class="muted">${esc(r.address)}</p>`,esc(name(r.ownerId)),
        `<p>Этап ${r.stage} · ${esc(s.settings.constructionStages.find(c=>c.id===r.constructionStage)?.name)}</p><p>Наших продуктов: ${(r.ourProducts||[]).length} · ${esc((r.ourProducts||[]).map(product).join(', ')||'Нет')}</p>${signals.length?`<ul class="insight-signals">${signals.map(x=>`<li>${esc(x.title)}</li>`).join('')}</ul>`:'<p class="muted">Нет доступных сигналов</p>'}`,
        step?`${esc(step.title)}<p class="muted">${fmt(step.dueAt)}</p>`:'Следующий шаг не назначен'];
    }
    if(active.kind==='territories')return [esc(r.name),esc(name(r.ownerId)),`${s.objects.filter(o=>o.territoryId===r.id&&!o.restricted).length} известных объектов`, 'Граница доступна на карте'];
    if(active.kind==='actions')return [objectButton(o),esc(name(r.authorId)),`${esc(actions[r.type]||r.type)}<p>${esc(r.result)}</p>`,fmt(r.at)];
    if(active.kind==='steps')return [objectButton(o),esc(name(r.assigneeId)),`${esc(r.title)}<p class="muted">Переносов: ${r.reschedules||0}</p>`,fmt(r.dueAt)];
    if(active.kind==='signals')return [objectButton(o),esc(name(r.ownerId)),`${esc(r.title)}<p>${esc(r.detail)}</p>`,fmt(r.firstSeen)];
    if(active.kind==='opportunities'){
      const part=s.participations.find(p=>p.id===r.participationId),client=s.clients.find(c=>c.id===part?.clientId);
      return [objectButton(o),esc(client?.name||name(o?.ownerId)),`${esc(product(r.product))} · ${esc(statuses[r.status]||r.status)}<p class="muted">${esc(r.volume||'Объём не указан')}</p>`,fmt(r.createdAt)];
    }
    if(active.kind==='participations')return [objectButton(o),esc(s.clients.find(c=>c.id===r.clientId)?.name),`${esc(roles[r.role]||r.role)}<p>${esc(r.work)}</p>`,fmt(r.createdAt)];
    return [objectButton(o),esc(name(r.actorId)),esc(r.event==='stage-progress'?'Переход вперёд по воронке':r.event),fmt(r.at)];
  }
  return {
    clearRegistry(){targets.clear();},
    reset(){active=null;origin=null;search='';targets.clear();},
    get active(){return active;},get origin(){return origin;},
    link(title,kind,items,html,className='metric-link',hint=''){
      const id='metric-'+sequence++;
      targets.set(id,{title,kind,ids:[...new Set(items.map(x=>x.id))],hint});
      return `<button type="button" class="${className}" data-drill="${id}" data-metric-title="${esc(title)}" aria-label="${esc(title)}: открыть подробности">${html}</button>`;
    },
    open(id,view,filter){const target=targets.get(id);if(!target)return false;origin={view,filter:structuredClone(filter),scroll:window.scrollY,active,origin,search};active=target;search='';return true;},
    back(){const previous=origin;active=previous?.active||null;origin=previous?.origin||null;search=previous?.search||'';return previous;},
    records,related,
    search(value){search=value;},
    render(s){
      if(!active)return '<div class="empty">Выберите показатель</div>';
      const all=records(s),rows=all.map(r=>({r,cells:describe(s,r)}));
      const shown=rows.filter(x=>!search||x.cells.join(' ').replace(/<[^>]+>/g,' ').toLowerCase().includes(search.toLowerCase()));
      return `<section class="panel insight-panel" aria-label="Расшифровка показателя"><div class="panel-head"><div><h2>${esc(active.title)}</h2><p>${esc(active.hint||'Состав показателя на момент перехода. Обновление данных сохраняет выбранный список.')}</p></div><span class="badge orange" data-insight-total>${all.length} ${kinds[active.kind]}</span></div>
        <div class="panel-body toolbar"><button data-act="insightBack">← К показателям</button>${related(s).length?'<button data-act="insightMap">Эти объекты на карте →</button>':''}${active.kind==='territories'?'<button data-act="map">Открыть карту территорий →</button>':''}<input class="search" data-insight-search aria-label="Поиск в показателе" placeholder="Поиск в выбранном списке" value="${esc(search)}"><span class="muted small" data-insight-shown>Показано ${shown.length} из ${all.length}</span></div>
        ${shown.length?`<div class="table-wrap"><table data-insight-kind="${active.kind}"><thead><tr><th>${active.kind==='territories'?'Территория':'Объект'}</th><th>Ответственный / клиент</th><th>Подробности</th><th>${active.kind==='objects'?'Следующий шаг':'Дата / примечание'}</th></tr></thead><tbody>${shown.map(({r,cells})=>`<tr data-record-id="${esc(r.id)}">${cells.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<div class="empty">Нет записей по выбранному показателю или поиску.</div>'}
      </section>`;
    }
  };
}
