// Popup script for Reactor Fingerprint Companion extension

document.addEventListener('DOMContentLoaded', async () => {
  const themeSelect = document.getElementById('theme-select');
  const langSelect = document.getElementById('lang-select');
  const docsLink = document.getElementById('open-docs');
  
  // Load saved settings (default: english, light theme)
  const settings = await chrome.storage.sync.get({ theme: 'light', lang: 'en' });
  
  // Apply theme
  if (settings.theme === 'dark') {
    document.body.classList.add('dark');
  }
  themeSelect.value = settings.theme;
  
  // Apply language
  langSelect.value = settings.lang;
  applyLanguage(settings.lang);
  
  // Theme change
  themeSelect.addEventListener('change', async () => {
    const theme = themeSelect.value;
    document.body.classList.toggle('dark', theme === 'dark');
    await chrome.storage.sync.set({ theme });
    
    // Notify content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_CHANGED', settings: { theme } });
      } catch (e) {}
    }
  });
  
  // Language change
  langSelect.addEventListener('change', async () => {
    const lang = langSelect.value;
    await chrome.storage.sync.set({ lang });
    applyLanguage(lang);
    
    // Notify content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_CHANGED', settings: { lang } });
      } catch (e) {}
    }
  });
  
  // Open documentation
  docsLink.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('docs.html') });
  });
  
  // Apply language to all elements with data-i18n attribute
  function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang]?.[key]) {
        el.innerHTML = translations[lang][key];
      }
    });
    
    // Update select options
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      const key = el.getAttribute('data-i18n-value');
      if (translations[lang]?.[key]) {
        el.textContent = translations[lang][key];
      }
    });
  }
});
