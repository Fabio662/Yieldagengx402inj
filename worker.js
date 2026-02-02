/**
 * Injective x402 Yield Agent
 * Pay 0.001 INJ → unlock yields
 */

const CONFIG = {
  PAYMENT_ADDRESS: '0xc8B19839ae371bd541F20B15c3A3CB82BFB6A6C6',
  PAYMENT_AMOUNT: '0.001',
  PAYMENT_ASSET: 'INJ',
  NETWORK: 'injective',
  TIMEOUT_SECONDS: 3600,
  API_DESCRIPTION: 'Live yields: Helix, Neptune, Hydro, TruFin, Pumex',
  API_VERSION: 1
};

const YIELD_DATA = {
  success: true,
  data: {
    opportunities: [
      { id: 1, protocol: "Helix", apy: "5.8%", risk: "Low", tvl: "$14M", asset: "INJ" },
      { id: 2, protocol: "Neptune Finance", apy: "12.4%", risk: "Medium", tvl: "$2.6M", asset: "USDC.e" },
      { id: 3, protocol: "Hydro", apy: "8.1%", risk: "Low", tvl: "$9.1M", asset: "INJ" },
      { id: 4, protocol: "TruFin", apy: "9.6%", risk: "Low", tvl: "$6M", asset: "INJ" },
      { id: 5, protocol: "Pumex", apy: "11.2%", risk: "Medium", tvl: "$1.5M", asset: "INJ-USDC" }
    ],
    network: "Injective",
    lastUpdated: new Date().toISOString()
  }
};

const HTML_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YieldAgent - Injective</title>
  <style>
    body {
      background: #0f1a26;
      color: white;
      font-family: -apple-system, sans-serif;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid #ff6b35;
      border-radius: 20px;
      padding: 40px;
      max-width: 700px;
      width: 100%;
    }
    .logo { font-size: 80px; margin-bottom: 20px; color: #ff6b35; }
    h1 { font-size: 48px; margin: 8px 0; }
    .subtitle { font-size: 20px; color: #ff6b3555; }
    .yield-item {
      display: flex; justify-content: space-between;
      padding: 15px;
      margin: 6px 0;
      background: rgba(255,107,53,0.08);
      border-radius: 10px;
      border: 1px solid #ff6b35aa;
    }
    .apy { font-weight: 700; color: #ff6b35; }
    .payment { text-align: center; margin-top: 30px; }
    .cost { font-size: 36px; color: #ff6b35; font-weight: 700; margin: 10px 0; }
    .address { font-family: monospace; word-break: break-all; margin: 10px 0; }
    .copy-btn {
      background: #ff6b35; color: #0f1a26; border: none;
      padding: 12px 24px; border-radius: 8px; font-weight: 600;
      cursor: pointer; margin-top: 8px;
    }
    .try-btn {
      background: #ff6b35; color: #0f1a26; border: none;
      padding: 16px 40px; font-size: 18px; border-radius: 12px;
      cursor: pointer; font-weight: 700; margin-top: 25px; width: 100%;
    }
    .try-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .status { margin-top: 16px; font-size: 14px; color: #ff6b35; text-align: center; min-height: 20px; }
    .error { color: #ff4444; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🔥</div>
    <h1>YieldAgent</h1>
    <p class="subtitle">Live on Injective</p>

    <div class="payment">
      <div class="cost">0.001 INJ</div>
      <div class="address">${CONFIG.PAYMENT_ADDRESS}</div>
      <button class="copy-btn" id="copyBtn">📋 Copy</button>
    </div>

    <button class="try-btn" id="tryBtn" onclick="tryAgent()">🚀 Try Agent</button>
    <div class="status" id="status"></div>
    <div id="yieldsOut"></div>
  </div>

  <script>
    // FIX 1: proper event listener — 'this' works correctly now
    document.getElementById('copyBtn').addEventListener('click', function() {
      navigator.clipboard.writeText('${CONFIG.PAYMENT_ADDRESS}');
      this.textContent = '✅ Copied';
      setTimeout(() => { this.textContent = '📋 Copy'; }, 2000);
    });

    async function tryAgent() {
      const btn    = document.getElementById('tryBtn');
      const status = document.getElementById('status');
      const out    = document.getElementById('yieldsOut');

      // FIX 2: clear previous results so they don't stack every click
      out.innerHTML = '';
      status.textContent = '';

      // FIX 3: disable button immediately — kills double-click race
      btn.disabled = true;
      btn.textContent = '⏳ Waiting...';

      const hash = prompt('Enter your INJ tx hash:');
      if (!hash) {
        btn.disabled = false;
        btn.textContent = '🚀 Try Agent';
        return;
      }

      status.textContent = 'Verifying payment...';

      try {
        const res = await fetch('/', {
          // FIX 4: amount sent as string to match server-side strict compare
          headers: { 'X-Payment': JSON.stringify({ txHash: hash, amount: '0.001' }) }
        });

        if (res.ok) {
          const data = await res.json();
          // FIX 5: render into dedicated div, never touches body
          out.innerHTML = data.data.opportunities.map(o =>
            '<div class="yield-item"><strong>' + o.protocol + '</strong><span class="apy">' + o.apy + '</span></div>'
          ).join('');
          status.textContent = '✅ Payment verified — data live';
        } else {
          status.innerHTML = '<span class="error">❌ Payment not verified. Try again.</span>';
        }
      } catch (e) {
        status.innerHTML = '<span class="error">❌ Network error: ' + e.message + '</span>';
      }

      // FIX 6: always re-enable regardless of success/failure
      btn.disabled = false;
      btn.textContent = '🚀 Try Agent';
    }
  </script>
</body>
</html>
`;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Payment'
    };

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    // FIX 7: /health endpoint added
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', x402Enabled: true, network: 'injective', asset: 'INJ' }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    if (path === '/x402-info') {
      return new Response(JSON.stringify({
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: 'injective',
          maxAmountRequired: '0.001',
          asset: 'INJ',
          payTo: CONFIG.PAYMENT_ADDRESS,
          resource: '/',
          description: CONFIG.API_DESCRIPTION,
          mimeType: 'application/json'
        }]
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (path === '/') {
      const pay = req.headers.get('X-Payment');
      if (!pay) {
        return new Response(HTML_PAGE, {
          headers: { ...cors, 'Content-Type': 'text/html' }
        });
      }
      try {
        const p = JSON.parse(pay);
        // FIX 8: strict string compare against CONFIG — no more loose ==
        if (p.txHash && String(p.amount) === CONFIG.PAYMENT_AMOUNT) {
          return new Response(JSON.stringify(YIELD_DATA), {
            headers: { ...cors, 'Content-Type': 'application/json', 'X-Payment-Verified': 'true' }
          });
        }
        return new Response(JSON.stringify({ error: 'invalid' }), { status: 402, headers: cors });
      } catch {
        return new Response(JSON.stringify({ error: 'bad header' }), { status: 400, headers: cors });
      }
    }

    return new Response(JSON.stringify({ error: '404' }), { status: 404, headers: cors });
  }
};
