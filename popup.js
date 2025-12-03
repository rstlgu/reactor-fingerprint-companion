// Popup script per l'estensione BTC Wallet Fingerprint

document.addEventListener('DOMContentLoaded', async () => {
  const statusText = document.getElementById('status-text');
  const txCount = document.getElementById('tx-count');
  const analyzeBtn = document.getElementById('analyze-btn');
  
  // Ottieni il tab corrente
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Controlla se siamo su Chainalysis
  if (tab.url && tab.url.includes('chainalysis.com')) {
    statusText.textContent = 'Connesso a Chainalysis';
    analyzeBtn.textContent = 'Apri pannello analisi';
    analyzeBtn.disabled = false;
    
    // Ottieni le transazioni intercettate
    chrome.runtime.sendMessage({ type: 'GET_TRANSACTIONS', tabId: tab.id }, (data) => {
      if (data && data.hashes) {
        txCount.textContent = data.hashes.length;
        statusText.textContent = 'Transazioni pronte per l\'analisi';
      }
    });
    
    analyzeBtn.addEventListener('click', async () => {
      // Invia messaggio al content script per aprire il pannello
      await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_PANEL' });
      window.close();
    });
    
  } else {
    statusText.textContent = 'Vai su Chainalysis Reactor per iniziare';
    analyzeBtn.textContent = 'Apri Chainalysis';
    analyzeBtn.disabled = false;
    
    analyzeBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://reactor.chainalysis.com' });
      window.close();
    });
  }
});

