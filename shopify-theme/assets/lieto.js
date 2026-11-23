(function(){
  'use strict';
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
  var tT;function toast(m){var t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(tT);tT=setTimeout(function(){t.classList.remove('on')},2800)}
  window.lietoToast=toast;

  /* header: rounded pill on scroll */
  var hdr=$('#hdr'),tick=false;
  function onScroll(){if(hdr)hdr.classList.toggle('scrolled',(window.scrollY||document.documentElement.scrollTop)>40);tick=false}
  window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

  /* mobile menu */
  var mnav=$('#mnav');
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-mnav]');if(t&&mnav){mnav.classList.toggle('on',t.dataset.mnav==='open');return}
    if(mnav&&e.target.closest('#mnav a'))mnav.classList.remove('on');
  });

  /* announcement rotation */
  var ann=$$('[data-ann]');
  if(ann.length>1){var ai=0;ann.forEach(function(a,i){a.hidden=i!==0});setInterval(function(){if(document.body.classList.contains('a-still'))return;ann[ai].hidden=true;ai=(ai+1)%ann.length;ann[ai].hidden=false},5000)}

  /* countdowns: [data-until="YYYY-MM-DD"] */
  function untilTs(s){var p=String(s||'').split('-');if(p.length!==3)return 0;return new Date(+p[0],+p[1]-1,+p[2],23,59,59).getTime()}
  function tickCounts(){
    $$('[data-days-left]').forEach(function(el){var u=untilTs(el.dataset.daysLeft),d=Math.ceil((u-Date.now())/864e5);if(!u||d<1){el.hidden=true;return}el.hidden=false;el.textContent=el.dataset.tpl.replace('{n}',d===1?el.dataset.one:d+' '+el.dataset.many)});
    $$('[data-count]').forEach(function(el){var u=untilTs(el.dataset.count),s=Math.max(0,Math.floor((u-Date.now())/1000));var box=el.closest('[data-promo-card]');if(box)box.hidden=!u||s<=0;var d=Math.floor(s/86400);s%=86400;var h=Math.floor(s/3600);s%=3600;var m=Math.floor(s/60);s%=60;
      el.innerHTML=[[d,el.dataset.d],[h,el.dataset.h],[m,el.dataset.m],[s,el.dataset.s]].map(function(x){return '<div><b>'+String(x[0]).padStart(2,'0')+'</b><span>'+x[1]+'</span></div>'}).join('')});
  }
  tickCounts();setInterval(tickCounts,1000);

  /* card hover video */
  if(window.matchMedia&&matchMedia('(hover:hover)').matches){
    $$('.card').forEach(function(c){var v=$('video',c);if(!v)return;
      c.addEventListener('mouseenter',function(){if(document.body.classList.contains('a-still'))return;if(!v.getAttribute('src'))v.src=v.dataset.src;v.muted=true;v.classList.add('on');var p=v.play();if(p)p.catch(function(){})});
      c.addEventListener('mouseleave',function(){v.classList.remove('on');v.pause()})});
  }

  /* ajax add to cart */
  document.addEventListener('submit',function(e){
    var f=e.target;if(!f.matches('form[data-ajax-cart]'))return;
    e.preventDefault();var btn=$('[type=submit]',f);if(btn)btn.disabled=true;
    fetch(window.LIETO.cartAddUrl+'.js',{method:'POST',headers:{'Accept':'application/json'},body:new FormData(f)})
      .then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j})})
      .then(function(){toast(window.LIETO.added);return fetch(window.LIETO.cartUrl+'.js').then(function(r){return r.json()})})
      .then(function(c){$$('[data-cart-count]').forEach(function(b){b.textContent=c.item_count;b.hidden=!c.item_count})})
      .catch(function(err){toast((err&&err.description)||'לא הצלחנו להוסיף לעגלה. נסו שוב')})
      .finally(function(){if(btn)btn.disabled=false});
  });

  /* product gallery */
  var stage=$('#galStage');
  if(stage){
    var still=function(){return document.body.classList.contains('a-still')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)};
    function show(btn){
      $$('.gal-th').forEach(function(b){b.setAttribute('aria-pressed',String(b===btn))});
      var tpl=document.getElementById('gal-'+btn.dataset.media);if(!tpl)return;
      stage.innerHTML='';stage.appendChild(tpl.content.cloneNode(true));
      var v=$('video',stage);
      if(v){v.muted=true;v.loop=true;v.playsInline=true;
        if(still()){v.controls=true}else{var p=v.play();if(p)p.catch(function(){});
          var tb=document.createElement('button');tb.className='vtoggle';tb.type='button';tb.textContent='❚❚';tb.setAttribute('aria-label','השהיית הסרטון');
          tb.onclick=function(){if(v.paused){v.play();tb.textContent='❚❚';tb.setAttribute('aria-label','השהיית הסרטון')}else{v.pause();tb.textContent='▶';tb.setAttribute('aria-label','הפעלת הסרטון')}};stage.appendChild(tb)}}
    }
    $$('.gal-th').forEach(function(b){b.addEventListener('click',function(){show(b)})});
    var first=$('.gal-th');if(first&&first.dataset.type==='video')show(first);
  }

  /* variant picker -> hidden id + price */
  var vp=$('[data-variants]');
  if(vp){
    var variants=JSON.parse(vp.textContent),form=vp.closest('form');
    function sync(){
      var sel=$$('fieldset[data-opt]',form).map(function(fs){var c=$('input:checked',fs);return c?c.value:null});
      var v=variants.find(function(x){return x.options.every(function(o,i){return o===sel[i]})});
      var btn=$('[type=submit]',form),idIn=$('input[name=id]',form);
      if(!v){btn.disabled=true;btn.textContent=btn.dataset.unavailable;return}
      idIn.value=v.id;btn.disabled=!v.available;btn.textContent=v.available?btn.dataset.add:btn.dataset.soldout;
      var pr=$('[data-price]');if(pr)pr.innerHTML=v.price_html;
      if(history.replaceState){var u=new URL(location.href);u.searchParams.set('variant',v.id);history.replaceState(null,'',u)}
    }
    form.addEventListener('change',function(e){if(e.target.closest('fieldset[data-opt]'))sync()});
  }

  /* quantity steppers */
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-qty]');if(!b)return;var inp=$('input',b.parentElement);if(!inp)return;
    var n=Math.max(+inp.min||0,Math.min(99,(+inp.value||0)+(+b.dataset.qty)));inp.value=n;inp.dispatchEvent(new Event('change',{bubbles:true}));
  });
  /* cart page: change qty -> update */
  document.addEventListener('change',function(e){
    var inp=e.target.closest('[data-line-qty]');if(!inp)return;
    fetch(window.LIETO.cartChangeUrl+'.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({line:+inp.dataset.lineQty,quantity:+inp.value})}).then(function(){location.reload()});
  });

  /* accessibility widget */
  var A=LS.get('lieto_a11y',{fs:1,on:[]});
  var CLS=['a-contrast','a-gray','a-links','a-font','a-spacing','a-still','a-focus'];
  function applyA(){document.documentElement.style.setProperty('--fs',A.fs);CLS.forEach(function(c){document.body.classList.toggle(c,A.on.indexOf(c)>-1)});$$('[data-a^="a-"]').forEach(function(b){b.setAttribute('aria-pressed',String(A.on.indexOf(b.dataset.a)>-1))})}
  applyA();
  document.addEventListener('click',function(e){
    var t=e.target.closest('#a11yBtn');if(t){var p=$('#a11yP');p.hidden=!p.hidden;t.setAttribute('aria-expanded',String(!p.hidden));return}
    var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
    if(a==='fs+')A.fs=Math.min(1.5,+(A.fs+.1).toFixed(2));else if(a==='fs-')A.fs=Math.max(.9,+(A.fs-.1).toFixed(2));else if(a==='reset'){A.fs=1;A.on=[]}
    else{var i=A.on.indexOf(a);if(i<0)A.on.push(a);else A.on.splice(i,1)}
    LS.set('lieto_a11y',A);applyA();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var p=$('#a11yP');if(p)p.hidden=true;if(mnav)mnav.classList.remove('on')}});

  /* cookie banner */
  var ck=$('#cookie');if(ck){if(LS.get('lieto_cookie',0))ck.hidden=true;var ok=$('#cookieOk');if(ok)ok.onclick=function(){LS.set('lieto_cookie',1);ck.hidden=true}}
})();
