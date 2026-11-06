import {seed} from './model/seed.mjs';
import {execute} from './model/commands.mjs';
import {visibleState,reconcile,fail} from './model/domain.mjs';

// GitHub Pages has no application server. This adapter keeps each visitor's
// synthetic demonstration in IndexedDB; it is not authentication or shared data.
const database = new Promise((resolve,reject)=>{
  const request=indexedDB.open('daya-pages-demo-v1',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('state');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
});

async function transaction(fn){
  const db=await database;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('state','readwrite');
    const store=tx.objectStore('state');
    const request=store.get('current');
    let result,error;
    request.onsuccess=()=>{
      try{
        const state=request.result||seed();
        result=fn(state);
        store.put(state,'current');
      }catch(e){error=e;tx.abort();}
    };
    tx.oncomplete=()=>resolve(result);
    tx.onabort=tx.onerror=()=>reject(error||tx.error||new Error('Не удалось сохранить данные в браузере'));
  });
}

export async function demoFetch(input,options={}){
  try{
    const url=new URL(input,document.baseURI);
    const route=url.pathname.slice(new URL('./',document.baseURI).pathname.length);
    const method=options.method||'GET';
    const payload=options.body?JSON.parse(options.body):{};
    const result=await transaction(s=>{
      const user=s.users.find(u=>u.id===sessionStorage.getItem('daya-pages-profile'));
      if(route==='api/session'){
        if(method==='POST'){
          if(!s.users.some(u=>u.id===payload.userId))fail('Профиль не найден',404);
          sessionStorage.setItem('daya-pages-profile',payload.userId);
          return {ok:true};
        }
        return {user:user||null,users:s.users,mode:'browser-demo'};
      }
      if(!user)fail('Выберите демонстрационный профиль',401);
      if(route==='api/state'){reconcile(s);return visibleState(s,user);}
      if(route==='api/commands'&&method==='POST'){
        if(typeof payload.id!=='string'||payload.id.length>100)fail('Нужен идентификатор операции');
        const receipt=s.receipts.find(r=>r.id===payload.id);
        if(receipt){if(receipt.actorId!==user.id)fail('Операция принадлежит другому профилю',403);return receipt.result;}
        if(payload.version!==s.version)fail('Данные изменились в другой вкладке. Обновите страницу и повторите действие.',409);
        const value=execute(s,user,payload);
        const result={ok:true,result:value,version:s.version};
        s.receipts.push({id:payload.id,actorId:user.id,result});
        return result;
      }
      fail('Маршрут не найден',404);
    });
    return Response.json(result);
  }catch(e){return Response.json({error:e.message},{status:e.status||500});}
}

document.addEventListener('click',async event=>{
  const link=event.target.closest('a[href*="api/export?"]');
  if(!link)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try{
    const response=await demoFetch(new URL('./api/state',document.baseURI));
    const state=await response.json();
    if(!response.ok)throw new Error(state.error);
    const type=new URL(link.href).searchParams.get('type')||'objects';
    const allowed=['objects','clients','actions','steps','signals','opportunities','audit','territories'];
    if(!allowed.includes(type))throw new Error('Неизвестная выгрузка');
    const rows=state[type].filter(row=>!row.restricted);
    const keys=[...new Set(rows.flatMap(Object.keys))].filter(k=>!['photo','detail','firstQuoteSnapshot','handoffSnapshot'].includes(k));
    const workbook=new globalThis.ExcelJS.Workbook();
    const sheet=workbook.addWorksheet('DAYA');
    sheet.columns=keys.map(key=>({header:key,key,width:24}));
    for(const row of rows)sheet.addRow(Object.fromEntries(keys.map(k=>[k,typeof row[k]==='object'?JSON.stringify(row[k]):row[k]??''])));
    const blob=new Blob([await workbook.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const href=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=href;anchor.download=`daya-demo-${type}.xlsx`;anchor.click();
    setTimeout(()=>URL.revokeObjectURL(href),30000);
  }catch(e){alert(e.message);}
},true);
