import os
import sys
import asyncio
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import logging
from datetime import datetime, timezone
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
SITE_URL  = os.environ.get("SITE_URL", "https://0654c680.neon-nft.pages.dev")
CONTRACT  = "0x50808F5De069251aBFB3BDe5F3BE33Fc08c36626"
CHAIN_ID  = 143
PRICE_MON = 100

if not BOT_TOKEN:
    logger.error("BOT_TOKEN environment variable is not set. Exiting.")
    sys.exit(1)

COLLECTION = [
    (0,"WMON"),(1,"cbBTC"),(2,"WBTC"),(3,"WETH"),(4,"wstETH"),
    (5,"AUSD"),(6,"USDTO"),(7,"aprMON"),(8,"APR"),(9,"shMON"),
    (10,"CHOG"),(11,"BOB"),(12,"LV"),(13,"DUST"),(14,"XAUtO"),
    (15,"Moncat"),(16,"CAKE"),(17,"moncock"),(18,"LVUSD"),(19,"shrapm"),
    (20,"USD1"),(21,"emo"),(22,"MOLANDAK"),(23,"MOUCH"),(24,"gMON"),
    (25,"sMON"),(26,"UNIT"),(27,"LVMON"),(28,"USDC"),(29,"GOLD"),(30,"MonCat2"),
]

# Sale end: fixed base + 47min stagger per tokenId (matches DApp logic)
SALE_BASE_TS = datetime(2026, 5, 5, 0, 0, 0, tzinfo=timezone.utc).timestamp()

def get_sale_end(token_id: int) -> float:
    return SALE_BASE_TS + token_id * 47 * 60

def format_countdown(token_id: int) -> str:
    now = datetime.now(timezone.utc).timestamp()
    end = get_sale_end(token_id)
    left = end - now
    if left <= 0:
        return "⚡ *PROMO ENDED*"
    d = int(left // 86400)
    h = int((left % 86400) // 3600)
    m = int((left % 3600) // 60)
    s = int(left % 60)
    parts = []
    if d > 0:
        parts.append(f"{d}d")
    parts.append(f"{h:02d}h")
    parts.append(f"{m:02d}m")
    parts.append(f"{s:02d}s")
    return "🔥 *PROMO ENDS IN:* `" + " ".join(parts) + "`"

def sale_end_str(token_id: int) -> str:
    end = get_sale_end(token_id)
    dt = datetime.fromtimestamp(end, tz=timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M UTC")

# ── Keyboards ──────────────────────────────────────────────────────────────────

def main_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔮 Browse NFTs", callback_data="browse"), InlineKeyboardButton("🌐 Open DApp", url=SITE_URL)],
        [InlineKeyboardButton("📖 Collection Info", callback_data="info"), InlineKeyboardButton("💎 How to Buy", callback_data="howto")],
        [InlineKeyboardButton("🔗 Contract", callback_data="contract"), InlineKeyboardButton("❓ Help", callback_data="help")],
    ])

def back_keyboard():
    return InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Back to Menu", callback_data="menu")]])

def nft_list_keyboard(page=0):
    per_page = 10
    start = page * per_page
    end = min(start + per_page, len(COLLECTION))
    rows = []
    chunk = COLLECTION[start:end]
    for i in range(0, len(chunk), 2):
        row = []
        for tid, sym in chunk[i:i+2]:
            row.append(InlineKeyboardButton(f"#{tid} {sym}", callback_data=f"nft_{tid}"))
        rows.append(row)
    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton("◀️ Prev", callback_data=f"page_{page-1}"))
    if end < len(COLLECTION):
        nav.append(InlineKeyboardButton("Next ▶️", callback_data=f"page_{page+1}"))
    if nav:
        rows.append(nav)
    rows.append([InlineKeyboardButton("⬅️ Back", callback_data="menu")])
    return InlineKeyboardMarkup(rows)

def nft_detail_keyboard(token_id, page=0):
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(f"🛒 Buy #{token_id} — {PRICE_MON} MON", url=f"{SITE_URL}#token={token_id}")],
        [InlineKeyboardButton("🔄 Refresh Countdown", callback_data=f"nft_{token_id}")],
        [InlineKeyboardButton("⬅️ Back to List", callback_data=f"browse_p{page}")],
    ])

# ── Handlers ───────────────────────────────────────────────────────────────────

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user.first_name or "Wizard"
    await update.message.reply_text(
        f"🔮 *Welcome to SPELLBOOK OF MONAD, {user}!*\n\n"
        f"Collect 31 unique Spellbook NFTs on the Monad blockchain\\.\n\n"
        f"🔥 *Promo price: {PRICE_MON} MON* — limited time\\!\n"
        f"⛓️ Chain: Monad \\(ID {CHAIN_ID}\\)\n"
        f"📦 Collection: {len(COLLECTION)} NFTs\n\n"
        f"Choose an option below 👇",
        parse_mode="MarkdownV2", reply_markup=main_keyboard()
    )

async def browse_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🃏 *All 31 Spellbooks* — tap any to see details:",
        parse_mode="Markdown", reply_markup=nft_list_keyboard(0)
    )

