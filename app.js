/* FreezePods v2: visual game builder, safe block interpreter, simulation + experimental micro:bit BLE */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const S={playing:false,run:0,score:0,round:0,hits:0,last:null,target:-1,devices:[],colors:['off','off','off','off'],mode:'simulation',pending:null,vars:new Map()};
const COLORS={red:'#ef5961',green:'#39d27a',blue:'#4f8cf7',yellow:'#f5c344',purple:'#ad73ed',orange:'#fa943b',white:'#ffffff',off:'#d7e1eb'};
const UUID={buttons:'e95d9882-251d-470a-a062-fa1922dfa9a8',a:'e95dda90-251d-470a-a062-fa1922dfa9a8',b:'e95dda91-251d-470a-a062-fa1922dfa9a8',leds:'e95dd91d-251d-470a-a062-fa1922dfa9a8',matrix:'e95d7b77-251d-470a-a062-fa1922dfa9a8'};
const pods=[...document.querySelectorAll('.pod')];let ws;

let audioContext=null;
let soundEnabled=true;
function ensureAudio(){
 if(!soundEnabled)return null;
 const AudioCtor=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtor)return null;
 if(!audioContext)audioContext=new AudioCtor();
 if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
 return audioContext;
}
function tone(freq,ms=140,kind='sine',at=0,volume=.095){
 if(!soundEnabled)return;
 try{
  const ctx=ensureAudio();if(!ctx)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  const start=ctx.currentTime+at;
  osc.type=kind;osc.frequency.setValueAtTime(freq,start);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),start+.015);
  gain.gain.exponentialRampToValueAtTime(.0001,start+Math.max(.04,ms/1000));
  osc.connect(gain).connect(ctx.destination);osc.start(start);osc.stop(start+Math.max(.06,ms/1000)+.03);
 }catch(error){log('Audio unavailable: '+error.message);}
}
function sound(name){
 switch(name){
  case 'beep':tone(660,135);break;
  case 'start':tone(523,110,'sine',0);tone(784,160,'sine',.12);break;
  case 'success':tone(659,100,'sine',0);tone(880,210,'sine',.12);break;
  case 'miss':tone(260,150,'triangle',0);tone(190,210,'triangle',.15);break;
  case 'level':tone(440,90,'sine',0);tone(660,100,'sine',.12);tone(880,220,'sine',.25);break;
  case 'tick':tone(470,75,'triangle');break;
  case 'timeup':tone(245,260,'sawtooth',0,.055);break;
  default:break;
 }
}
function soundOn(){return soundEnabled;}

function status(s){$('status').textContent=s;}
function log(s){let li=document.createElement('li');li.textContent=s;$('log').prepend(li);while($('log').children.length>60)$('log').lastChild.remove();}
function stats(){$('score').textContent=S.score;$('round').textContent=S.round;$('hits').textContent=S.hits;$('reaction').textContent=S.last?.ms==null?'—':Math.round(S.last.ms)+' ms';}
function on(token){return S.playing&&token===S.run;}
function paint(i,color){
  if(i<0||i>3)return;
  color=COLORS[color]?color:'green';S.colors[i]=color;
  const b=pods[i],led=b.querySelector('.led');b.classList.toggle('active',color!=='off');
  b.style.borderColor=color==='off'?'':COLORS[color];b.style.backgroundColor=color==='off'?'':COLORS[color]+'22';
  led.style.backgroundColor=COLORS[color];led.style.borderColor=color==='off'?'':'#ffffff88';
  led.style.boxShadow=color==='off'?'':'0 0 24px '+COLORS[color]+'aa';
  const info=S.devices[i];
  if(S.mode==='hardware'&&info?.matrix&&info.ready)enqueueLed(i,color);
}
// Serialize writes on each GATT characteristic; otherwise consecutive rounds can race.
// Each micro:bit has its own queue so four devices can update independently.
const LED_OFF=new Uint8Array([0,0,0,0,0]);
const LED_ON=new Uint8Array([14,31,31,31,14]);
function enqueueLed(i,color){
 const info=S.devices[i];if(!info?.matrix||!info.device?.gatt?.connected)return Promise.resolve(false);
 const payload=color==='off'?LED_OFF:LED_ON;
 info.ledWrites=(info.ledWrites||Promise.resolve()).catch(()=>{}).then(async()=>{
  if(S.devices[i]!==info||!info.device.gatt.connected)return false;
  try{
   if(info.matrix.properties.write&&info.matrix.writeValueWithResponse)await info.matrix.writeValueWithResponse(payload);
   else if(info.matrix.properties.writeWithoutResponse&&info.matrix.writeValueWithoutResponse)await info.matrix.writeValueWithoutResponse(payload);
   else await info.matrix.writeValue(payload);
   return true;
  }catch(err){
   log('Pod '+(i+1)+' LED write failed: '+err.message);
   connectionStage('Pod '+(i+1)+' LED write failed: '+err.message);
   throw err;
  }
 });
 return info.ledWrites;
}
async function testLeds(){
 if(S.playing){status('Stop the game before testing LEDs.');return;}
 if(S.mode!=='hardware'){status('Select micro:bit Bluetooth mode to test physical LEDs.');return;}
 const ready=connectedIndices();
 if(!ready.length){status('Connect a micro:bit first.');return;}
 const button=$('test-leds');button.disabled=true;
 try{
  const idx=Number($('test-pod')?.value??-1);
  const indices=idx===-1?ready:ready.filter(i=>i===idx);
  if(!indices.length)throw Error('Selected pod is not connected.');
  for(const i of indices){
   const info=S.devices[i];
   if(!info.matrix){log('Pod '+(i+1)+' has no LED matrix characteristic.');continue;}
   status('Testing Pod '+(i+1)+' LED matrix…');
   await enqueueLed(i,'off');
   await new Promise(resolve=>setTimeout(resolve,300));
   await enqueueLed(i,'green');
   const reads=info.matrix.properties.read;
   if(reads){
    try{
     const value=await info.matrix.readValue();
     log('Pod '+(i+1)+' LED readback: '+Array.from({length:Math.min(5,value.byteLength)},(_,k)=>value.getUint8(k)).join(', '));
    }catch(err){log('Pod '+(i+1)+' LED readback not available: '+err.message);}
   }
   await new Promise(resolve=>setTimeout(resolve,1600));
   await enqueueLed(i,'off');
   log('Pod '+(i+1)+' LED on/off write sequence completed. Check physical LEDs.');
  }
  status('LED test commands completed. Did the micro:bit lights visibly change?');
 }catch(err){status('LED test failed: '+err.message);log('LED test: '+err.message);}
 finally{button.disabled=false;}
}

