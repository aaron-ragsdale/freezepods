/* FreezePods: static Blockly game builder. No eval or arbitrary JS execution. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const state = {running:false, token:0, score:0, round:0, hits:0, target:-1, targetAt:0, last:null, pending:null, devices:[], mode:'simulation'};
  const uuid = {
    buttonService:'e95d9882-251d-470a-a062-fa1922dfa9a8',
    buttonA:'e95dda90-251d-470a-a062-fa1922dfa9a8',
    buttonB:'e95dda91-251d-470a-a062-fa1922dfa9a8',
    ledService:'e95dd91d-251d-470a-a062-fa1922dfa9a8',
    matrix:'e95d7b77-251d-470a-a062-fa1922dfa9a8'
  };
  const ledOff = new Uint8Array(5);
  const ledOn = new Uint8Array([14,31,31,31,14]);
  const podButtons = [...document.querySelectorAll('.pod')];
  let workspace;
  function status(s){$('status').textContent=s;}
  function log(s){const li=document.createElement('li');li.textContent=s;$('log').prepend(li);while($('log').children.length>45)$('log').lastChild.remove();}
  function stats(){ $('score').textContent=state.score; $('round').textContent=state.round; $('hits').textContent=state.hits; $('reaction').textContent=state.last&&state.last.ms!==null?Math.round(state.last.ms)+' ms':'—';}
  function paintPod(index,on){
    podButtons[index]?.classList.toggle('active',on);
    const dev=state.devices[index];
    if(state.mode==='hardware'&&dev&&dev.matrix){
      dev.matrix.writeValue(on?ledOn:ledOff).catch(err=>log('LED write failed: '+err.message));
    }
  }
  function clearPods(){for(let i=0;i<4;i++)paintPod(i,false);state.target=-1;}
  function pressed(index){
    if(!state.running||!state.pending)return;
    const waiter=state.pending;state.pending=null;
    waiter({index,ms:performance.now()-state.targetAt});
  }
  podButtons.forEach((button,i)=>button.addEventListener('click',()=>pressed(i)));
  document.addEventListener('keydown', e=>{
    if(e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.closest('.blocklyWidgetDiv'))return;
    if(['1','2','3','4'].includes(e.key))pressed(Number(e.key)-1);
  });
  function setMode(){state.mode=$('mode').value; $('connect').disabled=state.running;$('connect').hidden=state.mode!=='hardware';}
  $('mode').addEventListener('change',setMode);
  function updateDeviceCount(){ $('devices').textContent=state.devices.filter(d=>d?.device?.gatt?.connected).length+' micro:bits connected'; }
  $('connect').addEventListener('click', async()=>{
    if(!navigator.bluetooth){status('Web Bluetooth requires compatible Chrome/Edge and HTTPS.');return;}
    if(state.devices.filter(Boolean).length>=4){status('Maximum four devices.');return;}
    try {
      const device=await navigator.bluetooth.requestDevice({filters:[{namePrefix:'BBC micro:bit'}],optionalServices:[uuid.buttonService,uuid.ledService]});
      if(state.devices.some(d=>d&&d.device.id===device.id)){status('This micro:bit is already connected.');return;}
      const server=await device.gatt.connect();
      const buttons=await server.getPrimaryService(uuid.buttonService);
      const leds=await server.getPrimaryService(uuid.ledService);
      const matrix=await leds.getCharacteristic(uuid.matrix);
      const index=Array.from({length:4},(_,i)=>i).find(i=>!state.devices[i]);
      if(index===undefined)return;
      const info={device,matrix};state.devices[index]=info;
      for(const characteristicUuid of [uuid.buttonA,uuid.buttonB]){
        const characteristic=await buttons.getCharacteristic(characteristicUuid);
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged',e=>{
          if(e.target.value.getUint8(0)===1)pressed(index);
        });
      }
      device.addEventListener('gattserverdisconnected',()=>{
        state.devices[index]=null;updateDeviceCount();log('Pod '+(index+1)+' disconnected');
      });
      updateDeviceCount();status('Connected '+device.name+' as Pod '+(index+1));log('Connected '+device.name);
    }catch(err){status('Bluetooth connection failed: '+err.message);log('Bluetooth: '+err.message);}
  });
  if(!window.Blockly){status('Blockly did not load. Check internet connection and reload.');return;}
  const defs=[
    {type:'game_start',message0:'when game starts %1 %2',args0:[{type:'input_dummy'},{type:'input_statement',name:'DO'}],colour:35,tooltip:'The starting point for your game.'},
    {type:'repeat_rounds',message0:'repeat %1 rounds %2 %3',args0:[{type:'field_number',name:'COUNT',value:8,min:1,max:100,precision:1},{type:'input_dummy'},{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:225},
    {type:'light_random',message0:'light up a random pod',previousStatement:null,nextStatement:null,colour:145},
    {type:'light_specific',message0:'light up pod %1',args0:[{type:'field_dropdown',name:'POD',options:[['1','0'],['2','1'],['3','2'],['4','3']]}],previousStatement:null,nextStatement:null,colour:145},
    {type:'wait_press',message0:'wait for a press (max %1 ms)',args0:[{type:'field_number',name:'MS',value:3000,min:100,max:30000,precision:100}],previousStatement:null,nextStatement:null,colour:205},
    {type:'score_response',message0:'score: correct + %1 wrong %2',args0:[{type:'field_number',name:'RIGHT',value:10,min:0,max:1000},{type:'field_number',name:'WRONG',value:-5,min:-1000,max:1000}],previousStatement:null,nextStatement:null,colour:285},
    {type:'clear_pods',message0:'turn off all pods',previousStatement:null,nextStatement:null,colour:145},
    {type:'pause_ms',message0:'wait %1 ms',args0:[{type:'field_number',name:'MS',value:600,min:0,max:30000,precision:100}],previousStatement:null,nextStatement:null,colour:205}
  ];
  Blockly.defineBlocksWithJsonArray(defs);
  const toolbox={kind:'categoryToolbox',contents:[
    {kind:'category',name:'Game',colour:'#BD7131',contents:[{kind:'block',type:'game_start'},{kind:'block',type:'repeat_rounds'}]},
    {kind:'category',name:'Pods',colour:'#35845B',contents:[{kind:'block',type:'light_random'},{kind:'block',type:'light_specific'},{kind:'block',type:'clear_pods'}]},
    {kind:'category',name:'Inputs & Time',colour:'#356CAD',contents:[{kind:'block',type:'wait_press'},{kind:'block',type:'pause_ms'}]},
    {kind:'category',name:'Scoring',colour:'#9055AB',contents:[{kind:'block',type:'score_response'}]}
  ]};
  workspace=Blockly.inject('blockly',{toolbox,trashcan:true,scrollbars:true,zoom:{controls:true,wheel:true,startScale:0.87,maxScale:1.4,minScale:0.55},move:{scrollbars:true,drag:true,wheel:true}});
  const example='<xml xmlns="https://developers.google.com/blockly/xml"><block type="game_start" x="35" y="40"><statement name="DO"><block type="repeat_rounds"><field name="COUNT">8</field><statement name="DO"><block type="light_random"><next><block type="wait_press"><field name="MS">3000</field><next><block type="score_response"><field name="RIGHT">10</field><field name="WRONG">-5</field><next><block type="clear_pods"><next><block type="pause_ms"><field name="MS">600</field></block></next></block></next></block></next></block></statement></block></statement></block></xml>';
  function loadExample(){workspace.clear();Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(example),workspace);}
  $('example').addEventListener('click',()=>{if(state.running)return;loadExample();status('Example loaded. Press Play.');});
  loadExample();
  window.addEventListener('resize',()=>Blockly.svgResize(workspace));
  $('save').addEventListener('click',()=>{
    const json=JSON.stringify({format:'freezepods-blockly-v1',workspace:Blockly.serialization.workspaces.save(workspace)},null,2);
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download='my-freezepods-game.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
  $('load').addEventListener('click',()=>$('file').click());
  $('file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file||state.running)return;
    try{const data=JSON.parse(await file.text());if(data.format!=='freezepods-blockly-v1'||!data.workspace)throw Error('Unrecognized game file');workspace.clear();Blockly.serialization.workspaces.load(data.workspace,workspace);status('Game loaded.');}catch(err){status('Could not load game: '+err.message);}e.target.value='';
  });
  function active(token){return state.running&&token===state.token;}
  async function delay(ms,token){const end=performance.now()+Math.min(ms,30000);while(active(token)&&performance.now()<end)await sleep(Math.min(60,end-performance.now()));}
  async function waitPress(ms,token){
    state.targetAt=performance.now();
    let finish;
    const promise=new Promise(resolve=>{finish=resolve;state.pending=resolve;});
    const timer=setTimeout(()=>{if(state.pending===finish){state.pending=null;finish(null);}},Math.max(100,Math.min(30000,ms)));
    const result=await promise;clearTimeout(timer);return active(token)?result:null;
  }
  async function runSequence(first,token,budget){
    let block=first;
    while(block&&active(token)){
      if(++budget.steps>1500)throw Error('Too many instructions. Reduce repeats.');
      const type=block.type;
      if(type==='repeat_rounds'){
        const n=Math.max(1,Math.min(100,Number(block.getFieldValue('COUNT'))||1));
        for(let i=0;i<n&&active(token);i++){state.round++;stats();await runSequence(block.getInputTargetBlock('DO'),token,budget);}
      }else if(type==='light_random'||type==='light_specific'){
        clearPods();
        const index=type==='light_random'?Math.floor(Math.random()*4):Number(block.getFieldValue('POD'));
        state.target=index;state.last=null;paintPod(index,true);stats();status('Pod '+(index+1)+' is lit. Press it!');log('Target: Pod '+(index+1));
      }else if(type==='wait_press'){
        const outcome=await waitPress(Number(block.getFieldValue('MS'))||3000,token);
        state.last=outcome?{...outcome,correct:outcome.index===state.target}:{index:-1,ms:null,correct:false};
        if(active(token)){stats();log(outcome?'Pressed Pod '+(outcome.index+1)+' ('+Math.round(outcome.ms)+' ms)':'Time expired');}
      }else if(type==='score_response'){
        if(state.last){
          const points=state.last.correct?Number(block.getFieldValue('RIGHT')):Number(block.getFieldValue('WRONG'));
          state.score+=points;if(state.last.correct)state.hits++;stats();log((points>=0?'+':'')+points+' points');
        }
      }else if(type==='clear_pods'){clearPods();}
      else if(type==='pause_ms'){await delay(Number(block.getFieldValue('MS'))||0,token);}
      block=block.getNextBlock();
    }
  }
  function finish(){clearPods();state.running=false;state.pending=null;$('play').disabled=false;$('stop').disabled=true;$('mode').disabled=false;setMode();}
  $('play').addEventListener('click',async()=>{
    if(state.running)return;
    const starts=workspace.getTopBlocks(true).filter(b=>b.type==='game_start');
    if(starts.length!==1){status('Use exactly one "when game starts" block.');return;}
    if(state.mode==='hardware'&&state.devices.filter(d=>d?.device?.gatt?.connected).length<4){status('Hardware mode requires four connected micro:bits.');return;}
    state.running=true;const token=++state.token;state.score=0;state.round=0;state.hits=0;state.last=null;stats();$('play').disabled=true;$('stop').disabled=false;$('mode').disabled=true;$('connect').disabled=true;log('Game started');
    try{await runSequence(starts[0].getInputTargetBlock('DO'),token,{steps:0});if(active(token)){status('Game complete! Score: '+state.score);log('Game complete');}}
    catch(err){status('Game stopped: '+err.message);log('Error: '+err.message);}
    finally{if(token===state.token)finish();}
  });
  $('stop').addEventListener('click',()=>{
    if(!state.running)return;state.running=false;state.token++;
    if(state.pending){const resolve=state.pending;state.pending=null;resolve(null);}
    finish();status('Game stopped.');log('Stopped by user');
  });
  setMode();stats();
})();