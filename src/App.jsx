import { useState, useEffect, useRef } from "react";
import { ThirdwebProvider, ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, defineChain, getContract, prepareContractCall, readContract } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

const CLIENT_ID = "821819db832d1a313ae3b1a62fbeafb7";
const client    = createThirdwebClient({ clientId: CLIENT_ID });

const MONAD = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpc: "https://rpc.monad.xyz",
  blockExplorers: [{ name: "Monadscan", url: "https://monadscan.com" }],
});

const CONTRACT_ADDRESS = "0x50808F5De069251aBFB3BDe5F3BE33Fc08c36626";
const CDN_HIDDEN   = "https://res.cloudinary.com/drmsykh02/raw/upload/spellbook/metadata_hidden/";
const CDN_REVEALED = "https://res.cloudinary.com/drmsykh02/raw/upload/spellbook/metadata_revealed/";
const PROMO_END    = new Date("2026-06-28T00:00:00Z");

const COLLECTION = [
  { tokenId: 0,  symbol: "WMON"     },
  { tokenId: 1,  symbol: "cbBTC"    },
  { tokenId: 2,  symbol: "WBTC"     },
  { tokenId: 3,  symbol: "WETH"     },
  { tokenId: 4,  symbol: "wstETH"   },
  { tokenId: 5,  symbol: "AUSD"     },
  { tokenId: 6,  symbol: "USDTO"    },
  { tokenId: 7,  symbol: "aprMON"   },
  { tokenId: 8,  symbol: "APR"      },
  { tokenId: 9,  symbol: "shMON"    },
  { tokenId: 10, symbol: "CHOG"     },
  { tokenId: 11, symbol: "BOB"      },
  { tokenId: 12, symbol: "LV"       },
  { tokenId: 13, symbol: "DUST"     },
  { tokenId: 14, symbol: "XAUtO"    },
  { tokenId: 15, symbol: "Moncat"   },
  { tokenId: 16, symbol: "CAKE"     },
  { tokenId: 17, symbol: "moncock"  },
  { tokenId: 18, symbol: "LVUSD"    },
  { tokenId: 19, symbol: "shrapm"   },
  { tokenId: 20, symbol: "USD1"     },
  { tokenId: 21, symbol: "emo"      },
  { tokenId: 22, symbol: "MOLANDAK" },
  { tokenId: 23, symbol: "MOUCH"    },
  { tokenId: 24, symbol: "gMON"     },
  { tokenId: 25, symbol: "sMON"     },
  { tokenId: 26, symbol: "UNIT"     },
  { tokenId: 27, symbol: "LVMON"    },
  { tokenId: 28, symbol: "USDC"     },
  { tokenId: 29, symbol: "GOLD"     },
  { tokenId: 30, symbol: "MonCat2"  },
];

const ABI = [
  { name: "buyAndOpen",  type: "function", stateMutability: "payable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { name: "isRevealed",  type: "function", stateMutability: "view",    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "ownerOf",     type: "function", stateMutability: "view",    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
];

const NEAR_JWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjUtMDEtMTItdjEifQ.eyJ2IjoxLCJrZXlfdHlwZSI6ImRpc3RyaWJ1dGlvbl9jaGFubmVsIiwicGFydG5lcl9pZCI6ImNyeXB0b2Nhc2gtbmZ0IiwiaWF0IjoxNzczMDc3MzExLCJleHAiOjE4MDQ2MTMzMTF9.Wi55S8cwVmAXPtOG0ymr7ldX-5CXVygzuanbjAAJHP-Am14_52C6i4cQG5FvjcAorw0KD8k8JD_YX5AM4QKhNqYtU5gsI4-KKe0KavO5_69NowzUKc_ubtjYn85eFjWskzZQvICMqSZkdGOSnMT_hNEePA8qYi_wSov4a4bQh4zIfNA0znEdDIV3rGI_bDM9dgOk0PnJRIpwi_aXOQ8Q4e50IO2UMrZEDtBVmUhK5-Mno3S_iS7tZl4QSui_4_bNCapQolFwUPB9Zqyxay_6rPVEr7j-8Ez5-htwkR5ZYvTb1mJaj3DVPpWPL9QTxhjvhbJ7nKrWpibcWX3AVoXZ6g";

async function fetchMetaImage(symbol, revealed) {
  try {
    const url = revealed ? CDN_REVEALED + symbol + ".json" : CDN_HIDDEN + symbol + ".json";
    const r = await fetch(url);
    const j = await r.json();
    return j.image || null;
  } catch { return null; }
}

async function getNearTokens() {
  const r = await fetch("https://1click.chaindefuser.com/v0/tokens", { headers: { Authorization: "Bearer " + NEAR_JWT } });
  return r.json();
}

async function getNearQuote({ originAsset, amount, recipient }) {
  const deadline = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const r = await fetch("https://1click.chaindefuser.com/v0/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + NEAR_JWT },
    body: JSON.stringify({ dry: false, swapType: "EXACT_INPUT", slippageTolerance: 100, originAsset, depositType: "ORIGIN_CHAIN", destinationAsset: "nep141:wrap.near", amount, recipient, recipientType: "DESTINATION_CHAIN", refundTo: recipient, refundType: "ORIGIN_CHAIN", deadline }),
  });
  return r.json();
}