async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🔮 *SPELLBOOK BOT*\n\n/start — Main menu\n/browse — Browse NFTs\n/help — Help",
        parse_mode="Markdown", reply_markup=main_keyboard()
    )

def build_nft_text(tid: int, sym: str) -> str:
    countdown = format_countdown(tid)
    end_str   = sale_end_str(tid)
    return (
        f"🔮 *Spellbook \\#{tid} — {sym}*\n\n"
        f"💰 Price: *{PRICE_MON} MON*\n"
        f"⛓️ Chain: Monad \\(ID {CHAIN_ID}\\)\n"
        f"📦 Status: 🔒 Sealed \\(opens on purchase\\)\n\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"{countdown}\n"
        f"📅 Sale ends: `{end_str}`\n"
        f"━━━━━━━━━━━━━━━━━━\n\n"
        f"Tap *Buy* below to open the DApp\\!"
    )

async def button(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    data = q.data
    await q.answer()

    if data == "menu":
        await q.edit_message_text(
            "🔮 *SPELLBOOK OF MONAD*\n\nChoose an option 👇",
            parse_mode="Markdown", reply_markup=main_keyboard()
        )

    elif data == "browse" or data.startswith("browse_p"):
        page = int(data.split("browse_p")[1]) if data.startswith("browse_p") else 0
        await q.edit_message_text(
            "🃏 *Browse Spellbooks* — tap any NFT:",
            parse_mode="Markdown", reply_markup=nft_list_keyboard(page)
        )

    elif data.startswith("page_"):
        page = int(data.split("page_")[1])
        await q.edit_message_text(
            "🃏 *Browse Spellbooks* — tap any NFT:",
            parse_mode="Markdown", reply_markup=nft_list_keyboard(page)
        )

    elif data.startswith("nft_"):
        tid = int(data.split("nft_")[1])
        sym = next((s for t, s in COLLECTION if t == tid), "?")
        page = tid // 10
        await q.edit_message_text(
            build_nft_text(tid, sym),
            parse_mode="MarkdownV2",
            reply_markup=nft_detail_keyboard(tid, page)
        )

    elif data == "info":
        await q.edit_message_text(
            f"📖 *COLLECTION INFO*\n\n"
            f"🔮 Name: Spellbook of Monad\n"
            f"📦 Supply: {len(COLLECTION)} NFTs\n"
            f"💰 Price: {PRICE_MON} MON each\n"
            f"⛓️ Chain: Monad (ID {CHAIN_ID})\n"
            f"📄 Contract:\n`{CONTRACT}`\n\n"
            f"🔥 31 unique spellbooks — WMON, WETH, USDC, CHOG, MOLANDAK, GOLD and more!",
            parse_mode="Markdown", reply_markup=back_keyboard()
        )

    elif data == "howto":
        await q.edit_message_text(
            f"💎 *HOW TO BUY*\n\n"
            f"1️⃣ Install MetaMask\n"
            f"2️⃣ Add Monad network:\n"
            f"   • Chain ID: `{CHAIN_ID}`\n"
            f"   • RPC: `https://rpc.monad.xyz`\n"
            f"   • Symbol: MON\n"
            f"3️⃣ Get {PRICE_MON} MON\n"
            f"4️⃣ Open DApp: {SITE_URL}\n"
            f"5️⃣ Connect wallet → pick NFT → BUY\n"
            f"6️⃣ Approve tx → spellbook reveals! ✨",
            parse_mode="Markdown", reply_markup=back_keyboard()
        )

    elif data == "contract":
        await q.edit_message_text(
            f"🔗 *CONTRACT*\n\n`{CONTRACT}`\n\n"
            f"⛓️ Monad (ID {CHAIN_ID})\n\n"
            f"[Monadscan](https://monadscan.com/address/{CONTRACT})\n"
            f"[MonadVision](https://monadvision.com/token/{CONTRACT}?tab=Items)",
            parse_mode="Markdown", reply_markup=back_keyboard(), disable_web_page_preview=True
        )

    elif data == "help":
        await q.edit_message_text(
            f"❓ *HELP*\n\n/start — Main menu\n/browse — All NFTs\n/help — Help\n\n🌐 {SITE_URL}",
            parse_mode="Markdown", reply_markup=back_keyboard()
        )

async def unknown(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔮 Use /start to open the menu!", reply_markup=main_keyboard())

async def post_init(app: Application):
    await app.bot.set_my_commands([
        BotCommand("start", "Main menu"),
        BotCommand("browse", "Browse all NFTs"),
        BotCommand("help", "Help"),
    ])

# ── Main ───────────────────────────────────────────────────────────────────────

# ── Health server ─────────────────────────────────────────────────────────────

class _Health(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")
    def log_message(self, *a): pass

def start_health_server():
    port = int(os.environ.get("PORT", 3000))
    server = HTTPServer(("0.0.0.0", port), _Health)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    logger.info(f"Health server on :{port}")

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("browse", browse_cmd))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CallbackQueryHandler(button))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown))
    start_health_server()
    logger.info("Bot starting…")
    app.run_polling(allowed_updates=Update.ALL_TYPES, stop_signals=None)

if __name__ == "__main__":
    main()