function clear(){for(let i=0;i<4;i++)paint(i,'off');S.target=-1;}
function resolvePress(i){
  if(!S.playing||!S.pending)return;
  if(S.mode==='hardware'&&!connectedIndices().includes(i))return;
  const fn=S.pending;S.pending=null;fn({index:i,ms:performance.now()-S.targetAt});
}
pods.forEach((b,i)=>b.addEventListener('click',()=>resolvePress(i)));
document.addEventListener('keydown',e=>{if(e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.closest('.blocklyWidgetDiv'))return;if('1234'.includes(e.key)&&e.key.length===1)resolvePress(Number(e.key)-1);});
function connectedIndices(){return [0,1,2,3].filter(i=>S.devices[i]?.device?.gatt?.connected&&S.devices[i]?.ready);}
function playableIndices(){return S.mode==='hardware'?connectedIndices():[0,1,2,3];}
function randomIndex(){const indices=playableIndices();if(!indices.length)throw Error('Connect at least one micro:bit, or switch to Simulation.');return indices[Math.floor(Math.random()*indices.length)];}
function requireConnected(i){if(S.mode==='hardware'&&!connectedIndices().includes(i))throw Error('Pod '+(i+1)+' is not connected. Use a connected pod or a random pod.');}
let bluetoothStage='';
function connectionStage(message){bluetoothStage=message;const el=$('device-diagnostics');if(el)el.textContent=message;log('BLE: '+message);}
function updateConnections(){
 const tester=$('test-leds');if(tester)tester.disabled=S.playing||!connectedIndices().length;
 const selector=$('test-pod');if(selector){const prev=selector.value;selector.innerHTML='';const all=document.createElement('option');all.value='-1';all.textContent='All connected';selector.appendChild(all);for(const i of connectedIndices()){const o=document.createElement('option');o.value=String(i);o.textContent='Pod '+(i+1);selector.appendChild(o);}selector.value=[...selector.options].some(o=>o.value===prev)?prev:'-1';}
 const ready=connectedIndices();
 $('devices').textContent=ready.length+' micro:bit'+(ready.length===1?'':'s')+' ready'+(ready.length?' (Pod '+ready.map(i=>i+1).join(', ')+')':'');
 for(let i=0;i<4;i++){
  const connected=ready.includes(i), b=pods[i];
  b.querySelector('small').textContent=S.mode==='hardware'?(connected?'Connected · A/B to press':'Not connected'):'Click to press';
  b.classList.toggle('disconnected',S.mode==='hardware'&&!connected);
 }
 const diag=$('device-diagnostics');
 if(diag)diag.textContent=bluetoothStage||(ready.length?'Ready for hardware testing with '+ready.length+' micro:bit'+(ready.length===1?'':'s')+'. Random targets use connected devices only.':'No micro:bits ready. Select Connect micro:bit to pair and initialize Bluetooth services.');
}
function switchMode(){S.mode=$('mode').value;$('connect').hidden=S.mode!=='hardware';$('connect').disabled=S.playing;updateConnections();}
$('mode').addEventListener('change',switchMode);
$('test-leds')?.addEventListener('click',testLeds);
$('connect').addEventListener('click',async()=>{
 if(!navigator.bluetooth){status('Web Bluetooth requires Chrome/Edge, enabled Bluetooth, and HTTPS.');return;}
 if(connectedIndices().length>=4){status('Four devices already connected.');return;}
 const button=$('connect');button.disabled=true;let device=null;
 try{
  connectionStage('Step 1/4: Waiting for Chrome device selection…');status('Choose a BBC micro:bit in Chrome’s Bluetooth device picker…');
  device=await navigator.bluetooth.requestDevice({filters:[{namePrefix:'BBC micro:bit'}],optionalServices:[UUID.buttons,UUID.leds]});
  connectionStage('Step 2/4: Chrome selected '+(device.name||'micro:bit')+'. Connecting to its GATT server…');
  const existing=S.devices.findIndex(d=>d?.device?.id===device.id&&d.device.gatt.connected&&d.ready);
  if(existing!==-1){status('That micro:bit is already ready as Pod '+(existing+1)+'.');return;}
  status('Bluetooth device selected. Connecting to GATT services…');
  const server=await device.gatt.connect();
  connectionStage('Step 3/4: BLE connected. Looking for the Button Service in the micro:bit firmware…');
  // The button service is essential; LED service is optional for diagnostics.
  let buttons;
  try{buttons=await server.getPrimaryService(UUID.buttons);}catch(error){throw Error('GATT connected, but the Button Service is missing or inaccessible. Flash MakeCode firmware that calls bluetooth.startButtonService() and bluetooth.startLEDService(), then reset the micro:bit. Technical detail: '+error.message);}
  const index=[0,1,2,3].find(i=>!S.devices[i]?.device?.gatt?.connected||!S.devices[i]?.ready);
  if(index===undefined){status('All four slots are occupied.');return;}
  const info={device,matrix:null,ready:false};
  S.devices[index]=info;
  device.addEventListener('gattserverdisconnected',()=>{
   if(S.devices[index]?.device!==device)return;
   S.devices[index]=null;updateConnections();log('Pod '+(index+1)+' disconnected');
   if(S.playing&&S.mode==='hardware'){stop();status('Pod '+(index+1)+' disconnected. Game stopped.');}
  });
  let subscribed=0;
  for(const uuid of [UUID.a,UUID.b]){
   try{
    const ch=await buttons.getCharacteristic(uuid);
    await ch.startNotifications();
    ch.addEventListener('characteristicvaluechanged',e=>{
      const state=e.target.value.getUint8(0);
      if(state!==1)return;
      if(!S.playing){
       status('Button press received from Pod '+(index+1)+'. Input works!');
       log('Pod '+(index+1)+' button press detected');
      }else resolvePress(index);
    });
    subscribed++;
   }catch(err){log('Button characteristic unavailable: '+err.message);}
  }
  if(!subscribed)throw Error('Button service found but Button A/B notifications unavailable. Check micro:bit firmware and Bluetooth permissions.');
  info.ready=true;
  info.ledWrites=Promise.resolve();
  connectionStage('Step 4/4: Button notifications active. Checking LED matrix…');
  updateConnections();
  log('Pod '+(index+1)+': Bluetooth button input ready');
  try{
   const leds=await server.getPrimaryService(UUID.leds);
   info.matrix=await leds.getCharacteristic(UUID.matrix);
   log('Pod '+(index+1)+' LED matrix characteristics: '+JSON.stringify({read:info.matrix.properties.read,write:info.matrix.properties.write,writeWithoutResponse:info.matrix.properties.writeWithoutResponse}));
   connectionStage('Pod '+(index+1)+' ready: Button input ✓ · LED output ✓. Press A/B to verify input.');
   status('Pod '+(index+1)+' connected. Button input and LED output ready! Press button A or B to test.');
   log('Pod '+(index+1)+': LED matrix available');
  }catch(err){
   info.matrix=null;
   connectionStage('Pod '+(index+1)+' ready: Button input ✓ · LED output unavailable. Firmware needs bluetooth.startLEDService().');
   status('Pod '+(index+1)+' connected for button input, but LED matrix service unavailable. Check firmware/MakeCode Bluetooth services.');
   log('Pod '+(index+1)+': LED service unavailable: '+err.message);
  }
 }catch(err){
  status('Connection incomplete: '+err.message);
  connectionStage('Setup stopped: '+err.message);
  log('Bluetooth setup failed: '+err.message);
  if(device){for(let i=0;i<4;i++)if(S.devices[i]?.device?.id===device.id&&!S.devices[i]?.ready)S.devices[i]=null;updateConnections();}
 }finally{button.disabled=S.playing;}
});
if(!window.Blockly){status('Blockly failed to load. Please reload with an internet connection.');return;}
Blockly.defineBlocksWithJsonArray([
 {type:'game_start',message0:'when game starts %1 %2',args0:[{type:'input_dummy'},{type:'input_statement',name:'DO'}],colour:35},
 {type:'repeat_rounds',message0:'repeat %1 rounds %2 %3',args0:[{type:'field_number',name:'COUNT',value:8,min:1,max:30,precision:1},{type:'input_dummy'},{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:225},
 {type:'light_random',message0:'light up random pod',previousStatement:null,nextStatement:null,colour:145},
 {type:'light_specific',message0:'light up pod %1',args0:[{type:'field_dropdown',name:'POD',options:[['1','0'],['2','1'],['3','2'],['4','3']]}],previousStatement:null,nextStatement:null,colour:145},
 {type:'pod_color',message0:'set pod %1 color to %2',args0:[{type:'input_value',name:'POD',check:'Number'},{type:'field_dropdown',name:'COLOR',options:[['red','red'],['green','green'],['blue','blue'],['yellow','yellow'],['purple','purple'],['orange','orange'],['white','white'],['off','off']]}],previousStatement:null,nextStatement:null,colour:145,tooltip:'Pod numbers start at 1. Micro:bit onboard LEDs cannot produce RGB colors; simulation shows colors.'},
 {type:'pod_random',message0:'random pod number',output:'Number',colour:145},
 {type:'pods_all_color',message0:'set all pods color to %1',args0:[{type:'field_dropdown',name:'COLOR',options:[['red','red'],['green','green'],['blue','blue'],['yellow','yellow'],['purple','purple'],['orange','orange'],['white','white'],['off','off']]}],previousStatement:null,nextStatement:null,colour:145},
 {type:'pod_wait_specific',message0:'wait for pod %1 press (max %2 ms)',args0:[{type:'field_dropdown',name:'POD',options:[['1','0'],['2','1'],['3','2'],['4','3']]},{type:'field_number',name:'MS',value:3000,min:100,max:15000,precision:100}],previousStatement:null,nextStatement:null,colour:205},
 {type:'pod_last_pressed',message0:'last pressed pod',output:'Number',colour:205},
 {type:'pod_correct',message0:'last press was correct',output:'Boolean',colour:205},
 {type:'wait_press',message0:'wait for button press (max %1 ms)',args0:[{type:'field_number',name:'MS',value:3000,min:100,max:15000,precision:100}],previousStatement:null,nextStatement:null,colour:205},
 {type:'score_response',message0:'score correct + %1 wrong / timeout %2',args0:[{type:'field_number',name:'RIGHT',value:10,min:-1000,max:1000},{type:'field_number',name:'WRONG',value:-5,min:-1000,max:1000}],previousStatement:null,nextStatement:null,colour:285},
 {type:'score_change',message0:'change score by %1',args0:[{type:'input_value',name:'VALUE',check:'Number'}],previousStatement:null,nextStatement:null,colour:285},
 {type:'score_value',message0:'current score',output:'Number',colour:285},
 {type:'clear_pods',message0:'turn off all pods',previousStatement:null,nextStatement:null,colour:145},
 {type:'pause_ms',message0:'wait %1 milliseconds',args0:[{type:'input_value',name:'MS',check:'Number'}],previousStatement:null,nextStatement:null,colour:205},
 {type:'game_message',message0:'show message %1',args0:[{type:'input_value',name:'TEXT'}],previousStatement:null,nextStatement:null,colour:35},
 {type:'game_stop',message0:'end game',previousStatement:null,nextStatement:null,colour:35},
 {type:'sound_play',message0:'play sound %1',args0:[{type:'field_dropdown',name:'SOUND',options:[['beep','beep'],['start','start'],['success','success'],['miss','miss'],['level up','level'],['tick','tick'],['time up','timeup']]}],previousStatement:null,nextStatement:null,colour:315},
 {type:'countdown',message0:'countdown from %1 seconds',args0:[{type:'field_number',name:'SECONDS',value:3,min:1,max:10,precision:1}],previousStatement:null,nextStatement:null,colour:315},
 {type:'flash_pod',message0:'flash pod %1 %2 for %3 ms',args0:[{type:'input_value',name:'POD',check:'Number'},{type:'field_dropdown',name:'COLOR',options:[['green','green'],['red','red'],['blue','blue'],['yellow','yellow'],['purple','purple'],['white','white']]},{type:'field_number',name:'MS',value:400,min:100,max:5000,precision:100}],previousStatement:null,nextStatement:null,colour:145},
 {type:'wait_random',message0:'wait random time between %1 and %2 ms',args0:[{type:'field_number',name:'MIN',value:500,min:0,max:30000,precision:100},{type:'field_number',name:'MAX',value:1500,min:0,max:30000,precision:100}],previousStatement:null,nextStatement:null,colour:205},
 {type:'feedback_last',message0:'celebrate if correct, otherwise play miss',previousStatement:null,nextStatement:null,colour:315},

 {type:'sequence_random',message0:'random sequence of %1 pods',args0:[{type:'input_value',name:'LENGTH',check:'Number'}],output:'Array',colour:55},
 {type:'sequence_show',message0:'show sequence %1 each for %2 ms',args0:[{type:'input_value',name:'SEQUENCE',check:'Array'},{type:'field_number',name:'MS',value:600,min:100,max:4000,precision:100}],previousStatement:null,nextStatement:null,colour:55},
 {type:'sequence_check',message0:'player repeats sequence %1 (timeout %2 ms each)',args0:[{type:'input_value',name:'SEQUENCE',check:'Array'},{type:'field_number',name:'MS',value:3000,min:100,max:15000,precision:100}],previousStatement:null,nextStatement:null,colour:55},
 {type:'list_push',message0:'add %1 to list %2',args0:[{type:'input_value',name:'ITEM'},{type:'input_value',name:'LIST',check:'Array'}],previousStatement:null,nextStatement:null,colour:55},
 {type:'list_match',message0:'list %1 equals list %2',args0:[{type:'input_value',name:'A',check:'Array'},{type:'input_value',name:'B',check:'Array'}],output:'Boolean',colour:55}
]);
const block=t=>({kind:'block',type:t});
const toolbox={kind:'categoryToolbox',contents:[
 {kind:'category',name:'Game',colour:'#bb7a31',contents:['game_start','repeat_rounds','game_message','game_stop'].map(block)},
 {kind:'category',name:'Pods & Colors',colour:'#329067',contents:['light_random','light_specific','pod_color','flash_pod','pods_all_color','pod_random','clear_pods'].map(block)},
 {kind:'category',name:'Inputs & Timing',colour:'#3777bd',contents:['wait_press','pod_wait_specific','pod_last_pressed','pod_correct','pause_ms','wait_random'].map(block)},
 {kind:'category',name:'Sounds & Effects',colour:'#bb5292',contents:['sound_play','countdown','feedback_last'].map(block)},
 {kind:'category',name:'Scoring',colour:'#995cb7',contents:['score_response','score_change','score_value'].map(block)},
 {kind:'category',name:'Memory & Lists',colour:'#bb8741',contents:['sequence_random','sequence_show','sequence_check','list_push','list_match','lists_create_with','lists_length','lists_getIndex'].map(block)},
 {kind:'category',name:'Logic',colour:'#5386c4',contents:['controls_if','logic_compare','logic_operation','logic_negate','logic_boolean','logic_null'].map(block)},
 {kind:'category',name:'Loops',colour:'#4597a8',contents:['controls_repeat_ext','controls_whileUntil'].map(block)},
 {kind:'category',name:'Math',colour:'#5a77c2',contents:['math_number','math_arithmetic','math_random_int','math_modulo','math_single'].map(block)},
 {kind:'category',name:'Text',colour:'#4a9986',contents:['text','text_join'].map(block)},
 {kind:'category',name:'Variables',custom:'VARIABLE',colour:'#a067b3'}
]};
ws=Blockly.inject('blockly',{toolbox,trashcan:true,scrollbars:true,zoom:{controls:true,wheel:true,startScale:.84,maxScale:1.4,minScale:.45},move:{scrollbars:true,drag:true,wheel:true}});
window.addEventListener('resize',()=>Blockly.svgResize(ws));
const reactionXml='<xml xmlns="https://developers.google.com/blockly/xml"><block type="game_start" x="30" y="35"><statement name="DO"><block type="repeat_rounds"><field name="COUNT">8</field><statement name="DO"><block type="light_random"><next><block type="wait_press"><field name="MS">3000</field><next><block type="score_response"><field name="RIGHT">10</field><field name="WRONG">-5</field><next><block type="clear_pods"><next><block type="pause_ms"><value name="MS"><shadow type="math_number"><field name="NUM">600</field></shadow></value></block></next></block></next></block></next></block></next></block></statement></block></statement></block></xml>';
const memoryXml='<xml xmlns="https://developers.google.com/blockly/xml"><variables><variable id="seqvar">sequence</variable></variables><block type="game_start" x="30" y="35"><statement name="DO"><block type="repeat_rounds"><field name="COUNT">5</field><statement name="DO"><block type="variables_set"><field name="VAR" id="seqvar">sequence</field><value name="VALUE"><block type="sequence_random"><value name="LENGTH"><shadow type="math_number"><field name="NUM">3</field></shadow></value></block></value><next><block type="sequence_show"><field name="MS">600</field><value name="SEQUENCE"><block type="variables_get"><field name="VAR" id="seqvar">sequence</field></block></value><next><block type="sequence_check"><field name="MS">3000</field><value name="SEQUENCE"><block type="variables_get"><field name="VAR" id="seqvar">sequence</field></block></value><next><block type="score_response"><field name="RIGHT">20</field><field name="WRONG">-5</field><next><block type="clear_pods"><next><block type="pause_ms"><value name="MS"><shadow type="math_number"><field name="NUM">800</field></shadow></value></block></next></block></next></block></next></block></next></block></next></block></statement></block></statement></block></xml>';
function template(xml,label){if(S.playing)return;ws.clear();Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml),ws);status(label+' loaded. Press Play.');}
$('example').textContent='Reaction game';$('example').addEventListener('click',()=>template(reactionXml,'Reaction game'));template(reactionXml,'Reaction game');
const memoryBtn=document.createElement('button');memoryBtn.id='memory';memoryBtn.type='button';memoryBtn.textContent='Memory game';$('example').after(memoryBtn);memoryBtn.addEventListener('click',()=>template(memoryXml,'Memory game'));
$('save').addEventListener('click',()=>{const output={format:'freezepods-blockly-v2',workspace:Blockly.serialization.workspaces.save(ws)},blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-freezepods-game.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);});
$('load').addEventListener('click',()=>$('file').click());
$('file').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f||S.playing)return;try{const json=JSON.parse(await f.text());if(!['freezepods-blockly-v1','freezepods-blockly-v2'].includes(json.format)||!json.workspace)throw Error('Unrecognized project file');ws.clear();Blockly.serialization.workspaces.load(json.workspace,ws);status('Game loaded.');}catch(err){status('Load failed: '+err.message);}});
function numeric(x,fallback=0){const n=Number(x);return Number.isFinite(n)?n:fallback;}
function value(b,input,budget){return evaluate(b.getInputTargetBlock(input),budget);}
function evaluate(b,budget){
 if(!b)return 0;if(++budget.steps>10000)throw Error('Game instruction limit exceeded.');
 const t=b.type,f=n=>b.getFieldValue(n),v=n=>value(b,n,budget);
 switch(t){
  case 'math_number':return numeric(f('NUM'));
  case 'text':return f('TEXT')||'';
  case 'logic_boolean':return f('BOOL')==='TRUE';
  case 'logic_null':return null;
  case 'variables_get':return S.vars.get(f('VAR'))??0;
  case 'math_random_int':{const a=Math.floor(numeric(v('FROM'))),z=Math.floor(numeric(v('TO'))),lo=Math.min(a,z),hi=Math.max(a,z);return lo+Math.floor(Math.random()*(hi-lo+1));}
  case 'pod_random':return randomIndex()+1;
  case 'pod_last_pressed':return S.last?.index>=0?S.last.index+1:0;
  case 'pod_correct':return Boolean(S.last?.correct);
  case 'score_value':return S.score;
  case 'math_arithmetic':{const a=numeric(v('A')),c=numeric(v('B'));switch(f('OP')){case 'ADD':return a+c;case 'MINUS':return a-c;case 'MULTIPLY':return a*c;case 'DIVIDE':return c===0?0:a/c;case 'POWER':return Math.pow(a,c)||0;}return 0;}
  case 'math_modulo':{const a=numeric(v('DIVIDEND')),d=numeric(v('DIVISOR'));return d?a%d:0;}
  case 'math_single':{const a=numeric(v('NUM'));switch(f('OP')){case 'ABS':return Math.abs(a);case 'ROOT':return Math.sqrt(Math.max(0,a));case 'NEG':return -a;case 'LN':return a>0?Math.log(a):0;case 'LOG10':return a>0?Math.log10(a):0;case 'EXP':return Math.exp(a);case 'POW10':return 10**a;}return a;}
  case 'logic_compare':{const a=v('A'),z=v('B');switch(f('OP')){case 'EQ':return a===z;case 'NEQ':return a!==z;case 'LT':return a<z;case 'LTE':return a<=z;case 'GT':return a>z;case 'GTE':return a>=z;}return false;}
  case 'logic_operation':return f('OP')==='AND'?Boolean(v('A'))&&Boolean(v('B')):Boolean(v('A'))||Boolean(v('B'));
  case 'logic_negate':return !Boolean(v('BOOL'));
  case 'lists_create_with':return [...Array(b.itemCount_||0)].map((_,i)=>v('ADD'+i));
  case 'lists_length':{const a=v('VALUE');return Array.isArray(a)||typeof a==='string'?a.length:0;}
  case 'lists_getIndex':{const a=v('VALUE');if(!Array.isArray(a))return 0;const at=f('WHERE');let i=at==='FIRST'?0:at==='LAST'?a.length-1:at==='FROM_END'?a.length-1-numeric(v('AT'),1)+1:at==='RANDOM'?Math.floor(Math.random()*a.length):numeric(v('AT'),1)-1;i=Math.floor(i);return f('MODE')==='GET_REMOVE'?a.splice(i,1)[0]:f('MODE')==='REMOVE'?(a.splice(i,1),0):a[i]??0;}
  case 'list_match':return JSON.stringify(v('A'))===JSON.stringify(v('B'));
  case 'text_join':return [...Array(b.itemCount_||0)].map((_,i)=>String(v('ADD'+i))).join('');
  case 'sequence_random':return Array.from({length:Math.max(1,Math.min(20,Math.floor(numeric(v('LENGTH'),3))))},()=>randomIndex()+1);
  default:throw Error('Unsupported value block: '+t);
 }
}
async function sleepCancelable(ms,token){const until=performance.now()+Math.max(0,Math.min(30000,numeric(ms)));while(on(token)&&performance.now()<until)await wait(Math.max(1,Math.min(50,until-performance.now())));}
async function receive(ms,token){
 if(!on(token))return null;
 S.targetAt=performance.now();
 let done;const promise=new Promise(resolve=>{done=resolve;S.pending=resolve;});
 const timer=setTimeout(()=>{if(S.pending===done){S.pending=null;done(null);}},Math.max(100,Math.min(15000,numeric(ms,3000))));
 const result=await promise;clearTimeout(timer);return on(token)?result:null;
}
async function perform(first,token,budget){
 let b=first;
 while(b&&on(token)){
  if(++budget.steps>10000)throw Error('Game instruction limit exceeded. Shorten loops.');
  if(performance.now()-budget.start>120000)throw Error('Maximum 2-minute session reached.');
  const t=b.type,f=n=>b.getFieldValue(n),v=n=>value(b,n,budget);
  switch(t){
   case 'repeat_rounds':{const count=Math.max(1,Math.min(30,Math.floor(numeric(f('COUNT'),8))));for(let i=0;i<count&&on(token);i++){S.round++;stats();await perform(b.getInputTargetBlock('DO'),token,budget);}break;}
   case 'controls_repeat_ext':{const n=Math.max(0,Math.min(100,Math.floor(numeric(v('TIMES')))));for(let i=0;i<n&&on(token);i++)await perform(b.getInputTargetBlock('DO'),token,budget);break;}
   case 'controls_whileUntil':{let iterations=0;while(on(token)&&(f('MODE')==='WHILE'?Boolean(v('BOOL')):!Boolean(v('BOOL')))){if(++iterations>100)throw Error('Loop exceeded 100 iterations.');await perform(b.getInputTargetBlock('DO'),token,budget);await wait(0);}break;}
   case 'controls_if':{let executed=false;for(let i=0;i<(b.elseifCount_||0)+1;i++){if(Boolean(v('IF'+i))){await perform(b.getInputTargetBlock('DO'+i),token,budget);executed=true;break;}}if(!executed&&b.elseCount_)await perform(b.getInputTargetBlock('ELSE'),token,budget);break;}
   case 'variables_set':S.vars.set(f('VAR'),v('VALUE'));break;
   case 'math_change':S.vars.set(f('VAR'),numeric(S.vars.get(f('VAR')))+numeric(v('DELTA')));break;
   case 'light_random':{clear();const i=randomIndex();S.target=i;paint(i,'green');status('Pod '+(i+1)+' is lit. Press it!');log('Target: '+(i+1));break;}
   case 'light_specific':{clear();const i=Number(f('POD'));requireConnected(i);S.target=i;paint(i,'green');status('Pod '+(i+1)+' is lit.');break;}
   case 'pod_color':{const i=Math.floor(numeric(v('POD')))-1;requireConnected(i);paint(i,f('COLOR'));if(i>=0&&i<=3)S.target=i;break;}
   case 'pods_all_color':for(const i of playableIndices())paint(i,f('COLOR'));break;
   case 'clear_pods':clear();break;
   case 'pod_wait_specific':{const selected=Number(f('POD'));requireConnected(selected);const press=await receive(numeric(f('MS'),3000),token);if(!on(token))break;S.last=press?{...press,correct:press.index===selected}:{index:-1,ms:null,correct:false};stats();log(press?'Pod '+(press.index+1)+' pressed':'Timed out');break;}
   case 'wait_press':{const press=await receive(numeric(f('MS'),3000),token);if(!on(token))break;S.last=press?{...press,correct:press.index===S.target}:{index:-1,ms:null,correct:false};stats();log(press?'Pod '+(press.index+1)+' pressed in '+Math.round(press.ms)+' ms':'Timed out');break;}
   case 'score_response':{if(S.last){const points=numeric(f(S.last.correct?'RIGHT':'WRONG'));S.score+=points;if(S.last.correct)S.hits++;stats();log('Score '+(points>=0?'+':'')+points);}break;}
   case 'score_change':S.score+=numeric(v('VALUE'));stats();break;
   case 'pause_ms':await sleepCancelable(v('MS'),token);break;
   case 'game_message':{const message=String(v('TEXT')).slice(0,160);status(message);log(message);break;}
   case 'game_stop':stop();break;

   case 'sound_play':sound(f('SOUND'));break;
   case 'feedback_last':sound(S.last?.correct?'success':'miss');break;
   case 'countdown':{
    const seconds=Math.max(1,Math.min(10,Math.floor(numeric(f('SECONDS'),3))));
    for(let n=seconds;n>=1&&on(token);n--){
     status('Get ready… '+n);
     sound('tick');
     await sleepCancelable(1000,token);
    }
    if(on(token)){sound('start');status('GO!');}
    break;
   }
   case 'flash_pod':{
    const i=Math.floor(numeric(v('POD')))-1;
    requireConnected(i);if(i<0||i>3)throw Error('Pod numbers must be 1–4');
    paint(i,f('COLOR'));await sleepCancelable(numeric(f('MS'),400),token);paint(i,'off');
    break;
   }
   case 'wait_random':{
    const lo=Math.max(0,Math.min(30000,numeric(f('MIN'),500))),hi=Math.max(lo,Math.min(30000,numeric(f('MAX'),1500)));
    await sleepCancelable(lo+Math.floor(Math.random()*(hi-lo+1)),token);break;
   }

   case 'sequence_show':{const seq=v('SEQUENCE');if(!Array.isArray(seq))throw Error('Show sequence needs a list.');status('Remember the sequence!');for(const number of seq.slice(0,20)){if(!on(token))break;clear();paint(Math.floor(numeric(number))-1,'blue');await sleepCancelable(numeric(f('MS'),600),token);clear();await sleepCancelable(160,token);}break;}
   case 'sequence_check':{const seq=v('SEQUENCE');if(!Array.isArray(seq))throw Error('Check sequence needs a list.');status('Repeat the sequence in order!');let correct=true;let elapsed=0;for(const number of seq.slice(0,20)){const press=await receive(numeric(f('MS'),3000),token);if(!on(token))break;if(!press||press.index+1!==Number(number)){correct=false;break;}elapsed+=press.ms;paint(press.index,'green');await sleepCancelable(110,token);clear();}if(on(token)){S.last={index:-1,correct,ms:correct?elapsed:null};stats();log(correct?'Sequence correct!':'Sequence incorrect or timed out');}break;}
   case 'list_push':{const arr=v('LIST');if(!Array.isArray(arr))throw Error('Add to list needs a list variable.');if(arr.length>=100)throw Error('List limit is 100 items.');arr.push(v('ITEM'));break;}
   default:throw Error('Unsupported instruction: '+t);
  }
  b=b.getNextBlock();
 }
}
function finish(){clear();S.playing=false;S.pending=null;$('play').disabled=false;$('stop').disabled=true;$('mode').disabled=false;switchMode();}
function stop(){if(!S.playing)return;S.playing=false;S.run++;if(S.pending){const r=S.pending;S.pending=null;r(null);}finish();status('Game stopped.');log('Stopped');}
$('stop').addEventListener('click',stop);
$('play').addEventListener('click',async()=>{
 ensureAudio();
 if(S.playing)return;
 if(window.FreezePodsEditorMode==='javascript')return;
 const starts=ws.getTopBlocks(true).filter(b=>b.type==='game_start');
 if(starts.length!==1){status('Add exactly one "when game starts" block.');return;}
 if(S.mode==='hardware'&&connectedIndices().length===0){status('Connect at least one micro:bit first, or use Simulation.');return;}
 S.playing=true;const token=++S.run;S.score=0;S.round=0;S.hits=0;S.last=null;S.vars.clear();stats();$('play').disabled=true;$('stop').disabled=false;$('mode').disabled=true;$('connect').disabled=true;log('Game started');
 try{await perform(starts[0].getInputTargetBlock('DO'),token,{steps:0,start:performance.now()});if(on(token)){status('Game complete! Score: '+S.score);log('Game complete');}}
 catch(e){status('Game error: '+e.message);log(e.message);}
 finally{if(token===S.run)finish();}
});

