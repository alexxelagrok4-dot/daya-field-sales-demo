export const stages = ['Выявлен', 'Описан', 'Участники выявлены', 'Контакт с ЛПР', 'Потребность выявлена', 'КП направлено', 'Обратная связь', 'Клиент на объекте', 'Партнёрство'];
export const defaults = {
  timezone: 'Europe/Moscow',
  products: [{id:'cabins',name:'Бытовки'},{id:'formwork',name:'Опалубка'},{id:'scaffolds',name:'Леса'},{id:'buyback',name:'Выкуп оборудования'}],
  constructionStages: [{id:'preparation',name:'Подготовка площадки'},{id:'earth',name:'Земляные работы'},{id:'frame',name:'Монолит / каркас'},{id:'facade',name:'Фасад и кровля'},{id:'finishing',name:'Отделка'},{id:'complete',name:'Завершён'},{id:'frozen',name:'Заморожен'}],
  recommendations: {preparation:['cabins'],earth:['cabins','formwork'],frame:['formwork','scaffolds','cabins'],facade:['scaffolds','cabins','buyback'],finishing:['buyback'],complete:['buyback'],frozen:[]},
  objectTypes:['Жилой','Коммерческий','Инфраструктурный','Промышленный','Социальный','Частный','Религиозный','Военный','Нестроительный'],
  clientProfiles:['Заказчик / девелопер','Генподрядчик','Монолитчик','Земляные работы','Фасады и кровля','Другой подрядчик','Частник / бригада','Не строитель'],
  lossReasons:['У конкурента','Цена','Нет потребности','Стройка остановлена','Другое'],
  scaleGuidance:{small:'Черновик: частный дом, небольшое здание до 3 этажей',medium:'Черновик: до 9 этажей или несколько подрядчиков',large:'Черновик: ЖК, высотка, инфраструктура, промышленный комплекс'},
  thresholds:{focusTouch:7,mediumTouch:14,otherTouch:30,firstVisitBusinessDays:3,quoteBusinessDays:5,handoffHours:24,competitorDays:7,decisionMakerDays:14,reschedules:3,managerDelayHours:24,duplicateMeters:75,visitRadiusMeters:300,weeklyVisits:null,weeklyObjects:null,overdueShare:20},
  holidays:[], normsApproved:false,
  map:{provider:'osm',tileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:'© OpenStreetMap contributors',yandexKey:''}
};
export const roles = {leader:'Руководитель полевых продаж',field:'Территориальный менеджер',office:'Офисный менеджер',key:'Руководитель ключевых клиентов',owner:'Собственник · просмотр',admin:'Администратор'};
