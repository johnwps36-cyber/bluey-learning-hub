/* Five small games share lifecycle, safe DOM and completion hooks. No lesson data is mutated. */
(function(root) {
  'use strict';
  function mount({type,config,host,freezeHost,onSpeak,onTone,onComplete}) {
    let alive = true, finished = false, frame = null;
    const timers = new Set(), cleanups = [];
    const el = (tag, cls, text) => { const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n; };
    const action = (label, fn, cls='game-action') => {
      const b=el('button',cls,label);b.type='button';
      b.addEventListener('click',()=>{if(alive)fn();});return b;
    };
    const bounded = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max,value)) : fallback;
    const timeout = (fn,ms) => {const id=setTimeout(()=>{timers.delete(id);if(alive)fn();},ms);timers.add(id);return id;};
    const clearTimers = () => {for(const id of timers)clearTimeout(id);timers.clear();};
    const complete = (message) => {if(finished)return;finished=true;status.textContent=message;onTone();onComplete();};
    const status=el('p','game-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const title=el('h3','game-title');const area=el('div',`game-area game-${type}`);const controls=el('div','game-controls');
    let restart = () => {};
    let freeze = () => {};
    if(type==='freeze') {
      const target=el('div','game-round');target.append(status);
      const limit=Math.round(bounded(config.turnLimit,3,1,10));let frozen=false,turns=0;
      restart=()=>{finished=false;frozen=false;turns=0;status.textContent=`輪流挑戰：完成 ${limit} 次定格＋解凍（0/${limit}）`;
        const dad=freezeHost.querySelector('#dadAvatar');dad.classList.remove('frozen');dad.textContent='🐕';freezeHost.querySelector('#stageStatus').textContent='🕺 爸爸跳舞中';};
      freeze=value=>{if(finished)return;if(value)frozen=true;else if(frozen){frozen=false;turns++;status.textContent=`輪流挑戰：${turns}/${limit}`;if(turns>=limit)complete('🌟 完成挑戰！輪到下一位玩喇！');}};
      target.append(action('🔄 再玩／換人',()=>restart()));freezeHost.append(target);cleanups.push(()=>target.remove());restart();
    } else {
      host.append(title,status,area,controls);
      if(type==='hospital') {
        title.textContent='🏥 小醫生救爸爸';
        const tools=Array.isArray(config.tools)?config.tools.filter(x=>['xray','needle','cheese'].includes(x)):['xray','needle','cheese'];
        const items=Array.isArray(config.bellyItems)&&config.bellyItems.length?config.bellyItems.filter(x=>typeof x==='string').slice(0,8):['mouse'];
        const icons={octopus:'🐙',cat:'🐈',mouse:'🐭'};let remaining=[],examined=false,calm=false;
        const patient=el('div','patient');const belly=el('div','belly-items');area.append(patient,belly);
        const xray=action('🩻 照 X 光',()=>{if(finished)return;examined=true;belly.textContent=remaining.map(x=>icons[x]||x).join(' ');status.textContent=tools.includes('needle')?'照到肚入面嘅動物！撳玩具針安撫病人。':'照到動物喇！用芝士引佢哋出嚟。';update();onSpeak('Let’s have a look.');});
        const needle=action('💉 玩具針',()=>{calm=true;status.textContent='勇敢嘅病人！而家用芝士引動物出嚟。';update();onSpeak('Brave boy!');});
        const cheese=action('🧀 用芝士引出動物',()=>{const item=remaining.pop();belly.textContent=remaining.map(x=>icons[x]||x).join(' ')||'💚';onSpeak('Come out!');if(!remaining.length)complete('💚 動物全部走返出嚟，爸爸好返喇！');else status.textContent=`${icons[item]||item} 出咗嚟！仲有 ${remaining.length} 隻。`;update();});
        function update(){xray.disabled=finished;needle.disabled=finished||!examined||calm;cheese.disabled=finished||!examined||(tools.includes('needle')&&!calm);}
        controls.append(xray);if(tools.includes('needle'))controls.append(needle);controls.append(cheese);
        restart=()=>{finished=false;remaining=[...items];examined=false;calm=false;patient.textContent=`🐕 ${typeof config.patientName==='string'?config.patientName:'爸爸'}`;belly.textContent='❓ ❓ ❓';status.textContent='先照 X 光，再幫病人趕走肚入面嘅動物。這是扮演遊戲。';update();};
      } else if(type==='balloon') {
        title.textContent='🎈 顛氣球：連拍五下！';
        const gravity=bounded(config.gravity,0.6,0.1,2);let y=60,x=50,velocity=0,taps=0,running=false,wind=false,last=0;
        const balloon=action('🎈',()=>{if(!running||finished)return;taps++;velocity=-130;status.textContent=`拍到 ${taps}/5 下！`;onTone();if(taps>=5){running=false;complete('🎉 五下都冇掂地！顛氣球成功！');}},'balloon-target');balloon.setAttribute('aria-label','拍氣球');
        const floor=el('div','balloon-floor','🌱 地面');area.append(balloon,floor);
        const windButton=action('🌬️ 風扇：關',()=>{wind=!wind;windButton.textContent=`🌬️ 風扇：${wind?'開':'關'}`;windButton.setAttribute('aria-pressed',String(wind));});
        if(config.windEnabled===true)controls.append(windButton);
        const draw=()=>{balloon.style.top=`${y}px`;balloon.style.left=`${x}%`;};
        function tick(now){if(!alive||!running)return;const dt=Math.min((now-last)/1000,0.05);last=now;velocity+=140*gravity*dt;y=Math.max(0,y+velocity*dt);if(y===0)velocity=Math.max(velocity,0);if(wind)x=50+Math.sin(now/500)*25;draw();if(y>=180){running=false;status.textContent='氣球掂地喇！撳「再玩一次」再試。';balloon.disabled=true;return;}frame=requestAnimationFrame(tick);}
        const start=()=>{if(frame!==null)cancelAnimationFrame(frame);finished=false;y=60;x=50;velocity=0;taps=0;running=true;balloon.disabled=false;status.textContent='快啲撳氣球，連拍五下，唔好畀佢掂地！';draw();last=performance.now();frame=requestAnimationFrame(tick);};
        controls.append(action('▶ 開始',start));restart=()=>{if(frame!==null)cancelAnimationFrame(frame);running=false;finished=false;balloon.disabled=true;y=60;x=50;draw();status.textContent='撳開始，再拍氣球；拍夠五下就過關。';};
      } else if(type==='robot') {
        title.textContent='🤖 向機械人爸爸下指令';
        const definitions={carry:['🎒 孭起','Carry!'],boogie:['🕺 跳舞','Boogie!'],tidy:['🧹 執拾','Tidy up!'],relax:['🛋️ 休息','Relax!']};
        const commands=Array.isArray(config.commands)?config.commands.filter(x=>Object.prototype.hasOwnProperty.call(definitions,x)).slice(0,8):['carry','tidy','relax'];
        if(!commands.length)commands.push('tidy');let index=0,malfunction=false,stoppedOnce=false;
        const robot=el('div','robot-avatar','🤖');area.append(robot);
        const off=action(`🔴 ${config.offSwitch==='nose'?'鼻哥熄機掣':'熄機掣'}`,()=>{if(!malfunction||finished){if(!finished)status.textContent='機械人正常運作，先完成指令啦。';return;}malfunction=false;stoppedOnce=true;robot.textContent='🤖';onSpeak('Stop!');prompt();},'game-action robot-off');
        function prompt(){status.textContent=`第 ${index+1}/${commands.length} 步：${definitions[commands[index]][0]}`;}
        for(const command of [...new Set(commands)])controls.append(action(definitions[command][0],()=>{
          if(finished)return;if(malfunction){status.textContent='機械人失控喇！快啲撳紅色熄機掣！';return;}
          if(command!==commands[index]){status.textContent=`再試下：今次要${definitions[commands[index]][0]}。`;return;}
          onSpeak(definitions[command][1]);index++;
          if(index===commands.length){complete('⭐ 指令完成，玩具執好！你係好幫手！');return;}
          if(config.malfunctionMode===true&&!stoppedOnce&&index>=Math.ceil(commands.length/2)){malfunction=true;robot.textContent='😵‍💫';status.textContent='機械人失控喇！快啲撳紅鼻哥掣！';}else prompt();
        }));controls.append(off);
        restart=()=>{finished=false;index=0;malfunction=false;stoppedOnce=false;robot.textContent='🤖';prompt();};
      } else if(type==='shadow') {
        title.textContent='🌳 影子國度：行去野餐墊';let position=0,bridgeOpen=false,lost=false;
        const bridges=Array.isArray(config.movingBridges)?config.movingBridges.filter(x=>['bus_shadow','cloud_cover'].includes(x)):['bus_shadow'];
        const path=el('div','shadow-path');area.append(path);const cells=[];
        const labels=['🏁 起點','🌳 樹影','🚌 影子橋','🌳 樹影','🧁 野餐墊'];
        const draw=()=>{cells.forEach((b,i)=>{b.classList.toggle('current',i===position);b.setAttribute('aria-current',String(i===position));});};
        for(let i=0;i<labels.length;i++){
          const cell=action(labels[i],()=>{if(finished||lost)return;if(i!==position+1){status.textContent='跟住影子，一格一格行，唔好跳過呀。';return;}if(i===2&&!bridgeOpen){status.textContent='前面有陽光！先等巴士或雲遮住太陽。';return;}position=i;draw();onTone();if(i===4){clearTimers();complete('🧁 安全到達野餐墊！一齊食 Cupcake！');}else status.textContent=`行到第 ${i} 格樹影！繼續向前。`;},'shadow-cell');cells.push(cell);path.append(cell);
        }
        area.append(action('☀️ 陽光（鱷魚海）',()=>{if(finished||lost)return;lost=true;clearTimers();bridgeOpen=false;status.textContent='🐊 踩到陽光喇！撳「再玩一次」由起點試過。';},'game-action sun-hazard'));
        for(const bridge of bridges.length?bridges:['bus_shadow'])controls.append(action(bridge==='bus_shadow'?'🚌 等巴士影子':'☁️ 等雲遮太陽',()=>{if(finished||lost)return;clearTimers();bridgeOpen=true;area.classList.add('bridge-open');status.textContent='影子橋開咗！四秒內快啲過橋。';timeout(()=>{bridgeOpen=false;area.classList.remove('bridge-open');status.textContent=position>=2?'影子橋收返喇；你已經過咗橋，繼續行。':'影子橋收返喇，再等下一次。';},4000);}));
        restart=()=>{clearTimers();finished=false;lost=false;position=0;bridgeOpen=false;area.classList.remove('bridge-open');draw();status.textContent='先行去第一格樹影，再等影子橋，避開陽光到達野餐墊。';};
      } else {
        title.textContent='⭐ 一齊玩';restart=()=>{finished=false;status.textContent='撳星星完成練習。';};controls.append(action('⭐ 完成練習',()=>complete('⭐ 做得好！')));
      }
      controls.append(action('🔄 再玩一次',()=>{clearTimers();restart();}));restart();
    }
    return {freeze,destroy(){alive=false;clearTimers();if(frame!==null)cancelAnimationFrame(frame);for(const fn of cleanups)fn();}};
  }
  root.BlueyGames={mount};
})(globalThis);
