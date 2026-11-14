const tabs=[...document.querySelectorAll('.tab')], forms=[...document.querySelectorAll('.form')], statusEl=document.getElementById('status');
let mode='credentials';
tabs.forEach(tab=>tab.addEventListener('click',()=>{mode=tab.dataset.mode;tabs.forEach(t=>t.classList.toggle('active',t===tab));forms.forEach(f=>f.classList.toggle('hidden',f.id!==mode));statusEl.textContent='';statusEl.className='';}));
async function submit(form,event){event.preventDefault();const button=form.querySelector('.submit');const values=Object.fromEntries(new FormData(form));button.disabled=true;button.textContent='VERIFYING...';statusEl.textContent='Contacting KeyAuth securely...';statusEl.className='';
try{const result=await window.neverChess.login(mode,values);if(!result.ok)throw new Error(result.error||'Authentication failed');statusEl.textContent='Access granted. Launching NeverChess...';statusEl.className='ok';}
catch(error){statusEl.textContent=error.message;}
finally{button.disabled=false;button.innerHTML=mode==='credentials'?'LOG IN <span>→</span>':'ACTIVATE LICENSE <span>→</span>';}}
forms.forEach(form=>form.addEventListener('submit',e=>submit(form,e)));