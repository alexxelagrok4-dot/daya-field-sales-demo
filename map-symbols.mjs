const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const mapGroups=[
  {id:'new',color:'#2864b7',label:'Новый объект',detail:'Этапы 1–2: выявлен / описан'},
  {id:'work',color:'#b86608',label:'Развитие сделки',detail:'Этапы 3–7: участники → обратная связь'},
  {id:'client',color:'#087f6b',label:'Наш клиент',detail:'Этап 8: клиент на объекте'},
  {id:'partner',color:'#7141ad',label:'Партнёрство',detail:'Этап 9: развитие сотрудничества'}
];
export function mapGroup(o){return mapGroups[o.stage>=9?3:o.stage>=8?2:o.stage>=3?1:0];}
export function markerSize(o){return o.scale==='large'?38:o.scale==='medium'?32:26;}
export function markerMarkup(o,signals=[]){
  const group=mapGroup(o),signal=signals.some(x=>x.objectId===o.id);
  return `<div class="map-marker marker-${group.id}${signal?' has-signal':''}${o.focus?' focus':''}${o.restricted?' restricted':''}" style="--marker:${group.color}"><span>${o.restricted?'?':o.ourProducts?.length||0}</span>${signal?'<i class="marker-alert">!</i>':''}${o.focus?'<b class="marker-star">★</b>':''}</div>`;
}
export function markerDescription(o,s){
  const group=mapGroup(o),construction=s.settings.constructionStages.find(x=>x.id===o.constructionStage)?.name||'';
  return `${o.name} · ${group.label} · ${construction} · ${o.restricted?'Детали недоступны':(o.ourProducts?.length||0)+' наших продуктов'}${s.signals.some(x=>x.objectId===o.id)?' · Есть сигнал':''}${o.focus?' · Фокусный объект':''}`;
}
export function markerSvg(o,signals=[]){
  const group=mapGroup(o),signal=signals.some(x=>x.objectId===o.id);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54">${o.focus?'<circle cx="27" cy="27" r="24" fill="#f1b622" fill-opacity=".35" stroke="#b67b00" stroke-width="2"/>':''}<circle cx="27" cy="27" r="18" fill="${group.color}" stroke="${signal?'#cf293e':'white'}" stroke-width="4"/><text x="27" y="32" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="white">${o.restricted?'?':o.ourProducts?.length||0}</text>${signal?'<circle cx="44" cy="10" r="9" fill="#cf293e" stroke="white" stroke-width="2"/><text x="44" y="15" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="white">!</text>':''}${o.focus?'<text x="6" y="14" text-anchor="middle" font-size="15" fill="#825200">★</text>':''}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
export function mapLegend(s){
  return `<section class="panel map-legend" aria-label="Условные обозначения карты"><div class="panel-head"><h2>Как читать карту</h2></div><div class="panel-body">
    <h3>Цвет точки · этап продажи</h3>
    ${mapGroups.map(g=>`<button class="legend-row legend-filter" data-act="mapGroup" data-id="${g.id}"><span class="legend-marker" style="--marker:${g.color}">0</span><span><strong>${g.label}</strong><span class="legend-detail">${g.detail} →</span></span></button>`).join('')}
    <h3>Обводка и значки</h3>
    <button class="legend-row legend-filter" data-act="mapSignals"><span class="legend-marker has-signal">0<i class="marker-alert">!</i></span><span><strong>Красная обводка и !</strong><span class="legend-detail">Есть сигнал, доступный вашей роли →</span></span></button>
    <button class="legend-row legend-filter" data-act="mapFocus"><span class="legend-marker focus">0<b class="marker-star">★</b></span><span><strong>Золотой ореол и ★</strong><span class="legend-detail">Фокусный объект; может сочетаться с сигналом →</span></span></button>
    <div class="legend-row"><span class="legend-marker">0</span><div><strong>Белая обводка</strong><p>Нет сигналов, доступных вашей роли</p></div></div>
    <h3>Цифра и размер</h3>
    <p class="legend-explanation"><b>0, 1, 2…</b> внутри точки — количество наших продуктов на объекте. <b>?</b> — подробности чужой территории недоступны.</p>
    <div class="legend-sizes">${[['small','Малый'],['medium','Средний'],['large','Крупный']].map(([scale,label])=>`<span><i class="legend-marker" style="width:${markerSize({scale})}px;height:${markerSize({scale})}px">0</i>${label}</span>`).join('')}</div>
    <div class="legend-row"><span class="map-cluster">5</span><div><strong>Группа из 5 объектов</strong><p>Нажмите, чтобы приблизить и разделить точки</p></div></div>
    <h3>Границы территорий</h3>
    ${s.territories.map(t=>`<button class="legend-row legend-filter" data-act="mapTerritory" data-id="${esc(t.id)}"><i class="legend-boundary" style="border-color:${esc(t.color)}"></i><span><strong>${esc(t.name)}</strong><span class="legend-detail">${esc(s.users.find(u=>u.id===t.ownerId)?.name||'Не назначен')} →</span></span></button>`).join('')}
    <p class="legend-explanation">Стадия стройки — в подсказке точки и списке объектов. Нажмите на точку или строку списка, чтобы открыть карточку.</p>
  </div></section>`;
}