function vibrate(pattern = [30, 20, 30]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function useCountdown() {
  const [time, setTime] = useState(() => Math.max(0, PROMO_END - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setTime(Math.max(0, PROMO_END - Date.now())), 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(time / 86400000);
  const h = Math.floor((time % 86400000) / 3600000);
  const m = Math.floor((time % 3600000) / 60000);
  const s = Math.floor((time % 60000) / 1000);
  return { d, h, m, s, done: time === 0 };
}

export default function App() {
  return (
    <ThirdwebProvider>
      <style>{CSS}</style>
      <Main />
    </ThirdwebProvider>
  );
}

function Main() {
  const account = useActiveAccount();
  const [tab, setTab] = useState("nfts");
  return (
    <div className="page">
      <header className="hdr">
        <div className="brand">🔮 <span className="btxt">SPELLBOOK <span className="bsub">OF MONAD</span></span></div>
        <ConnectButton client={client} chain={MONAD} theme="dark" btnTitle="⚡ Connect Wallet" />
      </header>
      <nav className="tabs">
        {[["nfts","🃏 NFTs"],["bridge","⬡ Bridge"],["bot","🤖 Bot"]].map(([id,lbl]) => (
          <button key={id} className={"tab-btn"+(tab===id?" tab-on":"")} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </nav>
      {tab === "nfts"   && <NFTsTab   account={account} />}
      {tab === "bridge" && <BridgeTab account={account} />}
      {tab === "bot"    && <BotTab    account={account} />}
      <Footer />
    </div>
  );
}

function Countdown() {
  const { d, h, m, s, done } = useCountdown();
  if (done) return <div className="promo-banner">🎉 PROMO ENDED</div>;
  return (
    <div className="promo-banner">
      <span className="promo-label">🔥 PROMO PRICE 100 MON — ENDS IN</span>
      <div className="countdown">
        <div className="cblock"><span className="cnum">{String(d).padStart(2,"0")}</span><span className="clbl">DAYS</span></div>
        <span className="csep">:</span>
        <div className="cblock"><span className="cnum">{String(h).padStart(2,"0")}</span><span className="clbl">HRS</span></div>
        <span className="csep">:</span>
        <div className="cblock"><span className="cnum">{String(m).padStart(2,"0")}</span><span className="clbl">MIN</span></div>
        <span className="csep">:</span>
        <div className="cblock"><span className="cnum">{String(s).padStart(2,"0")}</span><span className="clbl">SEC</span></div>
      </div>
    </div>
  );
}

function NFTsTab({ account }) {
  const [states, setStates] = useState(() =>
    COLLECTION.map(n => ({ ...n, revealed: false, img: null, chainLoaded: false }))
  );
  const [buying,       setBuying]       = useState(null);
  const [justRevealed, setJustRevealed] = useState({});
  const { mutate: sendTx } = useSendTransaction();
  const contract = getContract({ client, chain: MONAD, address: CONTRACT_ADDRESS, abi: ABI });

  async function fetchChainState(tokenId, symbol) {
    try {
      const revealed = await readContract({ contract, method: "isRevealed", params: [BigInt(tokenId)] });
      const img = await fetchMetaImage(symbol, revealed);
      setStates(prev => prev.map(n =>
        n.tokenId === tokenId ? { ...n, revealed, img, chainLoaded: true } : n
      ));
    } catch {
      const img = await fetchMetaImage(symbol, false);
      setStates(prev => prev.map(n =>
        n.tokenId === tokenId ? { ...n, img, chainLoaded: true } : n
      ));
    }
  }

  useEffect(() => {
    COLLECTION.forEach((n, i) => {
      setTimeout(() => fetchChainState(n.tokenId, n.symbol), i * 80);
    });
  }, []);

  async function handleBuy(tokenId) {
    if (!account) { alert("Connect your wallet first!"); return; }
    setBuying(tokenId);
    vibrate([40, 30, 40]);
    try {
      const valueWei = BigInt(100) * BigInt(10 ** 18);
      const tx = prepareContractCall({ contract, method: "buyAndOpen", params: [BigInt(tokenId)], value: valueWei });
      sendTx(tx, {
        onSuccess: async () => {
          vibrate([20, 10, 20, 10, 60]);
          setJustRevealed(prev => ({ ...prev, [tokenId]: true }));
          const sym = COLLECTION.find(c => c.tokenId === tokenId)?.symbol;
          const img = await fetchMetaImage(sym, true);
          setStates(prev => prev.map(n => n.tokenId === tokenId ? { ...n, revealed: true, img } : n));
          setBuying(null);
        },
        onError: (e) => { alert("Failed: " + (e.reason || e.message)); setBuying(null); },
      });
    } catch (e) { alert(e.message); setBuying(null); }
  }

  return (
    <div className="tab-content">
      <Countdown />
      <section>
        <h2 className="sec-title">🔮 SPELLBOOKS ({states.length})</h2>
        <div className="grid">
          {states.map(n => (
            <Card key={n.tokenId} nft={n} buying={buying} account={account} onBuy={handleBuy} justRevealed={!!justRevealed[n.tokenId]} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ nft, buying, account, onBuy, justRevealed }) {
  const isBuying = buying === nft.tokenId;
  const revealed = nft.revealed || justRevealed;
  const [touching, setTouching] = useState(false);

  function handleTouchStart() {
    setTouching(true);
    vibrate([15, 10, 15]);
  }
  function handleTouchEnd() {
    setTimeout(() => setTouching(false), 400);
  }

  return (
    <div
      className={"card" + (revealed ? " card-on" : "") + (justRevealed ? " card-flash" : "") + (touching ? " card-touch" : "")}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="card-img-wrap">
        {nft.img ? (
          <img src={nft.img} alt={nft.symbol} className="card-img" />
        ) : (
          <div className="card-fallback">
            {!nft.chainLoaded
              ? <span className="fallback-icon">⏳</span>
              : <><span className="fallback-sym">{nft.symbol}</span><span className="fallback-icon">{revealed ? "✨" : "🔮"}</span></>
            }
          </div>
        )}
        {revealed && <div className="card-glow" />}
        {!nft.chainLoaded && <div className="chain-dot" />}
      </div>
      <div className="card-info">
        <div className="card-sym">{nft.symbol}</div>
        <div className="card-id">TOKEN #{nft.tokenId}</div>
        <div className={"card-badge" + (revealed ? " badge-on" : "")}>
          {revealed ? "✨ REVEALED" : "🔒 SEALED"}
        </div>
      </div>
      <button className="buy-btn" onClick={() => onBuy(nft.tokenId)} disabled={isBuying || !account}>
        {isBuying ? <><span className="spin" />OPENING…</> : "BUY 100 MON"}
      </button>
    </div>
  );
}

/* ─── BOT TAB ─────────────────────────────────────────────────────────────── */

function BotTab({ account }) {
  const [running,    setRunning]    = useState(false);
  const [log,        setLog]        = useState([]);
  const [selected,   setSelected]   = useState([]);
  const [interval,   setIntervalMs] = useState(5000);
  const [maxBuys,    setMaxBuys]    = useState(3);
  const [buyCount,   setBuyCount]   = useState(0);
  const timerRef  = useRef(null);
  const countRef  = useRef(0);
  const { mutate: sendTx } = useSendTransaction();
  const contract  = getContract({ client, chain: MONAD, address: CONTRACT_ADDRESS, abi: ABI });

  function addLog(msg, type = "info") {
    const ts = new Date().toLocaleTimeString();
    setLog(prev => [{ ts, msg, type }, ...prev].slice(0, 80));
  }

  function toggleToken(tokenId) {
    setSelected(prev =>
      prev.includes(tokenId) ? prev.filter(x => x !== tokenId) : [...prev, tokenId]
    );
  }

  function selectAll()   { setSelected(COLLECTION.map(c => c.tokenId)); }
  function selectNone()  { setSelected([]); }

  async function runOnce() {
    if (!account) { addLog("No wallet connected", "error"); return; }
    if (selected.length === 0) { addLog("No tokens selected", "warn"); return; }
    if (countRef.current >= maxBuys) {
      addLog(`Max buys (${maxBuys}) reached — stopping`, "warn");
      stopBot();
      return;
    }

    // Pick an unrevealed token from selection
    let targetId = null;
    for (const id of selected) {
      try {
        const rev = await readContract({ contract, method: "isRevealed", params: [BigInt(id)] });
        if (!rev) { targetId = id; break; }
      } catch { /* skip */ }
    }

    if (targetId === null) {
      addLog("All selected tokens already revealed", "warn");
      stopBot();
      return;
    }

    const sym = COLLECTION.find(c => c.tokenId === targetId)?.symbol ?? `#${targetId}`;
    addLog(`Buying ${sym} (token #${targetId})…`, "info");

    try {
      const valueWei = BigInt(100) * BigInt(10 ** 18);
      const tx = prepareContractCall({ contract, method: "buyAndOpen", params: [BigInt(targetId)], value: valueWei });
      sendTx(tx, {
        onSuccess: () => {
          countRef.current += 1;
          setBuyCount(countRef.current);
          addLog(`✓ Bought & opened ${sym} [${countRef.current}/${maxBuys}]`, "success");
          vibrate([20, 10, 60]);
        },
        onError: (e) => addLog(`✗ ${sym}: ${e.reason || e.message}`, "error"),
      });
    } catch (e) {
      addLog(`✗ Error: ${e.message}`, "error");
    }
  }

  function startBot() {
    if (!account) { alert("Connect your wallet first!"); return; }
    countRef.current = 0;
    setBuyCount(0);
    setLog([]);
    setRunning(true);
    addLog(`Bot started — interval ${interval / 1000}s, max ${maxBuys} buys`, "info");
    runOnce();
    timerRef.current = setInterval(runOnce, interval);
  }

  function stopBot() {
    clearInterval(timerRef.current);
    setRunning(false);
    addLog("Bot stopped", "warn");
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div className="tab-content">
      <div className="bot-wrap">
        <h2 className="sec-title" style={{ marginBottom: 6 }}>🤖 AUTO-BUY BOT</h2>
        <p className="bridge-desc">Automatically buys & opens unrevealed spellbooks on a timer.</p>

        {!account && <div className="warn-box" style={{ marginBottom: 12 }}>⚡ Connect your wallet to use the bot</div>}

        {/* Config row */}
        <div className="bot-cfg-row">
          <div className="bot-cfg-item">
            <label className="flabel">INTERVAL (SEC)</label>
            <input className="finput" type="number" min="3" max="300" value={interval / 1000}
              onChange={e => setIntervalMs(Math.max(3, parseInt(e.target.value) || 5) * 1000)}
              disabled={running} />
          </div>
          <div className="bot-cfg-item">
            <label className="flabel">MAX BUYS</label>
            <input className="finput" type="number" min="1" max="100" value={maxBuys}
              onChange={e => setMaxBuys(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={running} />
          </div>
          <div className="bot-cfg-item">
            <label className="flabel">BOUGHT</label>
            <div className="bot-count">{buyCount} / {maxBuys}</div>
          </div>
        </div>

        {/* Token selector */}
        <div className="bot-sel-hdr">
          <span className="flabel" style={{ marginBottom: 0 }}>SELECT TOKENS ({selected.length}/{COLLECTION.length})</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="sel-btn" onClick={selectAll}  disabled={running}>ALL</button>
            <button className="sel-btn" onClick={selectNone} disabled={running}>NONE</button>
          </div>
        </div>
        <div className="token-grid">
          {COLLECTION.map(c => (
            <button
              key={c.tokenId}
              className={"tok-chip" + (selected.includes(c.tokenId) ? " tok-on" : "")}
              onClick={() => toggleToken(c.tokenId)}
              disabled={running}
            >
              {c.symbol}
            </button>
          ))}
        </div>

        {/* Start / Stop */}
        {!running
          ? <button className="bot-btn bot-start" onClick={startBot} disabled={!account || selected.length === 0}>
              ▶ START BOT
            </button>
          : <button className="bot-btn bot-stop" onClick={stopBot}>
              ■ STOP BOT
            </button>
        }

        {/* Log */}
        {log.length > 0 && (
          <div className="bot-log">
            {log.map((l, i) => (
              <div key={i} className={"log-line log-" + l.type}>
                <span className="log-ts">{l.ts}</span> {l.msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── BRIDGE TAB ──────────────────────────────────────────────────────────── */

function BridgeTab({ account }) {
  const [tokens,  setTokens]  = useState([]);
  const [origin,  setOrigin]  = useState("");
  const [amount,  setAmount]  = useState("");
  const [quote,   setQuote]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getNearTokens()
      .then(t => setTokens(t.filter(x => ["eth","btc","sol","usdc","usdt","near","bnb"].some(s => x.symbol?.toLowerCase().includes(s)))))
      .catch(() => {});
  }, []);

  async function getQuote() {
    if (!origin || !amount || !account) return;
    setLoading(true); setError(null); setQuote(null);
    try {
      const tok = tokens.find(t => t.assetId === origin);
      const dec = tok?.decimals ?? 18;
      const raw = BigInt(Math.round(parseFloat(amount) * Math.pow(10, dec))).toString();
      const q   = await getNearQuote({ originAsset: origin, amount: raw, recipient: account.address });
      setQuote(q);
    } catch { setError("Quote failed. Try different token/amount."); }
    setLoading(false);
  }

  return (
    <div className="tab-content">
      <div className="bridge-wrap">
        <h2 className="sec-title" style={{ marginBottom: 20 }}>⬡ BRIDGE → MON</h2>
        <p className="bridge-desc">Bridge any token via NEAR Intents → get MON on Monad</p>
        {!account ? (
          <div className="warn-box">⚡ Connect your wallet first</div>
        ) : (
          <>
            <label className="flabel">SELECT TOKEN</label>
            <select className="finput" value={origin} onChange={e => { setOrigin(e.target.value); setQuote(null); }}>
              <option value="">Choose token…</option>
              {tokens.map(t => <option key={t.assetId} value={t.assetId}>{t.symbol}{t.blockchain ? " · " + t.blockchain.toUpperCase() : ""}</option>)}
            </select>
            <label className="flabel">AMOUNT</label>
            <input className="finput" type="number" placeholder="0.00" value={amount} onChange={e => { setAmount(e.target.value); setQuote(null); }} />
            <button className="bridge-btn" onClick={getQuote} disabled={!origin || !amount || loading}>
              {loading ? "FETCHING QUOTE…" : "GET QUOTE →"}
            </button>
            {error && <div className="err-box">{error}</div>}
            {quote && (
              <div className="quote-box">
                <QRow label="You Send"    value={`${amount} ${tokens.find(t => t.assetId === origin)?.symbol ?? ""}`} />
                <QRow label="You Receive" value={`${quote.amountOutFormatted ?? quote.minAmountOut ?? "—"} MON`} />
                {quote.depositAddress && (
                  <>
                    <QRow label="Deposit To" value={`${quote.depositAddress.slice(0, 16)}…`} />
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText(quote.depositAddress)}>📋 COPY DEPOSIT ADDRESS</button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QRow({ label, value }) {
  return (
    <div className="qrow">
      <span className="qlbl">{label}</span>
      <span className="qval">{value}</span>
    </div>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────────────────── */

const LINKS = [
  { href: "https://monadvision.com/token/0x50808F5De069251aBFB3BDe5F3BE33Fc08c36626?tab=Items", label: "MONADVSN",    color: "#bf5fff", svg: '<circle cx="12" cy="12" r="10" fill="none" stroke="#bf5fff" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#bf5fff"/>' },
  { href: "https://badges.blockscout.com/home",                                                   label: "BLOCKSCOUT",  color: "#00fff7", svg: '<rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="#00fff7" stroke-width="2"/><path d="M7 12h10M12 7v10" stroke="#00fff7" stroke-width="2" stroke-linecap="round"/>' },
  { href: "https://dashboard.blockvision.org/pricing",                                            label: "BLOCKVISION", color: "#ffe600", svg: '<polygon points="12,2 22,20 2,20" fill="none" stroke="#ffe600" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="13" stroke="#ffe600" stroke-width="2"/><circle cx="12" cy="16" r="1.2" fill="#ffe600"/>' },
  { href: "https://etherscan.io/apis?id=143",                                                     label: "ETHERSCAN",   color: "#00bfff", svg: '<circle cx="12" cy="12" r="10" fill="none" stroke="#00bfff" stroke-width="2"/><path d="M8 12a4 4 0 0 1 8 0" stroke="#00bfff" stroke-width="2" fill="none"/><circle cx="12" cy="14" r="2" fill="#00bfff"/>' },
  { href: "https://opensea.io/SUPERRARECOINS",                                                    label: "OPENSEA",     color: "#2081e2", svg: '<circle cx="12" cy="12" r="10" fill="none" stroke="#2081e2" stroke-width="2"/><path d="M6 13l3-4 3 3 3-5 3 6" stroke="#2081e2" stroke-width="2" fill="none" stroke-linecap="round"/>' },
  { href: "https://x.com/bnbgold277983",                                                          label: "TWITTER",     color: "#1da1f2", svg: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#1da1f2"/>' },
  { href: "https://discord.com/channels/1316093079090106472",                                     label: "DISCORD",     color: "#9b84ec", svg: '<path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.036.055a20 20 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.2 13.2 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" fill="#9b84ec"/>' },
  { href: "https://t.me/usdttgold_bot/Swap",                                                     label: "TELEGRAM",    color: "#0088cc", svg: '<circle cx="12" cy="12" r="10" fill="none" stroke="#0088cc" stroke-width="2"/><path d="M5 10l14-4-4 14-4-5-6-5z" fill="none" stroke="#0088cc" stroke-width="1.5" stroke-linejoin="round"/>' },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        {LINKS.map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className="flink"
            style={{ borderColor: l.color, color: l.color, background: `linear-gradient(135deg,#010408 60%,${l.color}22 100%)`, boxShadow: `0 2px 14px ${l.color}40` }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.07)"; e.currentTarget.style.boxShadow = `0 6px 28px ${l.color}88`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 2px 14px ${l.color}40`; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: l.svg }} />
            {l.label}
          </a>
        ))}
      </div>
      <div className="footer-copy">SPELLBOOK OF MONAD · {CONTRACT_ADDRESS} · 2026</div>
    </footer>
  );
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  body{
    background:#010408;
    color:#b8f0c8;
    font-family:'Share Tech Mono',monospace;
    min-height:100vh;
    overflow-x:hidden;
    box-shadow:0 0 120px #39ff1418 inset;
  }
  body::before{
    content:'';position:fixed;inset:0;
    background-image:
      linear-gradient(rgba(57,255,20,.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(57,255,20,.03) 1px,transparent 1px);
    background-size:40px 40px;
    pointer-events:none;z-index:0;
  }

  .page{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:20px 16px 80px}

  .hdr{
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 22px;margin-bottom:22px;
    background:linear-gradient(135deg,rgba(57,255,20,.05) 0%,rgba(0,255,247,.04) 50%,rgba(255,0,234,.04) 100%);
    border:1px solid rgba(57,255,20,.35);
    border-radius:14px;
    box-shadow:0 0 40px rgba(57,255,20,.12),0 0 80px rgba(0,255,247,.06);
  }
  .brand{display:flex;align-items:center;gap:10px;font-size:0}
  .btxt{
    font-family:'Orbitron',monospace;font-size:17px;font-weight:900;
    color:#39ff14;letter-spacing:3px;
    text-shadow:0 0 8px #39ff14,0 0 24px #39ff14,0 0 48px #00fff7;
  }
  .bsub{
    color:#ff00ea;font-size:13px;
    text-shadow:0 0 10px #ff00ea,0 0 24px #ff00ea;
  }

  .tabs{display:flex;gap:8px;margin-bottom:22px}
  .tab-btn{
    padding:9px 22px;border-radius:9px;
    border:1px solid rgba(57,255,20,.2);
    background:transparent;color:#3a7a4a;
    font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;
    cursor:pointer;transition:all .2s;
  }
  .tab-btn:hover,.tab-on{
    border-color:#39ff14!important;color:#39ff14!important;
    background:rgba(57,255,20,.08)!important;
    box-shadow:0 0 18px rgba(57,255,20,.35),0 0 40px rgba(57,255,20,.1);
  }

  .tab-content{display:flex;flex-direction:column;gap:36px}
  .sec-title{
    font-family:'Orbitron',monospace;font-size:12px;letter-spacing:4px;
    color:#00fff7;
    text-shadow:0 0 12px #00fff7,0 0 28px #39ff14;
    margin-bottom:18px;
  }

  /* PROMO BANNER */
  .promo-banner{
    display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px;
    background:linear-gradient(135deg,rgba(57,255,20,.07),rgba(255,0,234,.07));
    border:1px solid rgba(57,255,20,.4);border-radius:14px;text-align:center;
    box-shadow:0 0 40px rgba(57,255,20,.12),0 0 80px rgba(255,0,234,.06);
  }
  .promo-label{
    font-family:'Orbitron',monospace;font-size:11px;letter-spacing:3px;
    color:#39ff14;text-shadow:0 0 10px #39ff14,0 0 24px #00fff7;
  }
  .countdown{display:flex;align-items:center;gap:8px}
  .cblock{
    display:flex;flex-direction:column;align-items:center;
    background:rgba(0,0,0,.5);border:1px solid rgba(57,255,20,.3);
    border-radius:8px;padding:8px 14px;min-width:58px;
    box-shadow:0 0 16px rgba(57,255,20,.15);
  }
  .cnum{
    font-family:'Orbitron',monospace;font-size:22px;font-weight:900;
    color:#39ff14;text-shadow:0 0 14px #39ff14,0 0 28px #00fff7;line-height:1;
  }
  .clbl{font-size:8px;letter-spacing:2px;color:#2a5a3a;margin-top:3px}
  .csep{
    font-family:'Orbitron',monospace;font-size:22px;font-weight:900;
    color:#39ff1470;margin-bottom:12px;
  }

  /* GRID & CARDS */
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
  .card{
    display:flex;flex-direction:column;border-radius:16px;overflow:hidden;
    background:linear-gradient(160deg,#050c08 70%,#0a0814 100%);
    border:2px solid rgba(57,255,20,.25);
    box-shadow:0 0 18px rgba(57,255,20,.12),0 0 36px rgba(0,255,247,.06);
    transition:transform .25s,box-shadow .25s;position:relative;
  }
  .card:hover{
    transform:translateY(-6px);
    box-shadow:0 12px 40px rgba(57,255,20,.3),0 0 60px rgba(0,255,247,.15),0 0 0 2px rgba(57,255,20,.5);
  }
  .card-on{
    border-color:#ff00ea;
    box-shadow:0 0 32px #ff00ea88,0 0 70px rgba(57,255,20,.2);
  }
  .card-flash{animation:cflash 1.4s ease}
  @keyframes cflash{
    0%  {box-shadow:0 0 0 transparent}
    30% {box-shadow:0 0 100px #39ff14,0 0 140px #00fff7,0 0 200px #ff00ea50}
    100%{box-shadow:0 0 32px #ff00ea88,0 0 70px rgba(57,255,20,.2)}
  }
  /* Touch flash */
  .card-touch{
    animation:ctouch .4s ease;
  }
  @keyframes ctouch{
    0%  {box-shadow:0 0 0 transparent;transform:scale(1)}
    40% {box-shadow:0 0 60px #00fff7,0 0 90px #39ff1480;transform:scale(0.97)}
    100%{box-shadow:0 0 18px rgba(57,255,20,.12);transform:scale(1)}
  }

  .card-img-wrap{position:relative;width:100%;aspect-ratio:1;overflow:hidden;background:#080f0b}
  .card-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}
  .card:hover .card-img{transform:scale(1.07)}
  .card-fallback{
    width:100%;height:100%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:8px;
    background:linear-gradient(135deg,#050f08,#0a1020);
  }
  .fallback-sym{
    font-family:'Orbitron',monospace;font-size:13px;font-weight:900;
    color:#39ff14;letter-spacing:2px;text-shadow:0 0 10px #39ff14,0 0 24px #00fff7;
    text-align:center;padding:0 8px;word-break:break-all;
  }
  .fallback-icon{font-size:40px;opacity:.6}
  .card-glow{
    position:absolute;inset:0;
    background:radial-gradient(circle at 50% 50%,rgba(57,255,20,.1) 0%,rgba(255,0,234,.05) 60%,transparent 100%);
    pointer-events:none;
  }
  .chain-dot{
    position:absolute;top:8px;right:8px;
    width:7px;height:7px;border-radius:50%;
    background:#39ff1480;
    box-shadow:0 0 8px #39ff14;
    animation:cdot 1.2s ease-in-out infinite;
  }
  @keyframes cdot{0%,100%{opacity:.2}50%{opacity:1}}

  .card-info{padding:11px 13px;flex:1;display:flex;flex-direction:column;gap:3px}
  .card-sym{
    font-family:'Orbitron',monospace;font-size:12px;font-weight:700;
    color:#39ff14;letter-spacing:1px;text-shadow:0 0 8px #39ff14,0 0 20px #00fff7;
  }
  .card-id{font-size:9px;color:#2a4a3a;letter-spacing:1px}
  .card-badge{
    font-size:8px;letter-spacing:1.5px;padding:3px 7px;border-radius:20px;
    width:fit-content;margin-top:4px;
    background:rgba(57,255,20,.07);color:#3a6a4a;border:1px solid #1a3a2a;
  }
  .badge-on{
    background:rgba(255,0,234,.12)!important;color:#ff00ea!important;
    border-color:rgba(255,0,234,.4)!important;
    box-shadow:0 0 10px rgba(255,0,234,.35);
  }

  .buy-btn{
    width:100%;padding:15px 10px;
    background:linear-gradient(135deg,#000800,#001500);
    border:2px solid #39ff14;border-top:none;
    color:#39ff14;font-family:'Orbitron',monospace;font-size:12px;font-weight:900;letter-spacing:2px;
    cursor:pointer;transition:all .2s;
    text-shadow:0 0 8px #39ff14,0 0 24px #00fff7;
    box-shadow:0 0 16px rgba(57,255,20,.3);
    display:flex;align-items:center;justify-content:center;gap:7px;
  }
  .buy-btn:hover:not(:disabled){
    background:linear-gradient(135deg,#001800,#003000);
    box-shadow:0 0 40px #39ff14,0 0 80px rgba(0,255,247,.3);
    transform:scale(1.01);
  }
  .buy-btn:disabled{opacity:.25;cursor:not-allowed;text-shadow:none;border-color:#1a3a1a;color:#1a5a1a;box-shadow:none}
  .spin{width:11px;height:11px;border:2px solid #39ff1450;border-top-color:#39ff14;border-radius:50%;animation:sp .7s linear infinite;display:inline-block}
  @keyframes sp{to{transform:rotate(360deg)}}

  /* BRIDGE */
  .bridge-wrap{
    max-width:460px;margin:0 auto;
    background:linear-gradient(160deg,#050c08 70%,#0a0814 100%);
    border:1px solid rgba(57,255,20,.25);border-radius:18px;padding:28px;
    display:flex;flex-direction:column;gap:12px;
    box-shadow:0 0 50px rgba(57,255,20,.08),0 0 100px rgba(0,255,247,.04);
  }
  .bridge-desc{font-size:11px;color:#3a6a4a;margin-bottom:6px}
  .flabel{font-size:10px;letter-spacing:2px;color:#00fff7;display:block;margin-bottom:3px;text-shadow:0 0 8px #00fff750}
  .finput{
    width:100%;padding:11px 13px;
    background:#030806;border:1px solid rgba(57,255,20,.22);border-radius:9px;
    color:#80e8a0;font-family:'Share Tech Mono',monospace;font-size:12px;outline:none;
    transition:border-color .2s,box-shadow .2s;
  }
  .finput:focus{border-color:rgba(57,255,20,.6);box-shadow:0 0 14px rgba(57,255,20,.18)}
  .finput option{background:#050c08}
  .bridge-btn{
    padding:13px;border-radius:11px;
    border:1px solid #39ff14;
    background:linear-gradient(135deg,#001200,#002800);
    color:#39ff14;font-family:'Orbitron',monospace;font-size:11px;font-weight:700;letter-spacing:2px;
    cursor:pointer;transition:all .2s;margin-top:4px;
    text-shadow:0 0 8px #39ff14;
  }
  .bridge-btn:hover:not(:disabled){box-shadow:0 0 28px rgba(57,255,20,.5);transform:translateY(-1px)}
  .bridge-btn:disabled{opacity:.4;cursor:not-allowed}
  .warn-box{padding:13px;background:rgba(200,160,0,.07);border:1px solid rgba(255,230,0,.3);border-radius:9px;color:#ffe600;font-size:12px;text-align:center;text-shadow:0 0 8px rgba(255,230,0,.5)}
  .err-box{padding:11px;background:rgba(255,50,50,.07);border:1px solid rgba(255,50,50,.3);border-radius:9px;color:#ff6060;font-size:11px}
  .quote-box{background:#030806;border:1px solid rgba(57,255,20,.15);border-radius:11px;padding:13px;display:flex;flex-direction:column}
  .qrow{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(57,255,20,.07);font-size:11px}
  .qrow:last-child{border-bottom:none}
  .qlbl{color:#3a6a4a}
  .qval{color:#39ff14;font-weight:700;text-shadow:0 0 8px #39ff1480}
  .copy-btn{width:100%;padding:9px;margin-top:8px;background:rgba(57,255,20,.07);border:1px solid rgba(57,255,20,.25);border-radius:7px;color:#39ff14;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all .2s}
  .copy-btn:hover{background:rgba(57,255,20,.16);box-shadow:0 0 14px rgba(57,255,20,.3)}

  /* BOT TAB */
  .bot-wrap{
    max-width:700px;margin:0 auto;
    background:linear-gradient(160deg,#050c08 70%,#0a0814 100%);
    border:1px solid rgba(0,255,247,.25);border-radius:18px;padding:28px;
    display:flex;flex-direction:column;gap:14px;
    box-shadow:0 0 50px rgba(0,255,247,.08),0 0 100px rgba(57,255,20,.04);
  }
  .bot-cfg-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .bot-cfg-item{display:flex;flex-direction:column;gap:4px}
  .bot-count{
    padding:11px 13px;background:#030806;border:1px solid rgba(0,255,247,.22);border-radius:9px;
    color:#00fff7;font-family:'Orbitron',monospace;font-size:16px;font-weight:900;letter-spacing:2px;
    text-shadow:0 0 12px #00fff7;text-align:center;
  }
  .bot-sel-hdr{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .sel-btn{
    padding:5px 12px;border-radius:6px;border:1px solid rgba(57,255,20,.3);
    background:transparent;color:#39ff14;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;
    transition:all .15s;
  }
  .sel-btn:hover:not(:disabled){background:rgba(57,255,20,.1);box-shadow:0 0 10px rgba(57,255,20,.3)}
  .sel-btn:disabled{opacity:.3;cursor:not-allowed}
  .token-grid{display:flex;flex-wrap:wrap;gap:6px}
  .tok-chip{
    padding:5px 10px;border-radius:6px;
    border:1px solid rgba(57,255,20,.15);
    background:rgba(57,255,20,.04);
    color:#3a6a4a;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;
    cursor:pointer;transition:all .15s;
  }
  .tok-chip:hover:not(:disabled){border-color:rgba(57,255,20,.4);color:#39ff14}
  .tok-chip:disabled{opacity:.4;cursor:not-allowed}
  .tok-on{
    border-color:#39ff14!important;color:#39ff14!important;
    background:rgba(57,255,20,.12)!important;
    box-shadow:0 0 8px rgba(57,255,20,.3);
  }
  .bot-btn{
    padding:15px;border-radius:12px;border:none;
    font-family:'Orbitron',monospace;font-size:12px;font-weight:900;letter-spacing:3px;
    cursor:pointer;transition:all .2s;margin-top:4px;
  }
  .bot-start{
    background:linear-gradient(135deg,#001800,#003800);
    border:2px solid #39ff14;color:#39ff14;
    text-shadow:0 0 8px #39ff14,0 0 20px #00fff7;
    box-shadow:0 0 24px rgba(57,255,20,.35);
  }
  .bot-start:hover:not(:disabled){box-shadow:0 0 50px #39ff14,0 0 80px rgba(0,255,247,.2);transform:translateY(-2px)}
  .bot-start:disabled{opacity:.3;cursor:not-allowed;box-shadow:none}
  .bot-stop{
    background:linear-gradient(135deg,#180000,#380000);
    border:2px solid #ff4444;color:#ff4444;
    text-shadow:0 0 8px #ff4444;
    box-shadow:0 0 24px rgba(255,68,68,.35);
  }
  .bot-stop:hover{box-shadow:0 0 50px #ff4444;transform:translateY(-2px)}
  .bot-log{
    background:#020604;border:1px solid rgba(57,255,20,.1);border-radius:10px;
    padding:12px;max-height:220px;overflow-y:auto;
    display:flex;flex-direction:column;gap:3px;
  }
  .log-line{font-size:10px;letter-spacing:.5px;padding:3px 0;border-bottom:1px solid rgba(57,255,20,.04)}
  .log-line:last-child{border-bottom:none}
  .log-ts{color:#1a3a2a;margin-right:8px}
  .log-info   {color:#80c080}
  .log-success{color:#39ff14;text-shadow:0 0 6px #39ff1460}
  .log-warn   {color:#ffe600;text-shadow:0 0 6px #ffe60060}
  .log-error  {color:#ff4444;text-shadow:0 0 6px #ff444460}

  /* FOOTER */
  .footer{margin-top:52px;padding-top:24px;border-top:1px solid rgba(57,255,20,.1)}
  .footer-links{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin-bottom:18px}
  .flink{
    display:inline-flex;align-items:center;gap:7px;padding:8px 16px;
    border-radius:22px;border:1.5px solid;
    font-family:'Share Tech Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;
    text-decoration:none;transition:transform .18s,box-shadow .18s;
  }
  .footer-copy{text-align:center;font-size:8px;color:#1a2a1a;letter-spacing:2px;word-break:break-all;padding:0 16px}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:#010408}
  ::-webkit-scrollbar-thumb{background:#0a1a14;border-radius:3px}

  @media(max-width:600px){
    .hdr{flex-direction:column;gap:12px;text-align:center}
    .btxt{font-size:14px}
    .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
    .buy-btn{font-size:10px;padding:13px 6px}
    .bridge-wrap,.bot-wrap{padding:18px}
    .cnum{font-size:16px}
    .cblock{min-width:44px;padding:6px 8px}
    .bot-cfg-row{grid-template-columns:1fr 1fr}
  }
`;
