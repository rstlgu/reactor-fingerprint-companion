// Content script per intercettare le risposte di Chainalysis Reactor

(function() {
  'use strict';
  
  // Intercetta le risposte XHR
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      if (this._url && this._url.includes('/transfers')) {
        try {
          const data = JSON.parse(this.responseText);
          if (Array.isArray(data) && data.length > 0 && data[0].hash) {
            console.log('[BTC Fingerprint] Intercettate transazioni:', data.length);
            chrome.runtime.sendMessage({
              type: 'CHAINALYSIS_RESPONSE',
              data: data
            });
          }
        } catch (e) {
          // Non è JSON valido o non è la risposta che cerchiamo
        }
      }
    });
    return originalXHRSend.apply(this, arguments);
  };
  
  // Intercetta anche fetch
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    const response = await originalFetch.apply(this, arguments);
    
    if (url && url.toString().includes('/transfers')) {
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        if (Array.isArray(data) && data.length > 0 && data[0].hash) {
          console.log('[BTC Fingerprint] Intercettate transazioni (fetch):', data.length);
          chrome.runtime.sendMessage({
            type: 'CHAINALYSIS_RESPONSE',
            data: data
          });
        }
      } catch (e) {
        // Ignora errori
      }
    }
    
    return response;
  };
  
  // Crea il pannello di analisi
  function createAnalysisPanel() {
    if (document.getElementById('btc-fingerprint-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'btc-fingerprint-panel';
    panel.innerHTML = `
      <div class="btc-fp-header">
        <span class="btc-fp-logo">🔍</span>
        <span class="btc-fp-title">BTC Wallet Fingerprint</span>
        <button class="btc-fp-close" id="btc-fp-close">×</button>
      </div>
      <div class="btc-fp-content">
        <div class="btc-fp-status" id="btc-fp-status">
          In attesa di transazioni...
        </div>
        <div class="btc-fp-results" id="btc-fp-results" style="display:none;">
          <div class="btc-fp-summary" id="btc-fp-summary"></div>
          <div class="btc-fp-details" id="btc-fp-details"></div>
        </div>
        <button class="btc-fp-analyze" id="btc-fp-analyze" disabled>
          Analizza Wallet
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Toggle pannello
    document.getElementById('btc-fp-close').addEventListener('click', () => {
      panel.classList.toggle('btc-fp-minimized');
    });
    
    // Pulsante analizza
    document.getElementById('btc-fp-analyze').addEventListener('click', startAnalysis);
  }
  
  // Crea il pulsante floating
  function createFloatingButton() {
    if (document.getElementById('btc-fingerprint-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'btc-fingerprint-btn';
    btn.innerHTML = '🔍';
    btn.title = 'BTC Wallet Fingerprint';
    btn.addEventListener('click', () => {
      const panel = document.getElementById('btc-fingerprint-panel');
      if (panel) {
        panel.classList.toggle('btc-fp-hidden');
      }
    });
    
    document.body.appendChild(btn);
  }
  
  // Aggiorna lo stato
  function updateStatus(message, isReady = false) {
    const status = document.getElementById('btc-fp-status');
    const btn = document.getElementById('btc-fp-analyze');
    
    if (status) status.textContent = message;
    if (btn) btn.disabled = !isReady;
  }
  
  // Inizia l'analisi
  async function startAnalysis() {
    const btn = document.getElementById('btc-fp-analyze');
    const results = document.getElementById('btc-fp-results');
    const summary = document.getElementById('btc-fp-summary');
    const details = document.getElementById('btc-fp-details');
    
    btn.disabled = true;
    btn.textContent = 'Analisi in corso...';
    updateStatus('Recupero transazioni...');
    
    try {
      // Ottieni le transazioni salvate
      const txData = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_TRANSACTIONS' }, resolve);
      });
      
      if (!txData || !txData.hashes.length) {
        updateStatus('Nessuna transazione trovata');
        btn.textContent = 'Analizza Wallet';
        return;
      }
      
      updateStatus(`Analisi di ${txData.hashes.length} transazioni...`);
      
      // Analizza i wallet
      const analysisResults = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          type: 'ANALYZE_WALLET',
          hashes: txData.hashes
        }, resolve);
      });
      
      // Mostra i risultati
      displayResults(analysisResults, txData.transfers);
      
    } catch (error) {
      console.error('[BTC Fingerprint] Errore:', error);
      updateStatus('Errore durante l\'analisi: ' + error.message);
    }
    
    btn.disabled = false;
    btn.textContent = 'Analizza Wallet';
  }
  
  // Mostra i risultati
  function displayResults(results, transfers) {
    const resultsDiv = document.getElementById('btc-fp-results');
    const summary = document.getElementById('btc-fp-summary');
    const details = document.getElementById('btc-fp-details');
    
    resultsDiv.style.display = 'block';
    
    // Calcola percentuali
    const total = Object.values(results.wallets).reduce((a, b) => a + b, 0);
    const percentages = Object.entries(results.wallets)
      .map(([wallet, count]) => ({
        wallet,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
    
    // Summary
    summary.innerHTML = `
      <h3>📊 Risultati Analisi</h3>
      <div class="btc-fp-wallet-list">
        ${percentages.map(p => `
          <div class="btc-fp-wallet-item">
            <span class="btc-fp-wallet-name">${getWalletIcon(p.wallet)} ${p.wallet}</span>
            <span class="btc-fp-wallet-percentage">${p.percentage}%</span>
            <div class="btc-fp-wallet-bar" style="width: ${p.percentage}%"></div>
          </div>
        `).join('')}
      </div>
      <p class="btc-fp-total">Transazioni analizzate: ${total}</p>
      ${results.errors.length > 0 ? `<p class="btc-fp-errors">Errori: ${results.errors.length}</p>` : ''}
    `;
    
    // Details (collapsible)
    details.innerHTML = `
      <details>
        <summary>📋 Dettagli transazioni</summary>
        <div class="btc-fp-tx-list">
          ${results.transactions.map(tx => `
            <div class="btc-fp-tx-item">
              <a href="https://mempool.space/tx/${tx.hash}" target="_blank" class="btc-fp-tx-hash">
                ${tx.hash.substring(0, 16)}...
              </a>
              <span class="btc-fp-tx-wallet ${getWalletClass(tx.wallet)}">${tx.wallet}</span>
            </div>
          `).join('')}
        </div>
      </details>
    `;
    
    updateStatus(`Analisi completata: ${percentages[0]?.wallet || 'N/A'} più probabile`);
  }
  
  function getWalletIcon(wallet) {
    const icons = {
      'Bitcoin Core': '🟠',
      'Electrum': '⚡',
      'Blue Wallet': '🔵',
      'Coinbase Wallet': '🔷',
      'Exodus Wallet': '🟣',
      'Trust Wallet': '🛡️',
      'Trezor': '🔒',
      'Ledger': '📟',
      'Unclear': '❓',
      'Other': '❔'
    };
    return icons[wallet] || '💼';
  }
  
  function getWalletClass(wallet) {
    return wallet.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Ascolta messaggi dal background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TRANSACTIONS_READY') {
      updateStatus(`${request.count} transazioni pronte per l'analisi`, true);
    }
  });
  
  // Inizializza
  createFloatingButton();
  createAnalysisPanel();
  
  console.log('[BTC Fingerprint] Extension caricata');
})();

