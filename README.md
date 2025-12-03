# Chainalysis Wallet Fingerprint 🔍

Estensione Chrome che intercetta le transazioni visualizzate su **Chainalysis Reactor** e analizza automaticamente quale wallet Bitcoin è stato utilizzato per crearle.

## ✨ Funzionalità

- 🔄 **Intercettazione automatica** delle transazioni dalla API di Chainalysis
- 🔍 **Analisi con un click** direttamente nella pagina
- 📊 **Visualizzazione percentuali** dei wallet identificati
- 🔗 **Link a mempool.space** per ogni transazione
- 🎨 **UI moderna** con tema Bitcoin

## 🚀 Installazione

### Chrome / Brave / Edge

1. Scarica o clona questo repository:
   ```bash
   git clone https://github.com/tuouser/chainalysis-wallet-fingerprint.git
   ```

2. Apri il browser e vai su:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`

3. Attiva la **Modalità sviluppatore** (toggle in alto a destra)

4. Clicca su **Carica estensione non pacchettizzata**

5. Seleziona la cartella del repository

6. L'estensione apparirà nella barra degli strumenti con l'icona 🔍

## 📖 Come Usare

1. **Accedi a Chainalysis Reactor** (`reactor.chainalysis.com`)

2. **Naviga** verso un'entità o indirizzo Bitcoin

3. **Clicca** sull'entità per vedere i trasferimenti

4. L'estensione **intercetta automaticamente** le transazioni dalla risposta API

5. **Clicca sul pulsante 🔍** che appare in basso a destra della pagina

6. **Premi "Analizza Wallet"** per avviare l'analisi

7. Visualizza i **risultati** con le percentuali dei wallet identificati

## 🔬 Come Funziona

### Intercettazione

L'estensione intercetta le chiamate API di Chainalysis che hanno questo formato:
```
https://reactor.chainalysis.com/api/v2/cluster/.../transfers
```

La risposta contiene gli hash delle transazioni:
```json
[
  {
    "hash": "00b80f122329d7332382297d39184cb56f70d06213c73c5ab00c5d3f5a783140",
    "datetime": 1620684473,
    "valueFp": "1.173977",
    ...
  }
]
```

### Analisi

Per ogni hash di transazione:
1. Recupera i dettagli completi da **mempool.space** API (gratuita)
2. Analizza le caratteristiche della transazione
3. Applica le euristiche di fingerprinting
4. Identifica il wallet più probabile

### Euristiche Utilizzate

- **Anti-fee-sniping** (locktime)
- **nVersion** della transazione (1 o 2)
- **Low-r signature grinding**
- **RBF signaling**
- **Tipi di input/output** (P2PKH, P2WPKH, P2TR, etc.)
- **Ordinamento BIP-69**
- **Riutilizzo degli indirizzi**
- **Posizione del change output**

## 🎯 Wallet Supportati

| Icona | Wallet | Caratteristiche Chiave |
|-------|--------|----------------------|
| 🟠 | Bitcoin Core | Anti-fee-sniping, nVersion=2, low-r, RBF |
| ⚡ | Electrum | Anti-fee-sniping, BIP-69, nVersion=2 |
| 🔵 | Blue Wallet | nVersion=2, RBF, change last |
| 🔷 | Coinbase | nVersion=2, no RBF |
| 🟣 | Exodus | nVersion=2, no RBF, address reuse |
| 🛡️ | Trust | nVersion=1 |
| 🔒 | Trezor | nVersion=1, BIP-69 |
| 📟 | Ledger | nVersion=1, historical order |

## 📁 Struttura File

```
chainalysis-wallet-fingerprint/
├── manifest.json      # Configurazione estensione (Manifest V3)
├── background.js      # Service worker (intercetta & analizza)
├── content.js         # Script iniettato nella pagina
├── styles.css         # Stili del pannello UI
├── popup.html         # Popup dell'estensione
├── popup.js           # Logica popup
├── icons/             # Icone (16, 48, 128 px)
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # Documentazione
```

## ⚠️ Privacy & Sicurezza

- ✅ L'estensione **non invia dati** a server esterni (eccetto mempool.space per i dati delle transazioni)
- ✅ Tutte le analisi avvengono **localmente** nel browser
- ✅ Non vengono salvati dati su disco
- ✅ L'estensione funziona **solo** su `reactor.chainalysis.com`
- ✅ Codice **open source** e verificabile

## 🐛 Debug

Apri la console sviluppatori (F12) su Chainalysis per vedere i log:
```
[BTC Fingerprint] Intercettate transazioni: 25
[BTC Fingerprint] Extension caricata
```

Per debug del background script:
1. Vai su `chrome://extensions/`
2. Trova l'estensione
3. Clicca su "Service worker" per aprire DevTools

## 📝 Note

- Richiede accesso a **Chainalysis Reactor** (account necessario)
- Le transazioni vengono analizzate una alla volta per evitare rate limiting
- I risultati sono **probabilistici**, non deterministici
- Wallet personalizzati o non standard potrebbero essere classificati come "Other"

## 🔗 Progetti Correlati

- [bitcoin-fingerprint](https://github.com/tuouser/bitcoin-fingerprint) - Tool Python per l'analisi da linea di comando

## 📚 Risorse

- [Bitcoin Privacy Wiki](https://en.bitcoin.it/wiki/Privacy)
- [BIP-69: Lexicographical Indexing](https://github.com/bitcoin/bips/blob/master/bip-0069.mediawiki)
- [Mempool.space API](https://mempool.space/docs/api)

## 📄 Licenza

MIT License

---

**Disclaimer**: Questo tool è fornito solo a scopo educativo e di ricerca. L'uso è sotto la responsabilità dell'utente.
