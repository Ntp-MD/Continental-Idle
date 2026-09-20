import { readFileSync, writeFileSync } from 'fs'
const p = 'src/blueprint-editor/data/blueprint-data.json'
const j = JSON.parse(readFileSync(p, 'utf-8'))
const TILE = 20
const ROWS = 50
const COLS = 80
function emptyStates(){return Array.from({length:ROWS},()=>Array.from({length:COLS},()=>'walkable'))}
function setBlocked(ts,gx,gy){if(gy>=0&&gy<ROWS&&gx>=0&&gx<COLS)ts[gy][gx]='blocked'}
function setDoor(ts,gx,gy){if(gy>=0&&gy<ROWS&&gx>=0&&gx<COLS)ts[gy][gx]='door'}
function line(ts,x1,y1,x2,y2){if(x1===x2)for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)setBlocked(ts,x1,y);else if(y1===y2)for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)setBlocked(ts,x,y1)}
function outerWalls(ts,doors=[]){line(ts,8,8,71,8);line(ts,8,41,71,41);line(ts,8,8,8,41);line(ts,71,8,71,41);for(const d of doors)setDoor(ts,d[0],d[1])}
let objCounter=0
function mkObj(type,x,y,rot=0){objCounter++;return {id:`obj-${type}-${objCounter}`,type,x:x*TILE,y:y*TILE,rotation:rot}}
function lobbyFloor(){
  const ts=emptyStates()
  outerWalls(ts,[[39,41],[40,41],[39,38],[40,38],[32,8]])
  line(ts,38,38,38,41);line(ts,41,38,41,41)
  line(ts,8,14,71,14);setDoor(ts,32,14)
  line(ts,10,10,16,10);line(ts,10,13,16,13);line(ts,10,10,10,13);line(ts,16,10,16,13);setDoor(ts,13,13)
  line(ts,9,26,14,26);line(ts,9,30,14,30);line(ts,9,26,9,30);line(ts,14,26,14,30);setDoor(ts,11,26);setDoor(ts,11,30)
  const objs=[]
  objs.push(mkObj('reception-desk',30,32))
  objs.push(mkObj('office-chair',30,30));objs.push(mkObj('office-chair',34,30))
  objs.push(mkObj('sofa-1',17,28));objs.push(mkObj('single-sofa-1',15,30));objs.push(mkObj('single-sofa-1',20,30));objs.push(mkObj('table-1',17,30))
  objs.push(mkObj('table-set',22,26));objs.push(mkObj('sofa-1',50,28));objs.push(mkObj('single-sofa-1',48,30));objs.push(mkObj('single-sofa-1',54,30));objs.push(mkObj('table-1',51,30))
  objs.push(mkObj('table-set',58,26));objs.push(mkObj('bench',50,34));objs.push(mkObj('bench',54,34))
  objs.push(mkObj('bar-counter',42,22));objs.push(mkObj('chair',43,24));objs.push(mkObj('chair',45,24))
  objs.push(mkObj('toilet',11,11));objs.push(mkObj('toilet',13,11));objs.push(mkObj('washbasin',11,12));objs.push(mkObj('washbasin',13,12))
  objs.push(mkObj('elevator-1',10,28));objs.push(mkObj('elevator-1',12,28))
  objs.push(mkObj('bench',20,20));objs.push(mkObj('bench',46,20))
  objs.push(mkObj('vending-machine',46,16))
  objs.push(mkObj('bench',12,9));objs.push(mkObj('bench',16,9));objs.push(mkObj('kitchen-sink',30,9));objs.push(mkObj('office-chair',36,10))
  return {ts,objs,spawnZones:[{id:'zone-guest-entry',label:'Guest arrival',x:620,y:640,w:240,h:100,roleIds:['role-guest']},{id:'zone-bar',label:'Bar',x:840,y:440,w:80,h:40,roleIds:['role-bartender']},{id:'zone-reception',label:'Reception',x:600,y:600,w:160,h:40,roleIds:['role-receptionist']}]}
}
function diningFloor(){
  const ts=emptyStates()
  outerWalls(ts,[[40,41],[32,8]])
  line(ts,8,19,71,19);setDoor(ts,40,19)
  line(ts,40,8,40,19)
  line(ts,40,10,55,10);line(ts,55,10,55,19)
  line(ts,50,25,50,30)
  line(ts,60,35,68,35);line(ts,60,38,68,38);line(ts,60,35,60,38);line(ts,68,35,68,38);setDoor(ts,64,35)
  line(ts,9,26,14,26);line(ts,9,30,14,30);line(ts,9,26,9,30);line(ts,14,26,14,30);setDoor(ts,11,26);setDoor(ts,11,30)
  const objs=[]
  objs.push(mkObj('kitchen-table-1',12,11));objs.push(mkObj('kitchen-sink',12,13));objs.push(mkObj('table-stove',16,13));objs.push(mkObj('kitchen-sink',20,11));objs.push(mkObj('kitchen-table-1',20,13));objs.push(mkObj('table-stove',16,11))
  objs.push(mkObj('washer-1',46,12));objs.push(mkObj('washer-1',48,12))
  objs.push(mkObj('bar-counter',36,21))
  const diningX=[16,28,40,52],diningY=[24,30,35]
  for(let y of diningY)for(let x of diningX){if(y===35&&x>=60)continue;objs.push(mkObj('table-set',x,y))}
  objs.push(mkObj('toilet',61,36));objs.push(mkObj('toilet',63,36));objs.push(mkObj('washbasin',61,37));objs.push(mkObj('washbasin',63,37))
  objs.push(mkObj('elevator-1',10,28));objs.push(mkObj('elevator-1',12,28))
  objs.push(mkObj('vending-machine',32,16))
  return {ts,objs,spawnZones:[{id:'z-d1',label:'Kitchen',x:240,y:220,w:320,h:160,roleIds:['role-6dfde6eef0']}]}
}
function eventsFloor(){
  const ts=emptyStates()
  outerWalls(ts,[[11,26],[11,30]])
  line(ts,8,22,71,22);setDoor(ts,40,22)
  line(ts,18,8,18,22);setDoor(ts,18,16)
  line(ts,9,26,14,26);line(ts,9,30,14,30);line(ts,9,26,9,30);line(ts,14,26,14,30);setDoor(ts,11,26);setDoor(ts,11,30)
  const objs=[]
  for(let x of [22,32,42,52]){objs.push(mkObj('table-set',x,12));objs.push(mkObj('table-set',x,16))}
  for(let x of [22,34,46,58])objs.push(mkObj('table-set',x,30))
  for(let x of [22,34,46,58])objs.push(mkObj('table-set',x,35))
  objs.push(mkObj('bar-counter',16,28));objs.push(mkObj('sofa-1',50,34));objs.push(mkObj('single-sofa-1',48,36))
  objs.push(mkObj('elevator-1',10,28));objs.push(mkObj('elevator-1',12,28))
  return {ts,objs,spawnZones:[{id:'z-e2',label:'Ballroom',x:260,y:240,w:900,h:200,roleIds:['role-guest']}]}
}
function wellnessFloor(){
  const ts=emptyStates()
  outerWalls(ts,[[11,26],[11,30]])
  line(ts,32,8,32,30);line(ts,8,20,32,20);line(ts,32,18,50,18);line(ts,50,8,50,30)
  line(ts,9,26,14,26);line(ts,9,30,14,30);line(ts,9,26,9,30);line(ts,14,26,14,30);setDoor(ts,11,26);setDoor(ts,11,30)
  setDoor(ts,20,20);setDoor(ts,40,18);setDoor(ts,60,18)
  const objs=[]
  for(let i=0;i<6;i++)objs.push(mkObj('treadmill-1',12+i*3,11))
  objs.push(mkObj('bench',14,16));objs.push(mkObj('bench',20,16))
  objs.push(mkObj('bathtub',36,12));objs.push(mkObj('bathtub',40,12));objs.push(mkObj('shower',44,12));objs.push(mkObj('shower',46,12))
  objs.push(mkObj('toilet',36,16));objs.push(mkObj('washbasin',38,16));objs.push(mkObj('bench',40,16))
  objs.push(mkObj('washer-1',28,12))
  for(let x of [16,30,44])objs.push(mkObj('sofa-1',x,28))
  for(let x of [60,66])objs.push(mkObj('single-sofa-1',x,28))
  for(let x of [16,32,44,60])objs.push(mkObj('table-1',x+2,30))
  objs.push(mkObj('bar-counter',20,24));objs.push(mkObj('vending-machine',54,14))
  objs.push(mkObj('elevator-1',10,28));objs.push(mkObj('elevator-1',12,28))
  return {ts,objs,spawnZones:[{id:'z-w3',label:'Gym',x:220,y:220,w:420,h:180,roleIds:['role-guest']}]}
}
function clubFloor(){
  const ts=emptyStates()
  outerWalls(ts,[[11,26],[11,30]])
  line(ts,40,8,40,41);line(ts,8,20,40,20);setDoor(ts,40,16);setDoor(ts,24,20)
  line(ts,9,26,14,26);line(ts,9,30,14,30);line(ts,9,26,9,30);line(ts,14,26,14,30);setDoor(ts,11,26);setDoor(ts,11,30)
  const objs=[]
  for(let y of [12,26,34])for(let x of [16,24,32]){if(y===12&&x===32)continue;objs.push(mkObj('sofa-1',x,y));objs.push(mkObj('table-1',x+2,y+2))}
  objs.push(mkObj('bar-counter',50,14))
  for(let x of [50,60])objs.push(mkObj('table-set',x,26))
  for(let x of [50,60])objs.push(mkObj('table-set',x,32))
  objs.push(mkObj('vending-machine',66,36))
  objs.push(mkObj('elevator-1',10,28));objs.push(mkObj('elevator-1',12,28))
  return {ts,objs,spawnZones:[{id:'z-c4',label:'Club lounge',x:220,y:180,w:620,h:260,roleIds:['role-guest']}]}
}
function guestFloor(label){
  const ts=emptyStates()
  outerWalls(ts,[])
  line(ts,8,23,71,23)
  line(ts,14,26,71,26)
  for(let gx=16;gx<71;gx+=8)line(ts,gx,8,gx,23)
  for(let gx of [16,24,32,40,48,56,64])line(ts,gx,26,gx,41)
  for(let i=0;i<8;i++)setDoor(ts,12+i*8,23)
  for(let s of [16,24,32,40,48,56,64])setDoor(ts,s+3,26)
  line(ts,14,26,14,33);line(ts,8,33,14,33)
  const objs=[]
  objs.push(mkObj('elevator-1',10,28));objs.push(mkObj('elevator-1',12,28))
  objs.push(mkObj('vending-machine',9,31));objs.push(mkObj('bench',12,31))
  for(let i=0;i<8;i++){const gx=8+i*8;objs.push(mkObj('double-bed-1',gx+2,10));objs.push(mkObj('toilet',gx+1,19));objs.push(mkObj('washbasin',gx+3,19));objs.push(mkObj('shower',gx+5,19));objs.push(mkObj('chair',gx+4,14))}
  for(let s of [16,24,32,40,48,56,64]){objs.push(mkObj('double-bed-1',s+2,33));objs.push(mkObj('toilet',s+1,27));objs.push(mkObj('washbasin',s+3,27));objs.push(mkObj('shower',s+5,27));objs.push(mkObj('chair',s+4,31))}
  return {ts,objs,spawnZones:[{id:`z-g${label}`,label:`Floor ${label} rooms`,x:160,y:160,w:1280,h:680,roleIds:['role-guest']}]}
}
function suitesFloor(){
  const ts=emptyStates()
  outerWalls(ts,[])
  line(ts,8,23,71,23)
  line(ts,14,26,71,26)
  for(let gx of [20,32,44,56])line(ts,gx,8,gx,23)
  for(let gx of [16,28,40,52])line(ts,gx,26,gx,41)
  for(let x of [14,26,38,50])setDoor(ts,x,23)
  for(let x of [19,31,43])setDoor(ts,x,26)
  line(ts,14,26,14,33);line(ts,8,33,14,33)
  const objs=[]
  objs.push(mkObj('elevator-1',10,28));objs.push(mkObj('elevator-1',12,28))
  objs.push(mkObj('vending-machine',9,31));objs.push(mkObj('bench',12,31))
  const north=[8,20,32,44],south=[16,28,40]
  for(let gx of north){objs.push(mkObj('double-bed-1',gx+4,12));objs.push(mkObj('sofa-1',gx+4,16));objs.push(mkObj('table-1',gx+5,18));objs.push(mkObj('bathtub',gx+1,20));objs.push(mkObj('toilet',gx+3,20));objs.push(mkObj('washbasin',gx+5,20));objs.push(mkObj('shower',gx+7,20))}
  for(let gx of south){objs.push(mkObj('double-bed-1',gx+4,33));objs.push(mkObj('sofa-1',gx+4,30));objs.push(mkObj('table-1',gx+5,28));objs.push(mkObj('bathtub',gx+1,27));objs.push(mkObj('toilet',gx+3,27));objs.push(mkObj('washbasin',gx+5,27));objs.push(mkObj('shower',gx+7,27))}
  for(let x of [58,64])objs.push(mkObj('table-set',x,10))
  for(let x of [58,64])objs.push(mkObj('table-set',x,36))
  objs.push(mkObj('bar-counter',62,28))
  objs.push(mkObj('sofa-1',58,20));objs.push(mkObj('table-1',60,20))
  return {ts,objs,spawnZones:[{id:'z-s16',label:'Suites',x:160,y:160,w:1280,h:680,roleIds:['role-guest']}]}
}
const builders={'floor-f6bc12edb3':lobbyFloor,'floor-1-dining':diningFloor,'floor-2-events':eventsFloor,'floor-3-wellness':wellnessFloor,'floor-4-club':clubFloor,'floor-5-5':()=>guestFloor(5),'floor-6-6':()=>guestFloor(6),'floor-7-7':()=>guestFloor(7),'floor-8-8':()=>guestFloor(8),'floor-9-9':()=>guestFloor(9),'floor-10-10':()=>guestFloor(10),'floor-11-11':()=>guestFloor(11),'floor-12-12':()=>guestFloor(12),'floor-13-13':()=>guestFloor(13),'floor-14-14':()=>guestFloor(14),'floor-15-15':()=>guestFloor(15),'floor-16-suites':suitesFloor}
for(const floor of j.layout.floors){const fn=builders[floor.id];if(!fn){console.log('skip',floor.id);continue}const{ts,objs,spawnZones}=fn();floor.objects=objs;floor.walkable={walkableGrid:ts.map(r=>r.map(v=>v!=='blocked')),tileStates:ts};floor.spawnZones=spawnZones;console.log(floor.id,'objs',objs.length)}
writeFileSync(p,JSON.stringify(j,null,2),'utf-8');console.log('done')
