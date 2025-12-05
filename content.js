// Content script for intercepting Chainalysis Reactor responses

(function() {
  'use strict';
  
  console.log('[Reactor Fingerprint Companion] Content script loading...');
  
  // i18n translations (inline for content script)
  const i18n = {
    en: {
      noWallet: 'No wallet',
      waitingTx: 'Waiting for transactions...',
      outgoingTx: 'outgoing transactions',
      selectCluster: 'Select a Bitcoin cluster on Chainalysis...',
      analyzing: 'Analyzing...',
      analyzingTx: 'Analyzing {count} transactions...',
      noTxFound: 'No transactions found',
      analyzeError: 'Error during analysis: ',
      analyzeFingerprint: 'Analyze Fingerprint',
      fingerprintResults: 'Fingerprint Results',
      txAnalyzed: 'Transactions analyzed: ',
      errors: 'Errors',
      cache: 'Cache',
      txDetails: 'Transaction details',
      fullAnalysis: 'Full Analysis',
      close: 'Close'
    },
    it: {
      noWallet: 'Nessun wallet',
      waitingTx: 'In attesa di transazioni...',
      outgoingTx: 'transazioni in uscita',
      selectCluster: 'Seleziona un cluster Bitcoin su Chainalysis...',
      analyzing: 'Analisi in corso...',
      analyzingTx: 'Analisi di {count} transazioni...',
      noTxFound: 'Nessuna transazione trovata',
      analyzeError: 'Errore durante l\'analisi: ',
      analyzeFingerprint: 'Analizza Fingerprint',
      fingerprintResults: 'Risultati Fingerprint',
      txAnalyzed: 'Transazioni analizzate: ',
      errors: 'Errori',
      cache: 'Cache',
      txDetails: 'Dettagli transazioni',
      fullAnalysis: 'Full Analysis',
      close: 'Close'
    }
  };
  
  function t(key, replacements = {}) {
    let text = i18n[settings.lang]?.[key] || i18n['en'][key] || key;
    Object.keys(replacements).forEach(k => {
      text = text.replace(`{${k}}`, replacements[k]);
    });
    return text;
  }
  
  // Truncate address in the middle: bc1qgt2...678703l
  function truncateAddress(address, startChars = 8, endChars = 8) {
    if (!address || address.length <= startChars + endChars + 3) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }
  
  // SVG Icons
  const ICONS = {
    fingerprint: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21zm6.25 12.07c-.13 0-.26-.05-.35-.15-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-2.42-2.09-4.39-4.66-4.39-2.57 0-4.66 1.97-4.66 4.39 0 1.44.32 2.77.93 3.85.64 1.15 1.08 1.64 1.85 2.42.19.2.19.51 0 .71-.11.1-.24.15-.37.15zm7.17-1.85c-1.19 0-2.24-.3-3.1-.89-1.49-1.01-2.38-2.65-2.38-4.39 0-.28.22-.5.5-.5s.5.22.5.5c0 1.41.72 2.74 1.94 3.56.71.48 1.54.71 2.54.71.24 0 .64-.03 1.04-.1.27-.05.53.13.58.41.05.27-.13.53-.41.58-.57.11-1.07.12-1.21.12zM14.91 22c-.04 0-.09-.01-.13-.02-1.59-.44-2.63-1.03-3.72-2.1-1.4-1.39-2.17-3.24-2.17-5.22 0-1.62 1.38-2.94 3.08-2.94 1.7 0 3.08 1.32 3.08 2.94 0 1.07.93 1.94 2.08 1.94s2.08-.87 2.08-1.94c0-3.77-3.25-6.83-7.25-6.83-2.84 0-5.44 1.58-6.61 4.03-.39.81-.59 1.76-.59 2.8 0 .78.07 2.01.67 3.61.1.26-.03.55-.29.64-.26.1-.55-.04-.64-.29-.49-1.31-.73-2.61-.73-3.96 0-1.2.23-2.29.68-3.24 1.33-2.79 4.28-4.6 7.51-4.6 4.55 0 8.25 3.51 8.25 7.83 0 1.62-1.38 2.94-3.08 2.94s-3.08-1.32-3.08-2.94c0-1.07-.93-1.94-2.08-1.94s-2.08.87-2.08 1.94c0 1.71.66 3.31 1.87 4.51.95.94 1.86 1.46 3.27 1.85.27.07.42.35.35.61-.05.23-.26.38-.48.38z" fill="currentColor"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 14l4-4 4 4 5-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
    list: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    external: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    close: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    loading: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="btc-fp-spin"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`
  };
  
  // Wallet icon mapping
  const WALLET_ICONS = {
    'Bitcoin Core': 'bitcoin-core',
    'Electrum': 'electrum',
    'Blue Wallet': 'bluewallet',
    'Coinbase Wallet': 'coinbase',
    'Exodus Wallet': 'exodus',
    'Trust Wallet': 'trust',
    'Trezor': 'trezor',
    'Ledger': 'ledger',
    'Unclear': 'unclear',
    'Other': 'other'
  };
  
  // Global state
  let currentCluster = null;
  let walletAddress = null;
  let transactionCount = 0;
  let settings = { theme: 'light', lang: 'en' };
  let isAnalyzing = false;
  let cachedResults = null; // Store analysis results
  let dominantWallet = null; // Store dominant wallet for button icon
  
  // Auto-analyze threshold
  const AUTO_ANALYZE_THRESHOLD = 50;
  
  // Load settings
  chrome.storage.sync.get({ theme: 'light', lang: 'en' }, (s) => {
    settings = s;
    applyTheme(settings.theme);
  });
  
  // Inject script into main world
  function injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.type = 'text/javascript';
    
    script.onload = function() {
      console.log('[Reactor Fingerprint Companion] ✅ Script injected into main world');
      this.remove();
    };
    
    script.onerror = function(e) {
      console.error('[Reactor Fingerprint Companion] ❌ Script injection error:', e);
    };
    
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(script);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        (document.head || document.documentElement).appendChild(script);
      });
    }
  }
  
  injectScript();
  
  // Apply theme
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('btc-fp-dark');
    } else {
      document.body.classList.remove('btc-fp-dark');
    }
  }
  
  // Listen for messages from injected script
  window.addEventListener('message', async function(event) {
    if (event.source !== window) return;
    
    if (event.data && event.data.type === 'BTC_FINGERPRINT_TRANSFERS') {
      const transfers = event.data.data;
      const newWalletAddress = event.data.walletAddress;
      
      console.log('[Reactor Fingerprint Companion] 📨 Received outgoing transactions:', transfers.length);
      
      // If new wallet, reset and check for cached analysis
      if (newWalletAddress !== walletAddress) {
        walletAddress = newWalletAddress;
        currentCluster = newWalletAddress;
        cachedResults = null;
        dominantWallet = null;
        resetResults();
        
        // Check if we have cached analysis for this cluster
        try {
          const cachedAnalysis = await chrome.runtime.sendMessage({
            type: 'GET_CACHED_ANALYSIS',
            cluster: newWalletAddress
          });
          
          if (cachedAnalysis && cachedAnalysis.results) {
            console.log('[Reactor Fingerprint Companion] ♻️ Found cached analysis for this cluster');
            cachedResults = cachedAnalysis.results;
            
            // Extract dominant wallet
            const sortedWallets = Object.entries(cachedResults.wallets).sort((a, b) => b[1] - a[1]);
            if (sortedWallets.length > 0) {
              dominantWallet = sortedWallets[0][0];
            }
          }
        } catch (err) {
          console.error('[Reactor Fingerprint Companion] Error checking cached analysis:', err);
        }
      }
      
      transactionCount = transfers.length;
      updateUI();
      
      chrome.runtime.sendMessage({
        type: 'CHAINALYSIS_RESPONSE',
        data: transfers
      }).catch(err => {
        console.error('[Reactor Fingerprint Companion] Error sending to background:', err);
      });
      
      // Auto-analyze immediately if <= threshold AND no cached results
      if (transactionCount > 0 && transactionCount <= AUTO_ANALYZE_THRESHOLD && !isAnalyzing && !cachedResults) {
        console.log('[Reactor Fingerprint Companion] 🚀 Starting auto-analysis for', transactionCount, 'transactions');
        setTimeout(() => startBackgroundAnalysis(), 500);
      } else if (cachedResults) {
        console.log('[Reactor Fingerprint Companion] ✅ Using cached results');
        }
      }
    });
  
  // Background analysis (no UI changes, just updates button content)
  async function startBackgroundAnalysis() {
    if (isAnalyzing || cachedResults) {
      console.log('[Reactor Fingerprint Companion] ⏭️ Skipping analysis - already analyzing or cached');
      return;
    }
    
    console.log('[Reactor Fingerprint Companion] 🔄 Starting background analysis...');
    isAnalyzing = true;
    
    // Show loading spinner on button
    updateButtonContent(transactionCount, 'loading');
    
    try {
      const txData = await chrome.runtime.sendMessage({ type: 'GET_TRANSACTIONS' });
      
      if (!txData || !txData.hashes || !txData.hashes.length) {
        console.log('[Reactor Fingerprint Companion] ❌ No transaction data available');
        isAnalyzing = false;
        updateButtonContent(transactionCount, null);
        return;
      }
      
      console.log('[Reactor Fingerprint Companion] 📊 Analyzing', txData.hashes.length, 'transactions...');
      
      const analysisResults = await chrome.runtime.sendMessage({
        type: 'ANALYZE_WALLET',
        hashes: txData.hashes
      });
      
      // Cache results
      cachedResults = analysisResults;
      
      // Save for full page
      await chrome.runtime.sendMessage({
        type: 'SAVE_ANALYSIS_DATA',
        data: { results: analysisResults, cluster: walletAddress, transfers: txData.transfers }
      });
      
      // Find dominant wallet
      const walletCounts = analysisResults.wallets;
      const sortedWallets = Object.entries(walletCounts).sort((a, b) => b[1] - a[1]);
      if (sortedWallets.length > 0) {
        dominantWallet = sortedWallets[0][0];
        // Use getWalletsToShow to potentially show multiple icons
        const walletsToShow = getWalletsToShow();
        updateButtonContent(transactionCount, walletsToShow);
        console.log('[Reactor Fingerprint Companion] ✅ Analysis complete:', dominantWallet, '- Showing:', walletsToShow);
      }
      
    } catch (error) {
      console.error('[Reactor Fingerprint Companion] ❌ Background analysis error:', error);
      updateButtonContent(transactionCount, null);
    }
    
    isAnalyzing = false;
  }
  
  // Update button content with count and optional wallet icons (multiple)
  function updateButtonContent(count, walletData) {
    const btn = document.getElementById('btc-fingerprint-btn');
    const content = document.getElementById('btc-fp-btn-content');
    if (!content) return;
    
    if (count > 0) {
      // Show count and optionally icon(s)
      btn.classList.add('has-info');
      
      let html = `<span class="btc-fp-btn-icon">${ICONS.fingerprint}</span>`;
      html += `<span class="btc-fp-btn-count">${count}</span>`;
      
      if (walletData === 'loading') {
        // Show loading spinner
        html += `<span class="btc-fp-btn-wallet-icon">${ICONS.loading}</span>`;
      } else if (walletData && Array.isArray(walletData) && walletData.length > 0) {
        // Show multiple wallet icons
        html += `<div class="btc-fp-btn-wallet-icons">`;
        walletData.forEach(wallet => {
          if (WALLET_ICONS[wallet]) {
            html += `<span class="btc-fp-btn-wallet-icon"><img src="${chrome.runtime.getURL('icons/wallets/' + WALLET_ICONS[wallet] + '.png')}" alt="${wallet}" title="${wallet}"></span>`;
          }
        });
        html += `</div>`;
      } else if (walletData && WALLET_ICONS[walletData]) {
        // Single wallet icon (backward compatibility)
        html += `<span class="btc-fp-btn-wallet-icon"><img src="${chrome.runtime.getURL('icons/wallets/' + WALLET_ICONS[walletData] + '.png')}" alt="${walletData}" title="${walletData}"></span>`;
      }
      
      content.innerHTML = html;
    } else {
      // Reset to just fingerprint icon
      btn.classList.remove('has-info');
      content.innerHTML = `<span class="btc-fp-btn-icon">${ICONS.fingerprint}</span>`;
    }
  }
  
  // Get wallet icons to show (multiple if needed, excluding Other/Unclear)
  function getWalletsToShow() {
    // Check if we should show icons at all
    const shouldShow = (cachedResults && dominantWallet) || 
                      (transactionCount <= AUTO_ANALYZE_THRESHOLD && dominantWallet);
    
    if (!shouldShow || !cachedResults || !cachedResults.wallets) return null;
    
    // Get all wallets sorted by count, excluding "Other" and "Unclear"
    const sortedWallets = Object.entries(cachedResults.wallets)
      .filter(([wallet]) => wallet !== 'Other' && wallet !== 'Unclear')
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedWallets.length === 0) return dominantWallet; // fallback to dominant
    if (sortedWallets.length === 1) return sortedWallets[0][0]; // single wallet
    
    // Multiple wallets - show up to 3
    return sortedWallets.slice(0, 3).map(([wallet]) => wallet);
  }
  
  // Update UI
  function updateUI() {
    const btn = document.getElementById('btc-fingerprint-btn');
    const headerAddress = document.getElementById('btc-fp-header-address');
    const txCountEl = document.getElementById('btc-fp-tx-captured');
    const analyzeBtn = document.getElementById('btc-fp-analyze');
    
    if (transactionCount > 0) {
      if (btn) btn.disabled = false;
      
      // Update button content with wallet icons
      const walletsToShow = getWalletsToShow();
      updateButtonContent(transactionCount, walletsToShow);
      
      if (headerAddress) {
        headerAddress.textContent = truncateAddress(walletAddress, 8, 8) || 'Wallet';
        headerAddress.title = walletAddress || ''; // Full address on hover
      }
      if (txCountEl) {
        txCountEl.textContent = `${transactionCount} ${t('outgoingTx')}`;
      }
      
      // Show analyze button only if above threshold AND no cached results
      if (analyzeBtn) {
        if (transactionCount > AUTO_ANALYZE_THRESHOLD && !cachedResults) {
          analyzeBtn.style.display = 'block';
          analyzeBtn.disabled = false;
          analyzeBtn.textContent = t('analyzeFingerprint');
        } else {
          analyzeBtn.style.display = 'none';
        }
      }
    } else {
      if (btn) btn.disabled = true;
      updateButtonContent(0, null);
      if (headerAddress) headerAddress.textContent = t('noWallet');
      if (txCountEl) txCountEl.textContent = t('waitingTx');
    }
    
    // Update status
    const status = document.getElementById('btc-fp-status');
    if (transactionCount > 0 && status && !isAnalyzing) {
      status.style.display = 'none';
    }
  }
  
  // Reset results
  function resetResults() {
    transactionCount = 0;
    isAnalyzing = false;
    cachedResults = null;
    dominantWallet = null;
    
    const resultsDiv = document.getElementById('btc-fp-results');
    if (resultsDiv) resultsDiv.style.display = 'none';
    
    const status = document.getElementById('btc-fp-status');
    if (status) {
      status.style.display = 'block';
      status.innerHTML = t('selectCluster');
      status.classList.remove('btc-fp-loading');
    }
    
    const analyzeBtn = document.getElementById('btc-fp-analyze');
    if (analyzeBtn) {
      analyzeBtn.style.display = 'none';
      analyzeBtn.disabled = true;
    }
    
    const panel = document.getElementById('btc-fingerprint-panel');
    if (panel) panel.classList.add('btc-fp-hidden');
    
    updateButtonContent(0, null);
    updateUI();
  }
  
  // Clear all
  function clearAll() {
    currentCluster = null;
    walletAddress = null;
    transactionCount = 0;
    isAnalyzing = false;
    cachedResults = null;
    dominantWallet = null;
    
    chrome.runtime.sendMessage({ type: 'CLEAR_TRANSACTIONS' }).catch(() => {});
    chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS_DATA' }).catch(() => {});
    
    resetResults();
    updateUI();
    
    console.log('[Reactor Fingerprint Companion] 🧹 Data cleared');
  }
  
  // Initialize UI
  function initUI() {
    createFloatingButton();
    createAnalysisPanel();
    addCustomStyles();
    console.log('[Reactor Fingerprint Companion] ✅ UI initialized');
  }
  
  // Add custom styles for button content
  function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Button as badge style */
      #btc-fingerprint-btn {
        width: auto !important;
        min-width: 36px;
        height: 36px;
        padding: 0 8px;
        gap: 6px;
        border-radius: 18px !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #btc-fingerprint-btn.has-info {
        padding: 0 10px 0 8px;
      }
      #btc-fp-btn-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #btc-fingerprint-btn .btc-fp-btn-icon {
        width: 18px;
        height: 18px;
      }
      #btc-fingerprint-btn .btc-fp-btn-icon svg {
        width: 100%;
        height: 100%;
      }
      .btc-fp-btn-count {
        font-size: 14px;
        font-weight: 700;
        color: white;
        line-height: 1;
      }
      .btc-fp-btn-wallet-icons {
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .btc-fp-btn-wallet-icon {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }
      .btc-fp-btn-wallet-icon img {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }
      .btc-fp-btn-wallet-icon svg {
        width: 14px;
        height: 14px;
        color: var(--btc-fp-accent, #f7931a);
      }
      @keyframes btc-fp-spin {
        to { transform: rotate(360deg); }
      }
      .btc-fp-spin {
        animation: btc-fp-spin 1s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create floating button
  function createFloatingButton() {
    if (document.getElementById('btc-fingerprint-floating')) return;
    
    const container = document.createElement('div');
    container.id = 'btc-fingerprint-floating';
    
    container.innerHTML = `
      <button id="btc-fingerprint-btn" disabled title="Reactor Fingerprint Companion">
        <div id="btc-fp-btn-content">
          <span class="btc-fp-btn-icon">${ICONS.fingerprint}</span>
        </div>
      </button>
    `;
    
    document.body.appendChild(container);
    
    document.getElementById('btc-fingerprint-btn').addEventListener('click', async () => {
      const panel = document.getElementById('btc-fingerprint-panel');
      if (panel) {
        const wasHidden = panel.classList.contains('btc-fp-hidden');
        panel.classList.toggle('btc-fp-hidden');
        
        // If closing panel, reset everything
        if (!wasHidden) {
          clearAll();
        } else {
          // If opening panel
          if (cachedResults) {
            // Show cached results immediately
            displayResults(cachedResults, null);
          } else if (transactionCount > AUTO_ANALYZE_THRESHOLD && !isAnalyzing) {
            // Manual analysis needed for > 50 tx
            showManualAnalyzeState();
          } else if (isAnalyzing) {
            // Still analyzing, show loading
            showLoadingState();
          }
        }
      }
    });
  }
  
  // Show manual analyze state
  function showManualAnalyzeState() {
    const status = document.getElementById('btc-fp-status');
    const analyzeBtn = document.getElementById('btc-fp-analyze');
    const resultsDiv = document.getElementById('btc-fp-results');
    
    if (resultsDiv) resultsDiv.style.display = 'none';
    if (status) {
      status.style.display = 'none';
    }
    if (analyzeBtn) {
      analyzeBtn.style.display = 'block';
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = t('analyzeFingerprint');
    }
  }
  
  // Create analysis panel
  function createAnalysisPanel() {
    if (document.getElementById('btc-fingerprint-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'btc-fingerprint-panel';
    panel.classList.add('btc-fp-hidden');
    panel.innerHTML = `
      <div class="btc-fp-header">
        <span class="btc-fp-logo">${ICONS.fingerprint}</span>
        <div class="btc-fp-header-info">
          <span class="btc-fp-header-address" id="btc-fp-header-address" title="">${t('noWallet')}</span>
          <span class="btc-fp-tx-captured" id="btc-fp-tx-captured">${t('waitingTx')}</span>
        </div>
      </div>
      <div class="btc-fp-content">
        <div class="btc-fp-status" id="btc-fp-status">
          ${t('selectCluster')}
        </div>
        <div class="btc-fp-results" id="btc-fp-results" style="display:none;">
          <div class="btc-fp-summary" id="btc-fp-summary"></div>
          <div class="btc-fp-details" id="btc-fp-details"></div>
          <div class="btc-fp-actions" id="btc-fp-actions"></div>
        </div>
        <button class="btc-fp-analyze" id="btc-fp-analyze" style="display:none;" disabled>
          ${t('analyzeFingerprint')}
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    document.getElementById('btc-fp-analyze').addEventListener('click', startManualAnalysis);
  }
  
  function showLoadingState() {
    const status = document.getElementById('btc-fp-status');
    const analyzeBtn = document.getElementById('btc-fp-analyze');
    const resultsDiv = document.getElementById('btc-fp-results');
    
    if (resultsDiv) resultsDiv.style.display = 'none';
    if (analyzeBtn) analyzeBtn.style.display = 'none';
    
    if (status) {
      status.style.display = 'flex';
      status.classList.add('btc-fp-loading');
      status.innerHTML = `
        <div class="btc-fp-spinner"></div>
        <span>${t('analyzing')}</span>
      `;
    }
  }
  
  // Manual analysis for > 50 transactions
  async function startManualAnalysis() {
    if (isAnalyzing) return;
    isAnalyzing = true;
    
    showLoadingState();
    
    try {
      const txData = await chrome.runtime.sendMessage({ type: 'GET_TRANSACTIONS' });
      
      if (!txData || !txData.hashes || !txData.hashes.length) {
        const status = document.getElementById('btc-fp-status');
        if (status) {
          status.classList.remove('btc-fp-loading');
          status.innerHTML = t('noTxFound');
        }
        isAnalyzing = false;
        return;
      }
      
      const status = document.getElementById('btc-fp-status');
      if (status) {
        status.innerHTML = `
          <div class="btc-fp-spinner"></div>
          <span>${t('analyzingTx', { count: txData.hashes.length })}</span>
        `;
      }
      
      const analysisResults = await chrome.runtime.sendMessage({
          type: 'ANALYZE_WALLET',
          hashes: txData.hashes
      });
      
      // Cache results
      cachedResults = analysisResults;
      
      // Save for full page
      await chrome.runtime.sendMessage({
        type: 'SAVE_ANALYSIS_DATA',
        data: { results: analysisResults, cluster: walletAddress, transfers: txData.transfers }
      });
      
      // Find dominant wallet and update button
      const sortedWallets = Object.entries(analysisResults.wallets).sort((a, b) => b[1] - a[1]);
      if (sortedWallets.length > 0) {
        dominantWallet = sortedWallets[0][0];
        // Use getWalletsToShow to potentially show multiple icons
        const walletsToShow = getWalletsToShow();
        updateButtonContent(transactionCount, walletsToShow);
      }
      
      displayResults(analysisResults, txData.transfers);
      
    } catch (error) {
      console.error('[Reactor Fingerprint Companion] Error:', error);
      const status = document.getElementById('btc-fp-status');
      if (status) {
        status.classList.remove('btc-fp-loading');
        status.innerHTML = t('analyzeError') + error.message;
      }
    }
    
    isAnalyzing = false;
  }
  
  function displayResults(results, transfers) {
    const resultsDiv = document.getElementById('btc-fp-results');
    const summary = document.getElementById('btc-fp-summary');
    const details = document.getElementById('btc-fp-details');
    const actions = document.getElementById('btc-fp-actions');
    const status = document.getElementById('btc-fp-status');
    const analyzeBtn = document.getElementById('btc-fp-analyze');
    
    // Hide status and analyze button
    if (status) {
      status.style.display = 'none';
      status.classList.remove('btc-fp-loading');
    }
    if (analyzeBtn) analyzeBtn.style.display = 'none';
    
    resultsDiv.style.display = 'block';
    
    const total = Object.values(results.wallets).reduce((a, b) => a + b, 0);
    const percentages = Object.entries(results.wallets)
      .map(([wallet, count]) => ({
        wallet,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
    
    summary.innerHTML = `
      <div class="btc-fp-section-header">
        <span class="btc-fp-section-icon">${ICONS.chart}</span>
        <span>${t('fingerprintResults')}</span>
      </div>
      <div class="btc-fp-wallet-list">
        ${percentages.map(p => `
          <div class="btc-fp-wallet-item">
            <span class="btc-fp-wallet-name">
              <img src="${chrome.runtime.getURL('icons/wallets/' + WALLET_ICONS[p.wallet] + '.png')}" 
                   class="btc-fp-wallet-icon" 
                   onerror="this.style.display='none'"
                   alt="">
              ${p.wallet}
            </span>
            <span class="btc-fp-wallet-percentage">${p.percentage}%</span>
            <div class="btc-fp-wallet-bar" style="width: ${p.percentage}%"></div>
          </div>
        `).join('')}
      </div>
      <p class="btc-fp-total">${t('txAnalyzed')}${total}${results.errors.length > 0 ? ` • ${t('errors')}: ${results.errors.length}` : ''}${results.cached > 0 ? ` • ${t('cache')}: ${results.cached}` : ''}</p>
    `;
    
    // Details with features
    details.innerHTML = `
      <details class="btc-fp-details-section">
        <summary>
          <span class="btc-fp-section-icon">${ICONS.list}</span>
          ${t('txDetails')}
        </summary>
        <div class="btc-fp-tx-list">
          ${results.transactions.map(tx => `
            <div class="btc-fp-tx-item-detailed">
              <div class="btc-fp-tx-header">
              <a href="https://mempool.space/tx/${tx.hash}" target="_blank" class="btc-fp-tx-hash">
                  ${tx.hash.substring(0, 18)}...
                </a>
                <span class="btc-fp-tx-wallet">${tx.wallet}</span>
              </div>
              <div class="btc-fp-tx-features">
                ${tx.reasoning.map(r => `<span class="btc-fp-feature-tag ${getFeatureClass(r)}">${r}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </details>
    `;
    
    // Action buttons
    actions.innerHTML = `
      <div class="btc-fp-result-actions">
        <button class="btc-fp-btn-action primary" id="btc-fp-fullpage">
          <span class="btc-fp-action-icon">${ICONS.external}</span>
          ${t('fullAnalysis')}
        </button>
        <button class="btc-fp-btn-action secondary" id="btc-fp-clear-results">
          <span class="btc-fp-action-icon">${ICONS.close}</span>
          ${t('close')}
        </button>
      </div>
    `;
    
    document.getElementById('btc-fp-fullpage').addEventListener('click', () => {
      chrome.runtime.sendMessage({ 
        type: 'OPEN_FULL_ANALYSIS',
        cluster: walletAddress 
      });
    });
    
    document.getElementById('btc-fp-clear-results').addEventListener('click', () => {
      clearAll();
      const panel = document.getElementById('btc-fingerprint-panel');
      if (panel) panel.classList.add('btc-fp-hidden');
    });
  }
  
  function getFeatureClass(feature) {
    const positive = ['Anti-fee-sniping', 'All compressed public keys', 'Low r signatures only', 'Signals RBF', 'BIP-69'];
    const negative = ['No Anti-fee-sniping', 'Uncompressed', 'Not low-r', 'Does not signal RBF', 'Address reuse', 'Not BIP-69'];
    
    if (positive.some(p => feature.includes(p))) return 'positive';
    if (negative.some(n => feature.includes(n))) return 'negative';
    return '';
  }
  
  // Listen for messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TRANSACTIONS_READY') {
      transactionCount = request.count;
      updateUI();
    }
    
    if (request.type === 'OPEN_PANEL') {
      const panel = document.getElementById('btc-fingerprint-panel');
      if (panel) {
        panel.classList.remove('btc-fp-hidden');
      }
    }
    
    if (request.type === 'CLEAR_ALL') {
      clearAll();
    }
    
    if (request.type === 'SETTINGS_CHANGED') {
      if (request.settings.theme !== undefined) {
        settings.theme = request.settings.theme;
        applyTheme(settings.theme);
      }
      if (request.settings.lang !== undefined) {
        settings.lang = request.settings.lang;
        // Refresh UI with new language
        updateUI();
        const panel = document.getElementById('btc-fingerprint-panel');
        if (panel && !panel.classList.contains('btc-fp-hidden')) {
          // Re-render panel text
          const headerAddress = document.getElementById('btc-fp-header-address');
          const txCountEl = document.getElementById('btc-fp-tx-captured');
          const status = document.getElementById('btc-fp-status');
          const analyzeBtn = document.getElementById('btc-fp-analyze');
          
          if (transactionCount === 0) {
            if (headerAddress) headerAddress.textContent = t('noWallet');
            if (txCountEl) txCountEl.textContent = t('waitingTx');
            if (status) status.innerHTML = t('selectCluster');
          } else {
            if (txCountEl) txCountEl.textContent = `${transactionCount} ${t('outgoingTx')}`;
          }
          if (analyzeBtn) analyzeBtn.textContent = t('analyzeFingerprint');
        }
      }
    }
    
    return true;
  });
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
  
  console.log('[Reactor Fingerprint Companion] ✅ Content script loaded');
})();