// Limited host bridge for the isolated JavaScript teaching editor.
// Student code cannot directly access the DOM, device objects or Bluetooth handles.
window.FreezePodsBridge={
 start(){
  ensureAudio();
  if(S.playing)return null;
  if(S.mode==='hardware'&&connectedIndices().length===0){status('Connect at least one micro:bit first, or use Simulation.');return null;}
  S.playing=true;const token=++S.run;S.score=0;S.round=0;S.hits=0;S.last=null;S.vars.clear();stats();
  $('play').disabled=true;$('stop').disabled=false;$('mode').disabled=true;$('connect').disabled=true;log('JavaScript game started');status('JavaScript game running.');
  return token;
 },
 running(token){return on(token);},
 async command(token,cmd,args=[]){
  if(!on(token))throw Error('The game is not running.');
  const num=(n,d=0)=>Number.isFinite(Number(n))?Number(n):d;
  switch(cmd){
   case 'light':{const i=Math.floor(num(args[0]))-1;if(i<0||i>3)throw Error('Pod number must be 1–4');requireConnected(i);const color=String(args[1]||'green').toLowerCase();if(!COLORS[color])throw Error('Unknown color');paint(i,color);S.target=i;return true;}
   case 'all':{const color=String(args[0]||'off').toLowerCase();if(!COLORS[color])throw Error('Unknown color');for(const i of playableIndices())paint(i,color);return true;}
   case 'clear':clear();return true;
   case 'random':return randomIndex()+1;
   case 'pause':await sleepCancelable(Math.max(0,Math.min(30000,num(args[0]))),token);return true;
   case 'press':{const p=await receive(Math.max(100,Math.min(15000,num(args[0],3000))),token);if(!on(token))throw Error('Stopped');S.last=p?{...p,correct:p.index===S.target}:{index:-1,ms:null,correct:false};stats();return p?{pod:p.index+1,ms:Math.round(p.ms),correct:p.index===S.target}:null;}
   case 'score':S.score+=Math.max(-10000,Math.min(10000,num(args[0])));stats();return S.score;
   case 'round':S.round++;stats();return S.round;
   case 'message':{const t=String(args[0]??'').slice(0,160);status(t);log(t);return true;}
   case 'sound':sound(String(args[0]||'beep'));return true;
   case 'state':return {score:S.score,round:S.round,hits:S.hits};
   default:throw Error('Unsupported game command');
  }
 },
 finish(token,error){
  if(!on(token))return;
  if(error){status('JavaScript error: '+String(error).slice(0,180));log('JavaScript: '+String(error).slice(0,180));}
  else{status('JavaScript game finished. Score: '+S.score);log('JavaScript game finished');}
  finish();
 },
 stop(){stop();}
};

const mute=$('sound-toggle');if(mute){mute.checked=true;mute.addEventListener('change',()=>{soundEnabled=mute.checked;if(soundEnabled)ensureAudio();});}
switchMode();stats();
})();