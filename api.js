/**
 * API Handler untuk SkipLink
 * name feature : skiplink
 * link api : fgsi.dpdns.org
 * creator: Z7
 * linkch utama: https://whatsapp.com/channel/0029VbBt4432f3ENa8ULoM1J
 * linkch kedua : https://whatsapp.com/channel/0029Vb6pfuzJf05iZHfkli44
 */

class SkipLinkAPI {
    constructor() {
        this.baseURL = 'https://fgsi.dpdns.org/api/tools/skip/tutwuri';
        this.defaultApiKey = 'fgsiapi-3b79fce5-6d';
        this.requestCount = parseInt(localStorage.getItem('skipLink_requestCount')) || 0;
        this.updateRequestCount();
    }

    /**
     * Mendapatkan API key yang sedang digunakan
     */
    getApiKey() {
        const userApiKey = localStorage.getItem('skipLink_apiKey');
        return userApiKey && userApiKey.trim() !== '' ? userApiKey : this.defaultApiKey;
    }

    /**
     * Menyimpan API key pengguna
     */
    setApiKey(apiKey) {
        if (apiKey && apiKey.trim() !== '') {
            localStorage.setItem('skipLink_apiKey', apiKey.trim());
        } else {
            localStorage.removeItem('skipLink_apiKey');
        }
    }

    /**
     * Mengekstrak URL dari teks
     */
    extractURL(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const match = text.match(urlRegex);
        return match ? match[0] : null;
    }

    /**
     * Validasi URL
     */
    validateURL(url) {
        try {
            const urlObj = new URL(url);
            const allowedDomains = ['sfl.gl', 'safelinkku.com', 'tutwuri.id', 'safelink'];
            
            // Check if domain contains any of the allowed domains
            const domain = urlObj.hostname;
            const isValid = allowedDomains.some(allowed => domain.includes(allowed));
            
            return {
                isValid,
                domain,
                message: isValid ? 'URL valid' : 'URL bukan dari safelink yang didukung'
            };
        } catch (error) {
            return {
                isValid: false,
                domain: null,
                message: 'Format URL tidak valid'
            };
        }
    }

    /**
     * Melakukan bypass link
     */
    async bypassLink(url) {
        try {
            const apiKey = this.getApiKey();
            const encodedUrl = encodeURIComponent(url);
            const apiUrl = `${this.baseURL}?apikey=${apiKey}&url=${encodedUrl}`;

            console.log(`Mengirim request ke: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'SkipLink-Web/1.0.0'
                },
                timeout: 30000
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Update request count
            this.requestCount++;
            localStorage.setItem('skipLink_requestCount', this.requestCount.toString());
            this.updateRequestCount();

            if (!data || !data.status) {
                throw new Error(data?.message || 'Gagal bypass link (API error)');
            }

            const result = data?.data?.url;
            if (!result) {
                throw new Error('URL hasil tidak ditemukan');
            }

            return {
                success: true,
                originalUrl: url,
                bypassedUrl: result,
                data: data
            };

        } catch (error) {
            console.error('Error bypassing link:', error);
            return {
                success: false,
                error: error.message,
                originalUrl: url
            };
        }
    }

    /**
     * Menambah riwayat bypass
     */
    addToHistory(originalUrl, bypassedUrl) {
        const history = this.getHistory();
        const historyItem = {
            id: Date.now(),
            originalUrl,
            bypassedUrl,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        // Tambahkan ke awal array
        history.unshift(historyItem);

        // Simpan maksimal 50 riwayat
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem('skipLink_history', JSON.stringify(history));
        return historyItem;
    }

    /**
     * Mendapatkan riwayat bypass
     */
    getHistory() {
        const history = localStorage.getItem('skipLink_history');
        return history ? JSON.parse(history) : [];
    }

    /**
     * Menghapus riwayat bypass
     */
    clearHistory() {
        localStorage.removeItem('skipLink_history');
        return [];
    }

    /**
     * Menyalin teks ke clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback untuk browser lama
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Memperbarui tampilan jumlah request
     */
    updateRequestCount() {
        const countElement = document.getElementById('requestCount');
        if (countElement) {
            countElement.textContent = this.requestCount.toLocaleString();
        }
    }

    /**
     * Mengecek apakah API key valid (format dasar)
     */
    validateApiKeyFormat(apiKey) {
        if (!apiKey || apiKey.trim() === '') return true; // Gunakan default
        return apiKey.startsWith('fgsiapi-');
    }
}

// Export instance
const skipLinkAPI = new SkipLinkAPI();