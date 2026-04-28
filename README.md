# 🔮 SPELLBOOK OF MONAD

<div align="center">

![Spellbook of Monad](https://raw.githubusercontent.com/00impera/NEON-NFT/d5e200349cbee539fe03c6e6a86fe55efdf8ec57/image_1777342294072.jpeg)

**31 unique NFT Spellbooks on Monad & Polygon blockchain**

[![Monad](https://img.shields.io/badge/Chain-Monad%20Mainnet-00ff50?style=for-the-badge)](https://rpc.monad.xyz)
[![Polygon](https://img.shields.io/badge/Chain-Polygon%20Mainnet-8247e5?style=for-the-badge)](https://polygon.technology)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[🌐 DApp](https://0654c680.neon-nft.pages.dev) · [🤖 Telegram Bot](https://t.me/usdttgold_bot) · [🔍 Polygonscan](https://polygonscan.com/address/0xDA1bb41FE6ce28fb383214641a7bB4ea39f8e4Bd)

</div>

---

## 📦 Collection

31 unique Spellbook NFTs representing DeFi tokens on the Monad ecosystem.

| # | Symbol | # | Symbol | # | Symbol |
|---|--------|---|--------|---|--------|
| 0 | WMON | 11 | BOB | 22 | MOLANDAK |
| 1 | cbBTC | 12 | LV | 23 | MOUCH |
| 2 | WBTC | 13 | DUST | 24 | gMON |
| 3 | WETH | 14 | XAUtO | 25 | sMON |
| 4 | wstETH | 15 | Moncat | 26 | UNIT |
| 5 | AUSD | 16 | CAKE | 27 | LVMON |
| 6 | USDTO | 17 | moncock | 28 | USDC |
| 7 | aprMON | 18 | LVUSD | 29 | GOLD |
| 8 | APR | 19 | shrapm | 30 | MonCat2 |
| 9 | shMON | 20 | USD1 | | |
| 10 | CHOG | 21 | emo | | |

---

## 🔗 Contracts

| Chain | Address | Status |
|-------|---------|--------|
| **Monad Mainnet** (ID 143) | [`0x50808F5De069251aBFB3BDe5F3BE33Fc08c36626`](https://monadscan.com/address/0x50808F5De069251aBFB3BDe5F3BE33Fc08c36626) | ✅ Live |
| **Polygon Mainnet** (ID 137) | [`0xDA1bb41FE6ce28fb383214641a7bB4ea39f8e4Bd`](https://polygonscan.com/address/0xDA1bb41FE6ce28fb383214641a7bB4ea39f8e4Bd) | ✅ Verified |

---

## ✨ Features

### 🃏 DApp (React + Thirdweb)
- Browse all 31 NFTs with live on-chain state
- Buy & reveal Spellbooks with one click
- **FOR SALE banner** + per-NFT countdown timer
- **Auto-Buy Bot** — automatically buys unrevealed NFTs on a timer
- **NEAR Bridge** — bridge ETH/BTC/USDC → MON via NEAR Intents
- Vibration feedback on mobile
- Fully responsive, mobile-first

### 🤖 Telegram Bot
- `/start` — Welcome screen with main menu
- `/browse` — Browse all 31 NFTs with live countdown
- `/help` — Help & commands
- Per-NFT countdown timers with 🔥 promo end date
- 🔄 Refresh countdown button on each NFT
- Health server for Render deployment

### 📄 Smart Contract (ERC721A + OpenZeppelin)
- `buyAndOpen(tokenId)` — Buy & instantly reveal an NFT
- `batchMintBooks(symbols, uris)` — Mint entire collection (owner only)
- `isRevealed(tokenId)` — Check reveal status
- `ownerOf(tokenId)` — Check NFT ownership
- `setPrice(price)` — Update price (owner only)
- `setHiddenURI(uri)` — Update hidden metadata (owner only)
- `setTreasury(address)` — Update treasury wallet (owner only)
- `withdraw()` — Withdraw funds to treasury (owner only)
- `tokenURI(tokenId)` — Returns hidden or revealed metadata URI

---

## 🚀 How to Buy

1. Install [MetaMask](https://metamask.io)
2. Add Monad network:
   - **Chain ID:** `143`
   - **RPC:** `https://rpc.monad.xyz`
   - **Symbol:** `MON`
3. Get `100 MON`
4. Open the [DApp](https://0654c680.neon-nft.pages.dev)
5. Connect wallet → pick NFT → **BUY**
6. Approve transaction → spellbook reveals! ✨

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contract | Solidity 0.8.33, ERC721A, OpenZeppelin |
| Deploy Tool | Foundry |
| Frontend | React, Thirdweb SDK |
| Bot | Python, python-telegram-bot 21.6 |
| Hosting | Cloudflare Pages (DApp), Render (Bot) |
| Images | Cloudinary CDN |
| Bridge | NEAR Intents (1click API) |

---

## 📁 Project Structure

```
NEON-NFT/
├── src/
│   └── App.jsx              # React DApp
├── tg-bot/
│   └── bot.py               # Telegram bot
├── foundry-polygon/
│   ├── src/SpellbookNFT.sol  # Smart contract
│   ├── script/DeploySpellbook.s.sol
│   └── foundry.toml
└── README.md
```

---

## 🔧 Deploy (Foundry)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash && foundryup

# Clone & setup
git clone https://github.com/00impera/NEON-NFT
cd NEON-NFT/foundry-polygon
forge install OpenZeppelin/openzeppelin-contracts --no-git
forge install chiru-labs/ERC721A --no-git

# Set env
export PRIVATE_KEY="your_private_key"
export POLYGONSCAN_API_KEY="your_api_key"

# Deploy + verify
forge script script/DeploySpellbook.s.sol:DeploySpellbook \
  --rpc-url https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY \
  --broadcast --verify -vvvv
```

---

## 🤖 Bot Deployment (Render)

1. Push `tg-bot/bot.py` to GitHub
2. Create **Web Service** on [Render](https://render.com)
3. Set environment variables:
   ```
   BOT_TOKEN = your_telegram_bot_token
   SITE_URL  = https://0654c680.neon-nft.pages.dev
   ```
4. Start command: `python bot.py`

---

## 📜 License

MIT © 2026 SPELLBOOK OF MONAD
