/* FreezePods JavaScript mode. User scripts run in an isolated, no-same-origin iframe. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const blockBtn=$('blocks-tab'),jsBtn=$('javascript-tab'),blocks=$('blockly'),panel=$('js-editor-panel'),code=$('js-code');
if(!blockBtn||!jsBtn||!panel||!code)return;
window.FreezePodsEditorMode='blocks';
const sample=[
'// Reaction game: try changing the sounds, colors or points',
'for (let round = 0; round < 8; round++) {',
'  await pods.nextRound();',
"  await pods.sound('start');",
'  const target = await pods.randomPod();',
"  await pods.light(target, 'green');",
'  const press = await pods.waitPress(3000);',
'  if (press && press.pod === target) {',
'    await pods.addScore(10);',
"    await pods.sound('success');",
"    await pods.message('Nice! ' + press.ms + ' ms');",
'  } else {',
'    await pods.addScore(-5);',
"    await pods.sound('miss');",
"    await pods.message('Miss! Try again.');",
'  }',
'  await pods.off();',
'  await pods.wait(500);',
'}'].join('\n');
const memory=[
'// Memory game: watch the lights and repeat them',
'const sequence = [];',
'for (let round = 0; round < 5; round++) {',
'  await pods.nextRound();',
'  sequence.push(await pods.randomPod());',
"  await pods.message('Watch the sequence!');",
'  await pods.wait(600);',
'  for (const target of sequence) {',
"    await pods.light(target, 'blue');",
'    await pods.wait(500);',
'    await pods.off();',
'    await pods.wait(200);',
'  }',
"  await pods.message('Repeat the sequence!');",
'  let correct = true;',
'  for (const target of sequence) {',
'    const press = await pods.waitPress(3000);',
'    if (!press || press.pod !== target) {correct = false; break;}',
"    await pods.light(target, 'green');",
'    await pods.wait(120);',
'    await pods.off();',
'  }',
'  await pods.addScore(correct ? 20 : -5);',
"  await pods.message(correct ? 'Great memory!' : 'Try again!');",
'  await pods.wait(800);',
'}'].join('\n');
try{code.value=localStorage.getItem('freezepods-js-draft')||sample;}catch(_){code.value=sample;}
code.addEventListener('input',()=>{try{localStorage.setItem('freezepods-js-draft',code.value);}catch(_){}});
function switchTab(mode){
 if(!$('stop').disabled){$('status').textContent='Stop the current game before switching editors.';return;}
 window.FreezePodsEditorMode=mode;
 const js=mode==='javascript';blocks.hidden=js;panel.hidden=!js;
 blockBtn.setAttribute('aria-selected',String(!js));jsBtn.setAttribute('aria-selected',String(js));
 blockBtn.classList.toggle('chosen',!js);jsBtn.classList.toggle('chosen',js);
 $('example').hidden=js;
 const mem=$('memory');if(mem)mem.hidden=js;
 for(const id of ['speed-game','simon-game','duel-game']){const el=$(id);if(el)el.hidden=js;}
 $('save').hidden=js;$('load').hidden=js;
 $('workspace-description').textContent=js?'Write JavaScript using the FreezePods API. Each run starts a fresh game.':'Choose a starter game or remix with variables, lists, math, conditions, loops, and colored pods.';
 if(!js&&window.Blockly?.getMainWorkspace())setTimeout(()=>Blockly.svgResize(Blockly.getMainWorkspace()),40);
}
blockBtn.addEventListener('click',()=>switchTab('blocks'));jsBtn.addEventListener('click',()=>switchTab('javascript'));
$('js-example-reaction').addEventListener('click',()=>{code.value=sample;code.dispatchEvent(new Event('input'));});
$('js-example-memory').addEventListener('click',()=>{code.value=memory;code.dispatchEvent(new Event('input'));});
$('js-save').addEventListener('click',()=>{
 const url=URL.createObjectURL(new Blob([code.value],{type:'text/javascript'}));
 const a=document.createElement('a');a.href=url;a.download='my-freezepods-game.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('js-load').addEventListener('click',()=>$('js-file').click());
$('js-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>100000){$('status').textContent='File must be smaller than 100 KB.';return;}
 code.value=await file.text();code.dispatchEvent(new Event('input'));
});
let frame=null,runToken=null,session=null,watchdog=null;
function destroy(){if(frame){frame.remove();frame=null;}runToken=null;session=null;if(watchdog){clearTimeout(watchdog);watchdog=null;}}
function finish(error){if(runToken!==null)window.FreezePodsBridge?.finish(runToken,error);destroy();}
const bootstrap=[
"'use strict';",
'let activeSession=null;',
'let counter=0;',
'const pending=new Map();',
"window.addEventListener('message',event=>{",
" if(event.source!==parent)return;",
" const data=event.data;if(!data||data.channel!=='freezepods-v1')return;",
" if(data.type==='reply'&&data.session===activeSession){",
"  const item=pending.get(data.id);if(!item)return;pending.delete(data.id);",
"  if(data.error)item.reject(new Error(data.error));else item.resolve(data.result);",
" }",
" if(data.type==='run'&&activeSession===null){",
"  activeSession=data.session;",
"  const call=(command,args=[])=>new Promise((resolve,reject)=>{",
"   const id=++counter;pending.set(id,{resolve,reject});",
"   parent.postMessage({channel:'freezepods-v1',type:'command',session:activeSession,id,command,args},'*');",
"  });",
"  const pods=Object.freeze({",
"   light:(pod,color='green')=>call('light',[pod,color]),",
"   all:(color)=>call('all',[color]),",
"   off:()=>call('clear'),",
"   wait:(ms)=>call('pause',[ms]),",
"   waitPress:(ms=3000)=>call('press',[ms]),",
"   addScore:(points)=>call('score',[points]),",
"   nextRound:()=>call('round'),",
"   randomPod:()=>call('random'),",
"   message:(text)=>call('message',[text]),",
"   sound:(effect='beep')=>call('sound',[effect]),",
"   rgbFill:(pod,color)=>call('rgbFill',[pod,color]),",
"   rgbPixel:(pod,pixel,color)=>call('rgbPixel',[pod,pixel,color]),",
"   rgbRainbow:(pod)=>call('rgbRainbow',[pod]),",
"   rgbBrightness:(percent)=>call('rgbBrightness',[percent]),",
"   getState:()=>call('state')",
"  });",
"  (async()=>{",
"   try{",
"    const task=new Function('pods','\"use strict\";return (async function(){\\n'+data.source+'\\n})();');",
"    await task(pods);",
"    parent.postMessage({channel:'freezepods-v1',type:'done',session:activeSession},'*');",
"   }catch(error){",
"    parent.postMessage({channel:'freezepods-v1',type:'done',session:activeSession,error:String(error)},'*');",
"   }",
"  })();",
" }",
"});"
].join('\n');
function sandboxDocument(){
 const policy="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src 'none'; media-src 'none'; style-src 'none'; worker-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
 return '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="'+policy+'"></head><body><script>'+bootstrap.replace(/<\/script/gi,'<\\/script')+'</script></body></html>';
}
window.addEventListener('message',async event=>{
 if(!frame||event.source!==frame.contentWindow)return;
 const m=event.data;
 if(!m||m.channel!=='freezepods-v1'||m.session!==session)return;
 if(m.type==='done'){finish(m.error||null);return;}
 if(m.type!=='command'||typeof m.command!=='string'||!Number.isInteger(m.id))return;
 const target=frame.contentWindow,token=runToken,unique=session;
 try{
  const args=Array.isArray(m.args)?m.args.slice(0,4):[];
  const result=await window.FreezePodsBridge.command(token,m.command,args);
  if(frame&&target===frame.contentWindow&&session===unique)target.postMessage({channel:'freezepods-v1',type:'reply',session:unique,id:m.id,result},'*');
 }catch(e){
  if(frame&&target===frame.contentWindow&&session===unique)target.postMessage({channel:'freezepods-v1',type:'reply',session:unique,id:m.id,error:String(e.message||e)},'*');
 }
});
$('play').addEventListener('click',()=>{
 if(window.FreezePodsEditorMode!=='javascript'||frame)return;
 if(code.value.length>100000){$('status').textContent='Code is too long (max 100 KB).';return;}
 const token=window.FreezePodsBridge?.start();if(token===null||token===undefined)return;
 runToken=token;session=crypto.randomUUID?.()||String(Date.now())+'-'+Math.random();
 frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');
 frame.setAttribute('title','Isolated student JavaScript');frame.style.display='none';
 frame.srcdoc=sandboxDocument();document.body.appendChild(frame);
 const f=frame,unique=session;
 f.addEventListener('load',()=>{if(frame===f&&session===unique)f.contentWindow.postMessage({channel:'freezepods-v1',type:'run',session:unique,source:code.value},'*');},{once:true});
 watchdog=setTimeout(()=>{if(frame===f)finish('Maximum game duration reached (2 minutes).');},120000);
});
$('stop').addEventListener('click',destroy);
switchTab('blocks');
})();