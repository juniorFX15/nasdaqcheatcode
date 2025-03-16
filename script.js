document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded and parsed");

    const splashDiv = document.getElementById('splash');
    const loginDiv = document.getElementById('login');
    const appDiv = document.getElementById('app');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const loginCodeInput = document.getElementById('loginCode');
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');

    const correctCode = "SBONGISENI15@"; // Updated login code (all caps)
    const maxAttempts = 10; // Block after 10 wrong attempts

    // Load attempts from localStorage or initialize to 0
    let attempts = parseInt(localStorage.getItem('loginAttempts')) || 0;

    // Redirect to YouTube channel on subscribe button click
    subscribeBtn.addEventListener('click', function () {
        window.location.href = 'https://www.youtube.com/@bestStrategy-c5i';
    });

    // Hide splash div and show login div after 10 seconds
    setTimeout(function () {
        splashDiv.style.display = 'none';
        loginDiv.style.display = 'block';

        // Check if the app is already blocked
        if (attempts >= maxAttempts) {
            loginMessage.innerHTML = 'The app is blocked. Please contact support.';
            loginMessage.classList.add('blocked'); // Add red color
            loginCodeInput.disabled = true;
            loginBtn.disabled = true;
        }
    }, 10000); // 10 seconds delay

    // Login button click event
    loginBtn.addEventListener('click', function () {
        const enteredCode = loginCodeInput.value.trim();

        if (enteredCode === correctCode) {
            // Reset attempts on successful login
            attempts = 0;
            localStorage.setItem('loginAttempts', attempts);

            loginDiv.style.display = 'none';
            appDiv.style.display = 'block';
            startApp();
        } else {
            attempts++;
            localStorage.setItem('loginAttempts', attempts); // Save attempts to localStorage

            if (attempts >= maxAttempts) {
                loginMessage.innerHTML = 'The app is blocked. Please contact support.';
                loginMessage.classList.add('blocked'); // Add red color
                loginCodeInput.disabled = true;
                loginBtn.disabled = true;
            } else {
                loginCodeInput.classList.add('shake'); // Add shake animation
                loginMessage.innerHTML = `Wrong Code. ${maxAttempts - attempts} attempts remaining.`;
                setTimeout(() => {
                    loginCodeInput.classList.remove('shake'); // Remove shake animation
                }, 500);
            }
        }
    });
});

// Cache object to store fetched data
let cache = {
    data: null,
    timestamp: null,
};

function startApp() {
    console.log("App started");

    const ger30Status = document.getElementById('ger30Status');
    const ger30Countdown = document.getElementById('ger30Countdown');
    const ger30Candle = document.getElementById('ger30Candle');
    const nasdaqSignal = document.getElementById('nasdaqSignal');
    const nasdaqStrength = document.getElementById('nasdaqStrength');
    const nasdaqCountdown = document.getElementById('nasdaqCountdown');
    const nasdaqCandle = document.getElementById('nasdaqCandle');

    // Get the current day of the week
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's a weekend (Saturday or Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        ger30Status.innerHTML = 'Market is Closed';
        ger30Countdown.innerHTML = 'Countdown: 00:00';
        nasdaqSignal.innerHTML = 'Signal: Market Closed';
        nasdaqStrength.innerHTML = 'Signal Strength: -';
        nasdaqCountdown.innerHTML = 'Countdown: 00:00';
        return;
    }

    // Define the target times for GER30 and NASDAQ
    const ger30Time = '08:55:00'; // GER30 signal time (updated)
    const ger30EndTime = '09:30:00'; // GER30 signal end time (updated)
    const nasdaqTime = '15:27:00'; // NASDAQ signal time (updated)
    const nasdaqEndTime = '16:30:00'; // NASDAQ signal end time (updated)

    // Start countdowns
    startCountdown(ger30Time, ger30Countdown, 'GER30');
    startCountdown(nasdaqTime, nasdaqCountdown, 'NASDAQ');

    // Check if GER30 signal should be displayed
    const now = new Date();
    const ger30Target = new Date(now.toDateString() + ' ' + ger30Time);
    const ger30End = new Date(now.toDateString() + ' ' + ger30EndTime);

    if (now >= ger30Target && now < ger30End) {
        fetchData('GER30', ger30Status, ger30Candle);
    } else {
        ger30Status.innerHTML = 'Market is Closed';
        ger30Candle.style.display = 'none';
    }

    // Check if NASDAQ signal should be displayed
    const nasdaqTarget = new Date(now.toDateString() + ' ' + nasdaqTime);
    const nasdaqEnd = new Date(now.toDateString() + ' ' + nasdaqEndTime);

    if (now >= nasdaqTarget && now < nasdaqEnd) {
        fetchData('NASDAQ', nasdaqSignal, nasdaqCandle);
    } else {
        nasdaqSignal.innerHTML = 'Signal: Hidden';
        nasdaqStrength.innerHTML = 'Signal Strength: -';
        nasdaqCandle.style.display = 'none';
    }
}

