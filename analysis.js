// Script for the complete analysis page

const ICONS = {
  chart: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 14l4-4 4 4 5-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
  list: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
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

let currentLang = 'en';
let allTransactions = [];
let allErrors = [];
let selectedWallet = null;

function t(key) {
  return translations[currentLang]?.[key] || translations['en'][key] || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang]?.[key]) {
      el.innerHTML = translations[lang][key];
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const contentDiv = document.getElementById('content');
  const clusterInfo = document.getElementById('cluster-info');
  const themeBtn = document.getElementById('theme-btn');
  const closeBtn = document.getElementById('close-btn');
  const docsBtn = document.getElementById('docs-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportHtmlBtn = document.getElementById('export-html-btn');
  
  // Load settings
  const settings = await chrome.storage.sync.get({ theme: 'light', lang: 'en' });
  currentLang = settings.lang;
  
  if (settings.theme === 'dark') {
    document.body.classList.add('dark');
  }
  
  applyLanguage(settings.lang);
  
  // Toggle theme
  themeBtn.addEventListener('click', async () => {
    const isDark = document.body.classList.toggle('dark');
    await chrome.storage.sync.set({ theme: isDark ? 'dark' : 'light' });
  });
  
  // Open documentation
  docsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('docs.html') });
  });
  
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      exportCsv();
    });
  }
  
  if (exportHtmlBtn) {
    exportHtmlBtn.addEventListener('click', () => {
      exportHtml();
    });
  }
  
  // Close
  closeBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.remove(tab.id);
    }
  });
  
  // Get analysis data
  try {
    // Check if cluster is specified in URL
    const urlParams = new URLSearchParams(window.location.search);
    const clusterFromUrl = urlParams.get('cluster');
    
    let data;
    if (clusterFromUrl) {
      // Get analysis for specific cluster
      data = await chrome.runtime.sendMessage({ 
        type: 'GET_CACHED_ANALYSIS',
        cluster: clusterFromUrl 
      });
    } else {
      // Fallback to current analysis (for backward compatibility)
      data = await chrome.runtime.sendMessage({ type: 'GET_ANALYSIS_DATA' });
    }
    
    if (!data || !data.results) {
      contentDiv.innerHTML = `
        <div class="error-message">
          <p style="font-weight: 600; margin-bottom: 10px;">${t('noAnalysisData')}</p>
          <p style="opacity: 0.8;">${t('goToChainalysis')}</p>
        </div>
      `;
      return;
    }
    
    displayAnalysis(data);
    
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error-message">
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
  
  function displayAnalysis(data) {
    const { results, cluster, transfers } = data;
    allTransactions = results.transactions;
    allErrors = results.errors;
    selectedWallet = null;
    
    // Show cluster info
    clusterInfo.style.display = 'block';
    document.getElementById('cluster-address').textContent = cluster || 'Unknown cluster';
    document.getElementById('tx-count').textContent = results.transactions.length;
    document.getElementById('wallet-count').textContent = Object.keys(results.wallets).length;
    document.getElementById('error-count').textContent = results.errors.length;
    
    // Calculate percentages
    const total = Object.values(results.wallets).reduce((a, b) => a + b, 0);
    const percentages = Object.entries(results.wallets)
      .map(([wallet, count]) => ({
        wallet,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
    
    // Render content
    contentDiv.innerHTML = `
      <div class="results-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-icon">${ICONS.chart}</span>
            <span class="card-title">${t('walletSummary')}</span>
          </div>
          <div class="card-body">
            <div class="wallet-list">
              ${percentages.map(p => `
                <div class="wallet-item" data-wallet="${p.wallet}" data-count="${p.count}">
                  <span class="wallet-name">
                    <img src="${chrome.runtime.getURL('icons/wallets/' + WALLET_ICONS[p.wallet] + '.png')}" 
                         class="wallet-icon" 
                         onerror="this.style.display='none'"
                         alt="">
                    ${p.wallet}
                  </span>
                  <span class="wallet-percentage">${p.percentage}%</span>
                  <div class="wallet-bar" style="width: ${p.percentage}%"></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="card transactions-card">
          <div class="card-header">
            <span class="card-icon">${ICONS.list}</span>
            <span class="card-title" id="tx-title">${t('transactionDetail')} (${results.transactions.length})</span>
          </div>
          <div class="card-body" id="tx-list-container">
            ${renderTransactions(results.transactions, results.errors)}
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.wallet-item').forEach(item => {
      item.addEventListener('click', () => {
        const wallet = item.getAttribute('data-wallet');
        filterByWallet(wallet);
      });
    });
  }

  function renderTransactions(transactions, errors) {
    return `
      ${transactions.map(tx => {
        const vin = Array.isArray(tx.vin) ? tx.vin : [];
        const vout = Array.isArray(tx.vout) ? tx.vout : [];
        const totalOut = tx.totalOutput ?? vout.reduce((sum, o) => sum + (o?.value || 0), 0);
        const fee = tx.fee ?? 0;
        
        return `
        <div class="tx-item">
          <div class="tx-header">
            <a href="https://mempool.space/tx/${tx.hash}" target="_blank" class="tx-hash">
              ${tx.hash}
            </a>
            <span class="tx-wallet">${tx.wallet}</span>
          </div>
          <div class="tx-meta">
            <span class="meta-badge">Inputs: ${vin.length}</span>
            <span class="meta-badge">Outputs: ${vout.length}</span>
            <span class="meta-badge">Out: ${formatBtc(totalOut)} BTC</span>
            <span class="meta-badge">Fee: ${formatBtc(fee)} BTC</span>
            ${tx.vsize ? `<span class="meta-badge">vsize: ${tx.vsize}</span>` : ''}
            ${tx.blockTime ? `<span class="meta-badge">${new Date(tx.blockTime * 1000).toLocaleString()}</span>` : ''}
          </div>
          <div class="tx-io">
            <div class="tx-io-col">
              <div class="tx-io-title">Inputs</div>
              <div class="tx-io-list">
                ${vin.slice(0, 4).map(input => `
                  <div class="tx-io-row">
                    <span class="tx-io-addr" title="${input.address || ''}">${formatAddress(input.address)}</span>
                    <span class="tx-io-val">${formatBtc(input.value)} BTC</span>
                  </div>
                `).join('')}
                ${vin.length > 4 ? `<div class="tx-io-more">+${vin.length - 4} more</div>` : ''}
              </div>
            </div>
            <div class="tx-io-col">
              <div class="tx-io-title">Outputs</div>
              <div class="tx-io-list">
                ${vout.slice(0, 4).map(output => `
                  <div class="tx-io-row">
                    <span class="tx-io-addr" title="${output.address || ''}">${formatAddress(output.address)}</span>
                    <span class="tx-io-val">${formatBtc(output.value)} BTC</span>
                  </div>
                `).join('')}
                ${vout.length > 4 ? `<div class="tx-io-more">+${vout.length - 4} more</div>` : ''}
              </div>
            </div>
          </div>
          <div class="tx-features">
            ${tx.reasoning.map(r => `
              <span class="feature-tag ${getFeatureClass(r)}">${r}</span>
            `).join('')}
          </div>
        </div>
        `;
      }).join('')}
      
      ${errors.length > 0 ? `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
          <div style="font-size: 14px; font-weight: 600; color: #dc2626; margin-bottom: 14px;">${t('errors')} (${errors.length})</div>
          ${errors.map(err => `
            <div class="tx-item" style="background: rgba(239, 68, 68, 0.08);">
              <span class="tx-hash" style="color: #dc2626;">${err.hash.substring(0, 24)}...</span>
              <span style="color: #dc2626; font-size: 13px;">${err.error}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function filterByWallet(wallet) {
    selectedWallet = selectedWallet === wallet ? null : wallet;

    document.querySelectorAll('.wallet-item').forEach(item => {
      const itemWallet = item.getAttribute('data-wallet');
      if (itemWallet === selectedWallet) {
        item.classList.add('wallet-item-active');
      } else {
        item.classList.remove('wallet-item-active');
      }
    });

    const filteredTransactions = selectedWallet
      ? allTransactions.filter(tx => tx.wallet === selectedWallet)
      : allTransactions;

    const txListContainer = document.getElementById('tx-list-container');
    const txTitle = document.getElementById('tx-title');

    if (txListContainer) {
      txListContainer.innerHTML = renderTransactions(filteredTransactions, allErrors);
    }

    if (txTitle) {
      const baseTitle = t('transactionDetail');
      if (selectedWallet) {
        txTitle.textContent = `${baseTitle} - ${selectedWallet} (${filteredTransactions.length})`;
      } else {
        txTitle.textContent = `${baseTitle} (${allTransactions.length})`;
      }
    }
  }
  
  function formatBtc(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return Number(value).toFixed(8);
  }
  
  function formatAddress(address) {
    if (!address) return '—';
    if (address.length <= 18) return address;
    return `${address.slice(0, 8)}…${address.slice(-8)}`;
  }
  
  function exportCsv() {
    const rows = [];
    const header = [
      'hash',
      'wallet',
      'total_input_btc',
      'total_output_btc',
      'fee_btc',
      'inputs',
      'outputs',
      'reasoning',
      'block_time',
      'vsize',
      'weight'
    ];
    rows.push(header);
    
    const data = selectedWallet
      ? allTransactions.filter(tx => tx.wallet === selectedWallet)
      : allTransactions;
    
    data.forEach(tx => {
      const inputs = tx.vin.map(v => ({
        address: v.address,
        value: v.value,
        type: v.type
      }));
      const outputs = tx.vout.map(v => ({
        address: v.address,
        value: v.value,
        type: v.type
      }));
      
      rows.push([
        tx.hash,
        tx.wallet,
        formatBtc(tx.totalInput),
        formatBtc(tx.totalOutput),
        formatBtc(tx.fee),
        JSON.stringify(inputs),
        JSON.stringify(outputs),
        tx.reasoning.join('; '),
        tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '',
        tx.vsize || '',
        tx.weight || ''
      ]);
    });
    
    const csv = rows.map(r => r.map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(csv, 'analysis.csv', 'text/csv');
  }
  
  function exportHtml() {
    const clone = document.documentElement.cloneNode(true);
    ['export-csv-btn', 'export-html-btn'].forEach(id => {
      const el = clone.querySelector(`#${id}`);
      if (el && el.parentElement) {
        el.parentElement.removeChild(el);
      }
    });
    const html = `<!DOCTYPE html>\n${clone.outerHTML}`;
    downloadFile(html, 'analysis.html', 'text/html');
  }
  
  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  
  function getFeatureClass(feature) {
    const positive = ['Anti-fee-sniping', 'All compressed public keys', 'Low r signatures only', 'Signals RBF', 'BIP-69 outputs'];
    const negative = ['No Anti-fee-sniping', 'Uncompressed public key(s)', 'Not low-r-grinding', 'Does not signal RBF', 'Address reuse', 'Not BIP-69 outputs'];
    
    if (positive.some(p => feature.includes(p))) return 'positive';
    if (negative.some(n => feature.includes(n))) return 'negative';
    return '';
  }
});
