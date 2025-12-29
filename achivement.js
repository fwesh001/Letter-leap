// Letter Leap — Achievements page interactions
(function(){ 
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const search = $('#search');
  const cards = $$('.ach-card');

  function applyFilter(q){
    const query = (q||'').trim().toLowerCase();
    cards.forEach(card => {
      const hay = (card.dataset.text||'') + ' ' + card.textContent;
      const matched = hay.toLowerCase().includes(query);
      card.style.display = matched ? '' : 'none';
    });
  }

  // Bind
  search?.addEventListener('input', (e)=>{
    const q = e.target.value;
    const url = new URL(location.href);
    if(q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    history.replaceState({}, '', url.toString());
    applyFilter(q);
  });

  // Init from URL
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  if(search){ search.value = q; applyFilter(q); }
})();
