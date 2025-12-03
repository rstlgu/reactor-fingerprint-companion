// Background service worker per intercettare le risposte di Chainalysis

// Memorizza le transazioni intercettate
let interceptedTransactions = new Map();

// Ascolta i messaggi dal content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAINALYSIS_RESPONSE') {
    const transfers = request.data;
    const tabId = sender.tab.id;
    
    // Estrai gli hash unici delle transazioni
    const hashes = [...new Set(transfers.map(t => t.hash))];
    
    // Memorizza per questo tab
    interceptedTransactions.set(tabId, {
      transfers: transfers,
      hashes: hashes,
      timestamp: Date.now()
    });
    
    // Notifica il content script che abbiamo i dati
    chrome.tabs.sendMessage(tabId, {
      type: 'TRANSACTIONS_READY',
      count: hashes.length
    });
    
    sendResponse({ success: true, count: hashes.length });
  }
  
  if (request.type === 'GET_TRANSACTIONS') {
    const tabId = sender.tab?.id || request.tabId;
    const data = interceptedTransactions.get(tabId);
    sendResponse(data || null);
  }
  
  if (request.type === 'ANALYZE_WALLET') {
    analyzeWallet(request.hashes).then(results => {
      sendResponse(results);
    });
    return true; // Mantiene il canale aperto per risposta asincrona
  }
  
  return true;
});

// Analizza le transazioni per determinare il wallet
async function analyzeWallet(hashes) {
  const results = {
    wallets: {},
    transactions: [],
    errors: []
  };
  
  for (const hash of hashes) {
    try {
      const txData = await fetchTransaction(hash);
      const analysis = detectWallet(txData);
      
      results.transactions.push({
        hash: hash,
        wallet: analysis.wallet,
        reasoning: analysis.reasoning
      });
      
      // Conta i wallet
      if (!results.wallets[analysis.wallet]) {
        results.wallets[analysis.wallet] = 0;
      }
      results.wallets[analysis.wallet]++;
      
    } catch (error) {
      results.errors.push({ hash, error: error.message });
    }
  }
  
  return results;
}

