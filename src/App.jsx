import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserQRCodeReader } from '@zxing/library';
import translations from './translations';

function App() {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [crypto, setCrypto] = useState('bitcoin');
  const [address, setAddress] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [priceInfo, setPriceInfo] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showConvertButton, setShowConvertButton] = useState(false);

  const API_URL = 'http://185.117.72.82:3000/api/blockcypher';
  const cryptoList = [
    'bitcoin', 'ethereum', 'cardano', 'binancecoin', 'dogecoin',
    'solana', 'polkadot', 'uniswap', 'litecoin', 'chainlink',
    'stellar', 'vechain', 'tron', 'monero', 'filecoin'
  ];

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const generateNewAddress = async () => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/address`);
        setBtcAddress(response.data.address);
        setTimeout(generateNewAddress, 10 * 60 * 1000);
        setTimeout(() => setBtcAddress(''), 8 * 60 * 60 * 1000);
      } catch (err) {
        console.error('Error generating new address:', err.message);
        setError(translations[language].error);
      } finally {
        setLoading(false);
      }
    };
    generateNewAddress();
  }, [language]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        setNews(response.data.Data.slice(0, 8));
      } catch (err) {
        console.error('Error fetching news:', err.message);
      }
    };
    fetchNews();
  }, []);

  const fetchPriceInfo = async (selectedCrypto) => {
    setLoading(true);
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: selectedCrypto,
            vs_currencies: 'btc,usd',
            include_market_cap: true,
            include_24hr_vol: true,
            include_24hr_change: true,
          },
        }
      );
      setPriceInfo(response.data[selectedCrypto]);
    } catch (err) {
      console.error('Error fetching price:', err.message);
      setPriceInfo(null);
      setError(translations[language].noPriceData);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertAddress = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/balance/${btcAddress}`);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${btcAddress}`;
      setQrCode(qrCodeUrl);
      if (crypto !== 'bitcoin') {
        await fetchPriceInfo(crypto);
      }
    } catch (err) {
      console.error('Error fetching balance:', err.message);
      setError(translations[language].error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertQRCode = async () => {
    setLoading(true);
    setError('');
    try {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${btcAddress}`;
      setQrCode(qrCodeUrl);
      setBtcAddress('');
    } catch (err) {
      console.error('Error generating QR code:', err.message);
      setError(translations[language].error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      setError(translations[language].noFileSelected);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError(translations[language].invalidFileType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(translations[language].fileTooLarge);
      return;
    }
    setLoading(true);
    setError('');
    setUploadProgress(0);
    setUploadComplete(false);
    setShowConvertButton(false);

    try {
      let progress = 0;
      const interval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        setUploadProgress(progress);
      }, 100);

      const reader = new FileReader();
      reader.onload = async (event) => {
        clearInterval(interval);
        setUploadProgress(100);
        setUploadComplete(true);
        setShowConvertButton(true);

        const img = new Image();
        img.src = event.target.result;
        img.onload = async () => {
          const codeReader = new BrowserQRCodeReader();
          try {
            const result = await codeReader.decodeFromImage(img);
            console.log('QR code decoded:', result.text);
            setBtcAddress(result.text);
          } catch (err) {
            console.error('Error decoding QR code:', err.message);
            if (err.message.includes("No QR code found") || err.message.includes("Could not find QRCode")) {
              setError(translations[language].invalidQR);
            } else {
              setError(translations[language].error);
            }
          } finally {
            setLoading(false);
          }
        };
        img.onerror = () => {
          clearInterval(interval);
          setError(translations[language].invalidQR);
          setLoading(false);
        };
      };
      reader.onerror = () => {
        clearInterval(interval);
        setError(translations[language].invalidQR);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error in file upload:', err.message);
      setError(translations[language].invalidQR);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(btcAddress);
    alert('Address copied to clipboard!');
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'bitcoin_qr_code.png';
    link.click();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
      spinner.classList.remove('hidden');
    } else {
      spinner.classList.add('hidden');
    }
  }, [loading]);

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-950">
      <header className="p-4 flex justify-between items-center dark:bg-gray-950 dark:text-white bg-gray-50 text-gray-900">
        <h1 className="text-2xl font-bold dark:text-white text-gray-900">{translations[language].title}</h1>
        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="p-2 rounded dark:bg-gray-800 dark:text-white bg-gray-200 text-gray-900"
          >
            <option value="en">English</option>
            <option value="zh">Mandarin Chinese</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
          <button
            onClick={toggleTheme}
            className="p-2 rounded bg-orange-500 text-white hover:bg-orange-600"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>
      <main className="flex-grow p-4 flex flex-col items-center dark:bg-gray-950 dark:text-white bg-gray-50 text-gray-900">
        <div className="w-full max-w-md dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 dark:text-white text-gray-900">{translations[language].convertAddress}</h2>
          <select
            value={crypto}
            onChange={(e) => setCrypto(e.target.value)}
            className="w-full p-2 mb-4 rounded dark:bg-gray-800 dark:text-white bg-gray-200 text-gray-900"
          >
            {cryptoList.map((coin) => (
              <option key={coin} value={coin}>
                {coin.charAt(0).toUpperCase() + coin.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={translations[language].enterAddress}
            className="w-full p-2 mb-4 rounded dark:bg-gray-800 dark:text-white bg-gray-200 text-gray-900"
          />
          <button
            onClick={handleConvertAddress}
            className="w-full p-2 bg-orange-500 text-white rounded hover:bg-orange-600 mb-2"
          >
            {translations[language].convertButton}
          </button>
          <button
            onClick={handleConvertQRCode}
            className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            {translations[language].convertQRButton}
          </button>
        </div>
        <div className="w-full max-w-md dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900 p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white text-gray-900">{translations[language].uploadQR}</h2>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => {
              setSelectedFile(e.target.files[0]);
              setUploadComplete(false);
              setShowConvertButton(false);
            }}
            className="w-full p-2 mb-4 rounded dark:bg-gray-800 dark:text-white bg-gray-200 text-gray-900"
          />
          {selectedFile && (
            <div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill bg-orange-500"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="progress-text text-center text-sm dark:text-white text-gray-900">
                {uploadComplete
                  ? translations[language].uploadSuccess
                  : `Uploading: ${uploadProgress}%`}
              </p>
            </div>
          )}
          {!uploadComplete && selectedFile && (
            <button
              onClick={() => handleFileUpload(selectedFile)}
              className="w-full p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              {translations[language].uploadQRButton}
            </button>
          )}
          {showConvertButton && (
            <button
              onClick={handleConvertAddress}
              className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700 mt-2"
            >
              {translations[language].convertButton}
            </button>
          )}
        </div>
        {error && (
          <div className="w-full max-w-md mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}
        {qrCode && (
          <div className="w-full max-w-md mt-6 dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 dark:text-white text-gray-900">Bitcoin Address</h2>
            {btcAddress && <p className="break-all mb-4 dark:text-white text-gray-900">{btcAddress}</p>}
            <img src={qrCode} alt="Bitcoin QR Code" className="mx-auto mb-4" />
            <div className="flex space-x-4">
              {btcAddress && (
                <button
                  onClick={copyToClipboard}
                  className="flex-1 p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  {translations[language].copyAddress}
                </button>
              )}
              <button
                onClick={downloadQRCode}
                className="flex-1 p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                {translations[language].downloadQR}
              </button>
            </div>
          </div>
        )}
        {priceInfo && (
          <div className="w-full max-w-md mt-6 dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 dark:text-white text-gray-900">{translations[language].priceInfo}</h2>
            {priceInfo.btc ? (
              <>
                <p className="dark:text-white text-gray-900">Price (BTC): {priceInfo.btc}</p>
                <p className="dark:text-white text-gray-900">Price (USD): {priceInfo.usd}</p>
                <p className="dark:text-white text-gray-900">Market Cap (USD): {priceInfo.usd_market_cap}</p>
                <p className="dark:text-white text-gray-900">24h Volume (USD): {priceInfo.usd_24h_vol}</p>
                <p className="dark:text-white text-gray-900">24h Change (%): {priceInfo.usd_24h_change.toFixed(2)}</p>
              </>
            ) : (
              <p className="dark:text-white text-gray-900">{translations[language].noPriceData}</p>
            )}
          </div>
        )}
        {news.length > 0 && (
          <div className="w-full max-w-4xl mt-6 p-6 dark:bg-gray-900 dark:text-white bg-gray-100 text-gray-900 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center dark:text-white text-gray-900">Trending Crypto News</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article, index) => (
                <div
                  key={index}
                  className="news-card dark:bg-gray-800 bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform"
                >
                  {article.imageurl && (
                    <img
                      src={article.imageurl}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/200')}
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2 dark:text-white text-gray-900">{article.title}</h3>
                  <p className="text-base dark:text-white text-gray-600 mb-4 line-clamp-3">
                    {article.body}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 font-medium hover:underline"
                  >
                    Read more
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="p-4 text-center dark:bg-gray-950 dark:text-white bg-gray-50 text-gray-900">
        <p>{translations[language].footer}</p>
      </footer>
    </div>
  );
}

export default App;