function startCountdown(targetTime, element, market) {
    const interval = setInterval(function () {
        const now = new Date();
        const target = new Date(now.toDateString() + ' ' + targetTime);

        if (now > target) {
            target.setDate(target.getDate() + 1);
        }

        const diff = target - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        element.innerHTML = `Countdown: ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

function fetchData(market, signalElement, candleElement) {
    console.log(`Fetching data for ${market}...`);

    // Check if cached data is still valid (1 minute cache)
    const now = new Date();
    if (cache.data && cache.timestamp && now - cache.timestamp < 60000) { // 1 minute cache
        console.log("Using cached data");
        updateUI(cache.data, signalElement, candleElement);
        return;
    }

    // List of U.S. market stocks for NASDAQ
    const stocks = ['AAPL', 'TSLA', 'AMZN', 'META', 'NVDA', 'GOOGL', 'MSFT']; // Add more as needed
    const finnhubApiKey = 'csq4hdhr01qj9q8na840csq4hdhr01qj9q8na84g'; // Replace with your valid API key

    let buyCount = 0;
    let sellCount = 0;
    let totalChange = 0;

    // Fetch data for each stock
    Promise.all(stocks.map(symbol => {
        const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`;
        return fetch(finnhubUrl)
            .then(response => response.json())
            .then(data => {
                console.log(`Data received for ${symbol}:`, data); // Debugging: Log API response
                return data;
            });
    }))
        .then(dataArray => {
            console.log("Data received for all stocks:", dataArray); // Debugging: Log all data

            dataArray.forEach(data => {
                const priceChangePercent = data.dp; // Daily percentage change

                if (priceChangePercent > 0) {
                    buyCount++;
                } else {
                    sellCount++;
                }

                // Accumulate total change for strength calculation
                totalChange += Math.abs(priceChangePercent);
            });

            // Determine the overall signal and strength
            const result = {
                signal: buyCount > sellCount ? 'Buy' : 'Sell',
                strength: calculateStrength(totalChange / stocks.length),
            };

            // Cache the result
            cache.data = result;
            cache.timestamp = new Date();

            // Update UI
            updateUI(result, signalElement, candleElement);
        })
        .catch(error => console.error("Error fetching data:", error));
}

function calculateStrength(averageChange) {
    if (averageChange > 2) {
        return 'Strong';
    } else if (averageChange > 1) {
        return 'Medium';
    } else {
        return 'Weak';
    }
}

function updateUI(result, signalElement, candleElement) {
    const { signal, strength } = result;

    // Update UI
    signalElement.innerHTML = `Signal: ${signal}`;
    signalElement.setAttribute('data-strength', strength.toLowerCase());
    candleElement.classList.remove('blink-green', 'blink-red');
    if (signal === 'Buy') {
        candleElement.classList.add('blink-green');
    } else {
        candleElement.classList.add('blink-red');
    }
    candleElement.style.display = 'block';

    // Display signal strength
    const strengthElement = document.getElementById('nasdaqStrength');
    strengthElement.innerHTML = `Signal Strength: ${strength}`;
}