/**
 * Main Script untuk SkipLink Web
 * Mengontrol UI dan interaksi pengguna
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const urlInput = document.getElementById('urlInput');
    const pasteBtn = document.getElementById('pasteBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleKeyBtn = document.getElementById('toggleKeyBtn');
    const keyInputWrapper = document.getElementById('keyInputWrapper');
    const bypassBtn = document.getElementById('bypassBtn');
    const loader = document.getElementById('loader');
    const resultSection = document.getElementById('resultSection');
    const originalUrlElement = document.getElementById('originalUrl');
    const bypassedUrlElement = document.getElementById('bypassedUrl');
    const copyBtn = document.getElementById('copyBtn');
    const openBtn = document.getElementById('openBtn');
    const resetBtn = document.getElementById('resetBtn');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    // State
    let isProcessing = false;
    let currentBypassedUrl = '';
    let isApiKeyVisible = false;

    // Inisialisasi
    initApp();

    /**
     * Inisialisasi aplikasi
     */
    function initApp() {
        // Load API key dari localStorage
        const savedApiKey = localStorage.getItem('skipLink_apiKey');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
            skipLinkAPI.setApiKey(savedApiKey);
        }

        // Load riwayat
        loadHistory();

        // Event Listeners
        setupEventListeners();

        // Validasi awal input
        validateInput();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Paste button
        pasteBtn.addEventListener('click', handlePaste);

        // Toggle API key
        toggleKeyBtn.addEventListener('click', toggleApiKeyInput);

        // Input validation
        urlInput.addEventListener('input', validateInput);
        apiKeyInput.addEventListener('input', handleApiKeyChange);

        // Bypass button
        bypassBtn.addEventListener('click', handleBypass);

        // Result actions
        copyBtn.addEventListener('click', handleCopy);
        openBtn.addEventListener('click', handleOpen);
        resetBtn.addEventListener('click', handleReset);

        // History
        clearHistoryBtn.addEventListener('click', handleClearHistory);

        // Enter key untuk bypass
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !isProcessing && bypassBtn.disabled === false) {
                handleBypass();
            }
        });

        // Drag and drop untuk paste URL
        setupDragAndDrop();
    }

    /**
     * Handle paste dari clipboard
     */
    async function handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                urlInput.value = text;
                validateInput();
                
                // Show notification
                showNotification('URL berhasil dipaste!', 'success');
            }
        } catch (err) {
            // Fallback menggunakan prompt
            const text = prompt('Masukkan URL yang ingin dipaste:');
            if (text) {
                urlInput.value = text;
                validateInput();
            }
        }
    }

    /**
     * Toggle tampilan input API key
     */
    function toggleApiKeyInput() {
        isApiKeyVisible = !isApiKeyVisible;
        
        if (isApiKeyVisible) {
            keyInputWrapper.classList.add('show');
            toggleKeyBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            apiKeyInput.focus();
        } else {
            keyInputWrapper.classList.remove('show');
            toggleKeyBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }

    /**
     * Handle perubahan API key
     */
    function handleApiKeyChange() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!skipLinkAPI.validateApiKeyFormat(apiKey) && apiKey !== '') {
            showNotification('Format API key tidak valid! Harus diawali "fgsiapi-"', 'error');
            apiKeyInput.style.borderColor = 'var(--error)';
        } else {
            skipLinkAPI.setApiKey(apiKey);
            apiKeyInput.style.borderColor = 'rgba(0, 210, 255, 0.3)';
            
            if (apiKey !== '') {
                showNotification('API key disimpan!', 'success');
            }
        }
    }

    /**
     * Validasi input URL
     */
    function validateInput() {
        const url = urlInput.value.trim();
        
        if (!url) {
            bypassBtn.disabled = true;
            bypassBtn.style.opacity = '0.7';
            return;
        }

        const validation = skipLinkAPI.validateURL(url);
        
        if (validation.isValid) {
            bypassBtn.disabled = false;
            bypassBtn.style.opacity = '1';
            urlInput.style.borderColor = 'var(--success)';
        } else {
            bypassBtn.disabled = true;
            bypassBtn.style.opacity = '0.7';
            urlInput.style.borderColor = 'var(--error)';
        }
    }

    /**
     * Handle proses bypass
     */
    async function handleBypass() {
        if (isProcessing) return;

        const url = urlInput.value.trim();
        if (!url) return;

        const validation = skipLinkAPI.validateURL(url);
        if (!validation.isValid) {
            showNotification(validation.message, 'error');
            return;
        }

        // Mulai proses
        isProcessing = true;
        bypassBtn.disabled = true;
        loader.style.display = 'block';
        bypassBtn.innerHTML = '<i class="fas fa-rocket"></i> Memproses...';

        try {
            // Tampilkan loading state
            resultSection.style.opacity = '0.7';
            
            // Panggil API
            const result = await skipLinkAPI.bypassLink(url);

            if (result.success) {
                // Tampilkan hasil
                originalUrlElement.textContent = result.originalUrl;
                bypassedUrlElement.textContent = result.bypassedUrl;
                currentBypassedUrl = result.bypassedUrl;

                // Tambahkan ke riwayat
                const historyItem = skipLinkAPI.addToHistory(result.originalUrl, result.bypassedUrl);
                addHistoryItemToUI(historyItem);

                // Scroll ke hasil
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Tampilkan notifikasi
                showNotification('Link berhasil dibypass! 🎉', 'success');
            } else {
                showNotification(`Gagal: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Terjadi kesalahan saat memproses link', 'error');
        } finally {
            // Reset state
            isProcessing = false;
            bypassBtn.disabled = false;
            loader.style.display = 'none';
            bypassBtn.innerHTML = '<i class="fas fa-rocket"></i> Bypass Link';
            resultSection.style.opacity = '1';
        }
    }

    /**
     * Handle copy link
     */
    async function handleCopy() {
        if (!currentBypassedUrl) {
            showNotification('Tidak ada link untuk disalin', 'warning');
            return;
        }

        const success = await skipLinkAPI.copyToClipboard(currentBypassedUrl);
        
        if (success) {
            // Animasi tombol copy
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
            copyBtn.style.background = 'linear-gradient(45deg, #00ff88, #00d2ff)';
            
            showNotification('Link berhasil disalin ke clipboard!', 'success');
            
            // Reset tombol setelah 2 detik
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy Link';
                copyBtn.style.background = 'linear-gradient(45deg, var(--primary), var(--accent))';
            }, 2000);
        } else {
            showNotification('Gagal menyalin link', 'error');
        }
    }

    /**
     * Handle open link
     */
    function handleOpen() {
        if (!currentBypassedUrl) {
            showNotification('Tidak ada link untuk dibuka', 'warning');
            return;
        }

        // Buka di tab baru
        window.open(currentBypassedUrl, '_blank');
        
        // Animasi tombol open
        openBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Membuka...';
        openBtn.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            openBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Buka Link';
            openBtn.style.transform = 'scale(1)';
        }, 1000);
    }

    /**
     * Handle reset
     */
    function handleReset() {
        urlInput.value = '';
        originalUrlElement.textContent = '-';
        bypassedUrlElement.textContent = '-';
        currentBypassedUrl = '';
        
        validateInput();
        
        // Focus ke input
        urlInput.focus();
        
        showNotification('Form berhasil direset', 'info');
    }

    /**
     * Load riwayat dari localStorage
     */
    function loadHistory() {
        const history = skipLinkAPI.getHistory();
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-item" style="text-align: center; color: var(--gray);">
                    <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Belum ada riwayat bypass</p>
                </div>
            `;
            return;
        }

        history.forEach(item => {
            addHistoryItemToUI(item);
        });
    }

    /**
     * Tambahkan item riwayat ke UI
     */
    function addHistoryItemToUI(item) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;
        
        historyItem.innerHTML = `
            <div class="history-original">${truncateText(item.originalUrl, 60)}</div>
            <div class="history-result">${truncateText(item.bypassedUrl, 60)}</div>
            <div class="history-time">${item.timeDisplay}</div>
        `;

        // Klik untuk mengisi ulang
        historyItem.addEventListener('click', () => {
            urlInput.value = item.originalUrl;
            validateInput();
            
            originalUrlElement.textContent = item.originalUrl;
            bypassedUrlElement.textContent = item.bypassedUrl;
            currentBypassedUrl = item.bypassedUrl;
            
            showNotification('Riwayat dimuat ulang', 'info');
        });

        // Tambahkan di awal
        if (historyList.firstChild && historyList.firstChild.classList.contains('history-item')) {
            historyList.insertBefore(historyItem, historyList.firstChild);
        } else {
            historyList.appendChild(historyItem);
        }
    }

    /**
     * Handle clear history
     */
    function handleClearHistory() {
        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat?')) {
            skipLinkAPI.clearHistory();
            loadHistory();
            showNotification('Riwayat berhasil dihapus', 'info');
        }
    }

    /**
     * Setup drag and drop untuk URL
     */
    function setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop area
        ['dragenter', 'dragover'].forEach(eventName => {
            urlInput.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            urlInput.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            urlInput.style.borderColor = 'var(--secondary)';
            urlInput.style.boxShadow = '0 0 20px rgba(0, 210, 255, 0.5)';
        }

        function unhighlight(e) {
            urlInput.style.borderColor = '';
            urlInput.style.boxShadow = '';
        }

        // Handle drop
        urlInput.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const text = dt.getData('text');
            
            if (text) {
                const url = skipLinkAPI.extractURL(text);
                if (url) {
                    urlInput.value = url;
                    validateInput();
                    showNotification('URL berhasil di-drop!', 'success');
                } else {
                    showNotification('Tidak ditemukan URL dalam teks yang di-drop', 'warning');
                }
            }
        }
    }

    /**
     * Tampilkan notifikasi
     */
    function showNotification(message, type = 'info') {
        // Set warna berdasarkan tipe
        const colors = {
            success: '#00ff88',
            error: '#ff4757',
            warning: '#ffcc00',
            info: '#00d2ff'
        };

        notification.style.background = colors[type] || colors.info;
        notificationText.textContent = message;

        // Tampilkan
        notification.classList.add('show');

        // Sembunyikan setelah 3 detik
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Potong teks jika terlalu panjang
     */
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Public functions untuk debugging
    window.skipLinkApp = {
        api: skipLinkAPI,
        showNotification,
        handleBypass,
        handleReset
    };
});