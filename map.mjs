import {markerMarkup,markerSize,markerDescription,markerSvg} from './map-symbols.mjs';
let current=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function destroyMap(){if(current){current.destroy?.();current.remove?.();current=null;}}
export function focusLocation({lat,lng}){
 if(current?.setView){current.setView([lat,lng],16);window.L.circleMarker([lat,lng],{radius:7,color:'#fff',weight:3,fillColor:'#2864b7',fillOpacity:1}).addTo(current).bindTooltip('Ваше местоположение').openTooltip();}
 else current?.setCenter?.([lat,lng],16);
}
export async function mountMap(element,s,objects,onOpen,onPoint){
 destroyMap();if(!element)return;
 if(s.settings.map.provider==='yandex'&&s.settings.map.yandexKey){try{return await yandex(element,s,objects,onOpen,onPoint);}catch(e){element.innerHTML='';const note=document.createElement('p');note.className='map-note';note.textContent='Яндекс Карты недоступны. Показываем тестовую подложку OpenStreetMap.';element.before(note);}}
 const L=window.L;if(!L){element.textContent='Карта недоступна. Объекты остаются доступны в списке.';return;}
 const map=L.map(element,{zoomControl:true,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([45.065,39.023],11);current=map;
 const layer=L.tileLayer(s.settings.map.tileUrl||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">'+esc(s.settings.map.attribution)+'</a>'}).addTo(map);
 let errors=0;layer.on('tileerror',()=>{if(++errors===3){const note=document.createElement('div');note.className='map-error';note.textContent='Подложка не загрузилась. Точки и границы доступны; проверьте сеть.';element.append(note);}});
 for(const t of s.territories)L.polygon(t.polygon.map(([lng,lat])=>[lat,lng]),{color:t.color,weight:1.6,fillOpacity:.055,dashArray:'6 5'}).addTo(map).bindTooltip(esc(t.name),{sticky:true});
 const markers=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:44,disableClusteringAtZoom:15,animate:false,iconCreateFunction:cluster=>L.divIcon({className:'',html:`<div class="map-cluster" title="${cluster.getChildCount()} объектов. Нажмите для приближения">${cluster.getChildCount()}</div>`,iconSize:[42,42]})});
 for(const o of objects){const size=markerSize(o),description=markerDescription(o,s);const icon=L.divIcon({className:'object-marker',html:markerMarkup(o,s.signals),iconSize:[size,size],iconAnchor:[size/2,size/2]});const marker=L.marker([o.lat,o.lng],{icon,title:description,alt:description,keyboard:true}).bindTooltip(esc(description));marker.on('click',()=>onOpen(o.id));markers.addLayer(marker);}
 map.addLayer(markers);if(objects.length)map.fitBounds(objects.map(o=>[o.lat,o.lng]),{padding:[35,35],maxZoom:13});map.on('click',e=>onPoint?.(e.latlng));setTimeout(()=>{if(current===map&&element.isConnected)map.invalidateSize();},100);return map;
}
async function yandex(element,s,objects,onOpen,onPoint){
 if(!window.ymaps)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey='+encodeURIComponent(s.settings.map.yandexKey);script.onload=resolve;script.onerror=reject;document.head.append(script);setTimeout(()=>reject(new Error('timeout')),12000);});
 await new Promise(resolve=>window.ymaps.ready(resolve));if(!element.isConnected)return;const y=window.ymaps;const map=new y.Map(element,{center:[45.065,39.023],zoom:11,controls:['zoomControl']});current=map;
 for(const t of s.territories)map.geoObjects.add(new y.Polygon([t.polygon.map(([lng,lat])=>[lat,lng])],{hintContent:esc(t.name)},{fillColor:t.color+'12',strokeColor:t.color,strokeWidth:2}));
 const cluster=new y.Clusterer({groupByCoordinates:false,clusterIconColor:'#334d68'});for(const o of objects){const size=markerSize(o)+16;const marker=new y.Placemark([o.lat,o.lng],{hintContent:esc(markerDescription(o,s))},{iconLayout:'default#image',iconImageHref:markerSvg(o,s.signals),iconImageSize:[size,size],iconImageOffset:[-size/2,-size/2]});marker.events.add('click',()=>onOpen(o.id));cluster.add(marker);}map.geoObjects.add(cluster);if(objects.length>1)map.setBounds(cluster.getBounds(),{checkZoomRange:true,zoomMargin:40});map.events.add('click',e=>{const [lat,lng]=e.get('coords');onPoint?.({lat,lng});});return map;
}
