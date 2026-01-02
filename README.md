# Trading Web Monitor

Website untuk menampilkan data akun trading dari MetaTrader 5.

## Setup

### 1. Deploy ke GitHub Pages

1. Push repository ini ke GitHub
2. Go to Settings → Pages
3. Source: Deploy from branch
4. Branch: main, folder: / (root)
5. Save

### 2. Konfigurasi

Edit file `js/config.js`:

```javascript
const CONFIG = {
    // Ganti USERNAME dengan username GitHub kamu
    DATA_URL: 'https://raw.githubusercontent.com/USERNAME/trading-data/main/accounts/account.json',

    // Interval refresh (default 5 menit)
    REFRESH_INTERVAL: 300000,

    // Currency symbol
    CURRENCY_SYMBOL: '$'
};
```

## Fitur

- Real-time display Balance, Equity, Profit
- Auto-refresh setiap 5 menit
- Manual refresh button
- Responsive design (mobile friendly)
- Profit/Loss indicator dengan warna

## Struktur

```
trading-web/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js    # EDIT: URL ke repo data
│   └── app.js
└── README.md
```