// Fetch transazione da mempool.space
async function fetchTransaction(txid) {
  const response = await fetch(`https://mempool.space/api/tx/${txid}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const tx = await response.json();
  
  // Normalizza i valori (da satoshi a BTC)
  for (const txOut of tx.vout) {
    txOut.value = txOut.value / 100000000;
  }
  
  return tx;
}

// Fetch altezza di conferma
async function getConfirmationHeight(txid) {
  const response = await fetch(`https://mempool.space/api/tx/${txid}/status`);
  const status = await response.json();
  return status.confirmed ? status.block_height : -1;
}

// ============== FINGERPRINTING LOGIC ==============

const Wallets = {
  BITCOIN_CORE: "Bitcoin Core",
  ELECTRUM: "Electrum",
  BLUE_WALLET: "Blue Wallet",
  COINBASE: "Coinbase Wallet",
  EXODUS: "Exodus Wallet",
  TRUST: "Trust Wallet",
  TREZOR: "Trezor",
  LEDGER: "Ledger",
  UNCLEAR: "Unclear",
  OTHER: "Other"
};

function getSpendingTypes(tx) {
  return tx.vin.map(txIn => txIn.prevout?.scriptpubkey_type || 'unknown');
}

function getSendingTypes(tx) {
  return tx.vout.map(txOut => txOut.scriptpubkey_type);
}

function compressedPublicKeysOnly(tx) {
  const inputTypes = getSpendingTypes(tx);
  for (let i = 0; i < inputTypes.length; i++) {
    const inputType = inputTypes[i];
    if (inputType === "witness_v0_keyhash" || inputType === "v0_p2wpkh") {
      if (tx.vin[i].witness && tx.vin[i].witness[1] && tx.vin[i].witness[1][1] === '4') {
        return false;
      }
    } else if (inputType === "pubkeyhash" || inputType === "p2pkh") {
      const scriptsig = tx.vin[i].scriptsig_asm || tx.vin[i].scriptsig || '';
      const spaceIdx = scriptsig.indexOf(" ");
      if (spaceIdx >= 0 && scriptsig[spaceIdx + 2] === '4') {
        return false;
      }
    }
  }
  return true;
}

function lowROnly(tx) {
  const inputTypes = getSpendingTypes(tx);
  for (let i = 0; i < inputTypes.length; i++) {
    const inputType = inputTypes[i];
    try {
      if (inputType === "witness_v0_keyhash" || inputType === "v0_p2wpkh") {
        if (tx.vin[i].witness && tx.vin[i].witness[0]) {
          const rLen = tx.vin[i].witness[0].substring(6, 8);
          if (parseInt(rLen, 16) > 32) return false;
        }
      } else if (inputType === "pubkeyhash" || inputType === "p2pkh") {
        const scriptsig = tx.vin[i].scriptsig_asm || '';
        const parts = scriptsig.split(' ');
        if (parts.length > 1) {
          const signature = parts[1];
          const rLen = signature.substring(6, 8);
          if (parseInt(rLen, 16) > 32) return false;
        }
      }
    } catch (e) {
      // Ignora errori di parsing
    }
  }
  return true;
}

function getChangeIndex(tx) {
  const vout = tx.vout;
  if (vout.length === 1) return -1;
  
  const inputTypes = getSpendingTypes(tx);
  const outputTypes = getSendingTypes(tx);
  
  // Se tutti gli input sono dello stesso tipo e solo un output è di quel tipo
  if (new Set(inputTypes).size === 1) {
    const inputType = inputTypes[0];
    const matchingOutputs = outputTypes.filter(t => t === inputType);
    if (matchingOutputs.length === 1) {
      return outputTypes.indexOf(inputType);
    }
  }
  
  // Stesso indirizzo tra input e output
  const inputScriptPubKeys = tx.vin.map(v => v.prevout?.scriptpubkey).filter(Boolean);
  const outputScriptPubKeys = vout.map(v => v.scriptpubkey);
  const shared = outputScriptPubKeys.filter(s => inputScriptPubKeys.includes(s));
  
  if (shared.length === 1 && outputScriptPubKeys.filter(s => s === shared[0]).length === 1) {
    return outputScriptPubKeys.indexOf(shared[0]);
  }
  
  // Round amounts detection
  const outputAmounts = vout.map(v => Math.round(v.value * 100000000));
  const possibleIndex = [];
  for (let i = 0; i < outputAmounts.length; i++) {
    if (outputAmounts[i] % 100 !== 0) {
      possibleIndex.push(i);
    }
  }
  if (possibleIndex.length === 1) {
    return possibleIndex[0];
  }
  
  return -2; // Inconclusivo
}

function getOutputStructure(tx) {
  const vout = tx.vout;
  if (vout.length === 1) return ['SINGLE'];
  
  const structure = vout.length === 2 ? ['DOUBLE'] : ['MULTI'];
  
  // BIP-69 check
  const amounts = vout.map(v => v.value);
  const scripts = vout.map(v => v.scriptpubkey);
  
  if (new Set(amounts).size !== amounts.length) {
    // Duplicate amounts, check both
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const sortedScripts = [...scripts].sort();
    if (JSON.stringify(amounts) === JSON.stringify(sortedAmounts) && 
        JSON.stringify(scripts) === JSON.stringify(sortedScripts)) {
      structure.push('BIP69');
    }
  } else {
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    if (JSON.stringify(amounts) === JSON.stringify(sortedAmounts)) {
      structure.push('BIP69');
    }
  }
  
  return structure;
}

function hasMultiTypeVin(tx) {
  const inputTypes = getSpendingTypes(tx);
  return new Set(inputTypes).size > 1;
}

function addressReuse(tx) {
  const inputScriptPubKeys = tx.vin.map(v => v.prevout?.scriptpubkey).filter(Boolean);
  const outputScriptPubKeys = tx.vout.map(v => v.scriptpubkey);
  return inputScriptPubKeys.some(s => outputScriptPubKeys.includes(s));
}

function signalsRbf(tx) {
  return tx.vin.some(v => v.sequence < 0xffffffff);
}

function detectWallet(tx) {
  let possibleWallets = new Set([
    Wallets.BITCOIN_CORE,
    Wallets.ELECTRUM,
    Wallets.BLUE_WALLET,
    Wallets.COINBASE,
    Wallets.EXODUS,
    Wallets.TRUST,
    Wallets.TREZOR,
    Wallets.LEDGER
  ]);
  
  const reasoning = [];
  
  // Anti-fee-sniping (semplificato - locktime != 0)
  if (tx.locktime !== 0) {
    reasoning.push("Anti-fee-sniping");
    possibleWallets = new Set([Wallets.BITCOIN_CORE, Wallets.ELECTRUM]);
  } else {
    reasoning.push("No Anti-fee-sniping");
    possibleWallets.delete(Wallets.BITCOIN_CORE);
    possibleWallets.delete(Wallets.ELECTRUM);
  }
  
  // Compressed public keys
  if (!compressedPublicKeysOnly(tx)) {
    reasoning.push("Uncompressed public key(s)");
    possibleWallets.clear();
  } else {
    reasoning.push("All compressed public keys");
  }
  
  // nVersion
  if (tx.version === 1) {
    reasoning.push("nVersion = 1");
    possibleWallets.delete(Wallets.BITCOIN_CORE);
    possibleWallets.delete(Wallets.ELECTRUM);
    possibleWallets.delete(Wallets.BLUE_WALLET);
    possibleWallets.delete(Wallets.EXODUS);
    possibleWallets.delete(Wallets.COINBASE);
  } else if (tx.version === 2) {
    reasoning.push("nVersion = 2");
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.TREZOR);
    possibleWallets.delete(Wallets.TRUST);
  } else {
    reasoning.push("non-standard nVersion");
    possibleWallets.clear();
  }
  
  // Low-r grinding
  if (!lowROnly(tx)) {
    reasoning.push("Not low-r-grinding");
    possibleWallets.delete(Wallets.BITCOIN_CORE);
    possibleWallets.delete(Wallets.ELECTRUM);
  } else {
    reasoning.push("Low r signatures only");
  }
  
  // RBF
  if (signalsRbf(tx)) {
    reasoning.push("Signals RBF");
    possibleWallets.delete(Wallets.COINBASE);
    possibleWallets.delete(Wallets.EXODUS);
  } else {
    reasoning.push("Does not signal RBF");
    possibleWallets.delete(Wallets.BITCOIN_CORE);
    possibleWallets.delete(Wallets.ELECTRUM);
    possibleWallets.delete(Wallets.BLUE_WALLET);
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.TREZOR);
    possibleWallets.delete(Wallets.TRUST);
  }
  
  // Sending types
  const sendingTypes = getSendingTypes(tx);
  if (sendingTypes.includes("witness_v1_taproot") || sendingTypes.includes("v1_p2tr")) {
    reasoning.push("Sends to taproot");
    possibleWallets.delete(Wallets.COINBASE);
  }
  
  if (sendingTypes.includes("nulldata") || sendingTypes.includes("op_return")) {
    reasoning.push("OP_RETURN output");
    possibleWallets.delete(Wallets.COINBASE);
    possibleWallets.delete(Wallets.EXODUS);
    possibleWallets.delete(Wallets.BLUE_WALLET);
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.TRUST);
  }
  
  // Spending types
  const spendingTypes = getSpendingTypes(tx);
  if (spendingTypes.includes("witness_v1_taproot") || spendingTypes.includes("v1_p2tr")) {
    reasoning.push("Spends taproot");
    possibleWallets.delete(Wallets.COINBASE);
    possibleWallets.delete(Wallets.EXODUS);
    possibleWallets.delete(Wallets.ELECTRUM);
    possibleWallets.delete(Wallets.BLUE_WALLET);
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.TRUST);
  }
  
  if (spendingTypes.includes("pubkeyhash") || spendingTypes.includes("p2pkh")) {
    reasoning.push("Spends P2PKH");
    possibleWallets.delete(Wallets.EXODUS);
    possibleWallets.delete(Wallets.TRUST);
  }
  
  // Multi-type vin
  if (hasMultiTypeVin(tx)) {
    reasoning.push("Multi-type vin");
    possibleWallets.delete(Wallets.EXODUS);
    possibleWallets.delete(Wallets.ELECTRUM);
    possibleWallets.delete(Wallets.BLUE_WALLET);
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.TREZOR);
    possibleWallets.delete(Wallets.TRUST);
  }
  
  // Address reuse
  if (addressReuse(tx)) {
    reasoning.push("Address reuse");
    possibleWallets.delete(Wallets.COINBASE);
    possibleWallets.delete(Wallets.BITCOIN_CORE);
    possibleWallets.delete(Wallets.ELECTRUM);
    possibleWallets.delete(Wallets.BLUE_WALLET);
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.TREZOR);
  } else {
    reasoning.push("No address reuse");
    possibleWallets.delete(Wallets.EXODUS);
    possibleWallets.delete(Wallets.TRUST);
  }
  
  // Output structure
  const outputStructure = getOutputStructure(tx);
  if (outputStructure.includes('MULTI')) {
    reasoning.push("More than 2 outputs");
    possibleWallets.delete(Wallets.COINBASE);
    possibleWallets.delete(Wallets.EXODUS);
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.TRUST);
  }
  
  if (!outputStructure.includes('BIP69')) {
    reasoning.push("Not BIP-69 outputs");
    possibleWallets.delete(Wallets.ELECTRUM);
    possibleWallets.delete(Wallets.TREZOR);
  }
  
  // Change index
  const changeIndex = getChangeIndex(tx);
  if (changeIndex >= 0 && changeIndex !== tx.vout.length - 1) {
    reasoning.push("Change not last");
    possibleWallets.delete(Wallets.LEDGER);
    possibleWallets.delete(Wallets.BLUE_WALLET);
    possibleWallets.delete(Wallets.COINBASE);
  }
  
  // Determina il wallet finale
  let wallet;
  if (possibleWallets.size === 0) {
    wallet = Wallets.OTHER;
  } else if (possibleWallets.size === 1) {
    wallet = [...possibleWallets][0];
  } else {
    wallet = Wallets.UNCLEAR;
  }
  
  return { wallet, reasoning };
}

