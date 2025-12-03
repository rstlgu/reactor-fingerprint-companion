// Documentation page script for Reactor Fingerprint Companion
let currentLang = 'en';

function t(key) {
  return translations[currentLang]?.[key] || translations['en'][key] || key;
}

function renderDocs() {
  const content = document.getElementById('docs-content');
  
  content.innerHTML = `
    <!-- Introduction -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </span>
        ${t('introduction')}
      </div>
      <div class="card">
        <p class="intro-text">
          ${t('introText')}
          <br><br>
          ${t('introText2')}
        </p>
        <div class="info-box">
          <div class="info-box-title">${t('important')}</div>
          <div class="info-box-text">${t('importantText')}</div>
        </div>
      </div>
    </div>
    
    <!-- How it works -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </span>
        ${t('howItWorksDoc')}
      </div>
      <div class="card">
        <ol class="steps-list">
          <li><span>${t('docStep1')}</span></li>
          <li><span>${t('docStep2')}</span></li>
          <li><span>${t('docStep3')}</span></li>
          <li><span>${t('docStep4')}</span></li>
          <li><span>${t('docStep5')}</span></li>
          <li><span>${t('docStep6')}</span></li>
        </ol>
      </div>
    </div>
    
    <!-- Analysis Criteria -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        </span>
        ${t('analysisCriteria')}
      </div>
      <div class="card">
        <p class="intro-text" style="margin-bottom: 20px;">${t('criteriaIntro')}</p>
        <table class="criteria-table">
          <thead>
            <tr>
              <th>${t('criterion')}</th>
              <th>${t('description')}</th>
              <th>${t('impact')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="criteria-name">nVersion</span></td>
              <td>${t('nVersionDesc')}</td>
              <td>${t('nVersionImpact')}</td>
            </tr>
            <tr>
              <td><span class="criteria-name">${t('antiFeeSniping')}</span></td>
              <td>${t('antiFeeSniping_desc')}</td>
              <td>${t('antiFeeSniping_impact')}</td>
            </tr>
            <tr>
              <td><span class="criteria-name">${t('rbfSignaling')}</span></td>
              <td>${t('rbfSignaling_desc')}</td>
              <td>${t('rbfSignaling_impact')}</td>
            </tr>
            <tr>
              <td><span class="criteria-name">${t('lowRGrinding')}</span></td>
              <td>${t('lowRGrinding_desc')}</td>
              <td>${t('lowRGrinding_impact')}</td>
            </tr>
            <tr>
              <td><span class="criteria-name">${t('bip69')}</span></td>
              <td>${t('bip69_desc')}</td>
              <td>${t('bip69_impact')}</td>
            </tr>
            <tr>
              <td><span class="criteria-name">${t('scriptTypes')}</span></td>
              <td>${t('scriptTypes_desc')}</td>
              <td>${t('scriptTypes_impact')}</td>
            </tr>
            <tr>
              <td><span class="criteria-name">${t('addressReuse')}</span></td>
              <td>${t('addressReuse_desc')}</td>
              <td>${t('addressReuse_impact')}</td>
            </tr>
            <tr>
              <td><span class="criteria-name">${t('changePosition')}</span></td>
              <td>${t('changePosition_desc')}</td>
              <td>${t('changePosition_impact')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Recognized Wallets -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M22 10H2"/>
          </svg>
        </span>
        ${t('recognizedWallets')}
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/bitcoin-core.png" alt="Bitcoin Core"></div>
        <div class="wallet-info">
          <div class="wallet-name">Bitcoin Core</div>
          <div class="wallet-description">${t('btcCoreDesc')}</div>
          <div class="feature-grid">
            <span class="feature positive">nVersion = 2</span>
            <span class="feature positive">Anti-fee-sniping</span>
            <span class="feature positive">RBF</span>
            <span class="feature positive">Low-R grinding</span>
            <span class="feature negative">No address reuse</span>
          </div>
        </div>
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/electrum.png" alt="Electrum"></div>
        <div class="wallet-info">
          <div class="wallet-name">Electrum</div>
          <div class="wallet-description">${t('electrumDesc')}</div>
          <div class="feature-grid">
            <span class="feature positive">nVersion = 2</span>
            <span class="feature positive">Anti-fee-sniping</span>
            <span class="feature positive">RBF</span>
            <span class="feature positive">BIP-69</span>
            <span class="feature negative">No multi-type vin</span>
          </div>
        </div>
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/bluewallet.png" alt="Blue Wallet"></div>
        <div class="wallet-info">
          <div class="wallet-name">Blue Wallet</div>
          <div class="wallet-description">${t('blueWalletDesc')}</div>
          <div class="feature-grid">
            <span class="feature positive">nVersion = 2</span>
            <span class="feature positive">RBF</span>
            <span class="feature positive">Change last</span>
            <span class="feature negative">No address reuse</span>
          </div>
        </div>
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/coinbase.png" alt="Coinbase Wallet"></div>
        <div class="wallet-info">
          <div class="wallet-name">Coinbase Wallet</div>
          <div class="wallet-description">${t('coinbaseDesc')}</div>
          <div class="feature-grid">
            <span class="feature positive">nVersion = 2</span>
            <span class="feature negative">No RBF</span>
            <span class="feature negative">Max 2 outputs</span>
            <span class="feature negative">No address reuse</span>
            <span class="feature negative">No taproot</span>
          </div>
        </div>
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/exodus.png" alt="Exodus"></div>
        <div class="wallet-info">
          <div class="wallet-name">Exodus Wallet</div>
          <div class="wallet-description">${t('exodusDesc')}</div>
          <div class="feature-grid">
            <span class="feature positive">nVersion = 2</span>
            <span class="feature negative">No RBF</span>
            <span class="feature positive">Address reuse</span>
            <span class="feature negative">No P2PKH spending</span>
            <span class="feature negative">No multi-type vin</span>
          </div>
        </div>
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/trust.png" alt="Trust Wallet"></div>
        <div class="wallet-info">
          <div class="wallet-name">Trust Wallet</div>
          <div class="wallet-description">${t('trustDesc')}</div>
          <div class="feature-grid">
            <span class="feature negative">nVersion = 1</span>
            <span class="feature negative">No RBF</span>
            <span class="feature positive">Address reuse</span>
            <span class="feature negative">No P2PKH spending</span>
          </div>
        </div>
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/trezor.png" alt="Trezor"></div>
        <div class="wallet-info">
          <div class="wallet-name">Trezor</div>
          <div class="wallet-description">${t('trezorDesc')}</div>
          <div class="feature-grid">
            <span class="feature negative">nVersion = 1</span>
            <span class="feature positive">RBF</span>
            <span class="feature positive">BIP-69</span>
            <span class="feature negative">No address reuse</span>
            <span class="feature negative">No multi-type vin</span>
          </div>
        </div>
      </div>
      
      <div class="card wallet-card">
        <div class="wallet-icon-container"><img src="icons/wallets/ledger.png" alt="Ledger"></div>
        <div class="wallet-info">
          <div class="wallet-name">Ledger</div>
          <div class="wallet-description">${t('ledgerDesc')}</div>
          <div class="feature-grid">
            <span class="feature negative">nVersion = 1</span>
            <span class="feature positive">RBF</span>
            <span class="feature positive">Change last</span>
            <span class="feature negative">No address reuse</span>
            <span class="feature negative">No multi-type vin</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Limitations -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </span>
        ${t('limitations')}
      </div>
      <div class="card">
        <p class="intro-text">${t('limitationsIntro')}</p>
        <ul class="limitations-list">
          <li>${t('limitation1')}</li>
          <li>${t('limitation2')}</li>
          <li>${t('limitation3')}</li>
          <li>${t('limitation4')}</li>
          <li>${t('limitation5')}</li>
        </ul>
      </div>
    </div>
    
    <!-- Sources & References -->
    <div class="section">
      <div class="section-title">
        <span class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </span>
        ${t('sourcesAndReferences')}
      </div>
      <div class="card">
        <p class="intro-text">${t('sourcesIntro')}</p>
        
        <div class="source-item" style="margin-top: 20px;">
          <h4 style="color: var(--accent); margin-bottom: 10px; font-size: 16px;">${t('originalResearch')}</h4>
          <p style="margin-bottom: 15px; opacity: 0.9;">${t('researchDesc')}</p>
          
          <div class="source-images" style="display: flex; flex-wrap: wrap; gap: 16px; margin: 20px 0;">
            <div style="flex: 1; min-width: 280px;">
              <img src="images/fingerprints_final.png" alt="Wallet Fingerprints Table" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-color);">
              <p style="font-size: 12px; opacity: 0.7; margin-top: 8px; text-align: center;">Fingerprints comparison table</p>
            </div>
            <div style="flex: 1; min-width: 280px;">
              <img src="images/block_807929_graph.png" alt="Block Analysis Example" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-color);">
              <p style="font-size: 12px; opacity: 0.7; margin-top: 8px; text-align: center;">Transaction by Wallet in Block 807929</p>
            </div>
          </div>
          
          <a href="https://ishaana.com/blog/wallet_fingerprinting/" target="_blank" 
             style="display: inline-flex; align-items: center; gap: 8px; color: var(--accent); text-decoration: none; font-weight: 600; margin-top: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
            ${t('readFullArticle')}
          </a>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check if translations loaded
    if (typeof translations === 'undefined') {
      document.getElementById('docs-content').innerHTML = '<p style="color:red;">Error: translations not loaded. Please reload the extension.</p>';
      return;
    }
    
    // Load settings
    const settings = await chrome.storage.sync.get({ theme: 'light', lang: 'en' });
    currentLang = settings.lang;
    
    if (settings.theme === 'dark') {
      document.body.classList.add('dark');
    }
    
    // Apply translations and render
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[currentLang]?.[key]) {
        el.innerHTML = translations[currentLang][key];
      }
    });
    
    renderDocs();
  } catch (err) {
    console.error('Docs render error:', err);
    document.getElementById('docs-content').innerHTML = '<p style="color:red;">Error rendering: ' + err.message + '</p>';
  }
});

