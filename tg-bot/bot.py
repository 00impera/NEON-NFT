import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
SITE_URL  = os.environ.get("SITE_URL", "https://0654c680.neon-nft.pages.dev")
CONTRACT  = "0x50808F5De069251aBFB3BDe5F3BE33Fc08c36626"
CHAIN_ID  = 143
PRICE_MON = 100

COLLECTION = [
    (0,"WMON"),(1,"cbBTC"),(2,"WBTC"),(3,"WETH"),(4,"wstETH"),
    (5,"AUSD"),(6,"USDTO"),(7,"aprMON"),(8,"APR"),(9,"shMON"),
    (10,"CHOG"),(11,"BOB"),(12,"LV"),(13,"DUST"),(14,"XAUtO"),
    (15,"Moncat"),(16,"CAKE"),(17,"moncock"),(18,"LVUSD"),(19,"shrapm"),
    (20,"USD1"),(21,"emo"),(22,"MOLANDAK"),(23,"MOUCH"),(24,"gMON"),
    (25,"sMON"),(26,"UNIT"),(27,"LVMON"),(28,"USDC"),(29,"GOLD"),(30,"MonCat2"),
]

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
        [InlineKeyboardButton("⬅️ Back to List", callback_data=f"browse_p{page}")],
    ])

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user.first_name or "Wizard"
    await update.message.reply_text(
        f"🔮 *Welcome to SPELLBOOK OF MONAD, {user}!*\n\nCollect 31 unique Spellbook NFTs on the Monad blockchain.\n\n🔥 *Promo price: {PRICE_MON} MON* — limited time!\n⛓️ Chain: Monad (ID {CHAIN_ID})\n📦 Collection: {len(COLLECTION)} NFTs\n\nChoose an option below 👇",
        parse_mode="Markdown", reply_markup=main_keyboard()
    )

async def browse_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🃏 *All 31 Spellbooks* — tap any to see details:", parse_mode="Markdown", reply_markup=nft_list_keyboard(0))

async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔮 *SPELLBOOK BOT*\n\n/start — Main menu\n/browse — Browse NFTs\n/help — Help", parse_mode="Markdown", reply_markup=main_keyboard())

async def button(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    data = q.data
    await q.answer()
    if data == "menu":
        await q.edit_message_text("🔮 *SPELLBOOK OF MONAD*\n\nChoose an option 👇", parse_mode="Markdown", reply_markup=main_keyboard())
    elif data == "browse" or data.startswith("browse_p"):
        page = int(data.split("browse_p")[1]) if data.startswith("browse_p") else 0
        await q.edit_message_text("🃏 *Browse Spellbooks* — tap any NFT:", parse_mode="Markdown", reply_markup=nft_list_keyboard(page))
    elif data.startswith("page_"):
        page = int(data.split("page_")[1])
        await q.edit_message_text("🃏 *Browse Spellbooks* — tap any NFT:", parse_mode="Markdown", reply_markup=nft_list_keyboard(page))
    elif data.startswith("nft_"):
        tid = int(data.split("nft_")[1])
        sym = next((s for t,s in COLLECTION if t == tid), "?")
        page = tid // 10
        await q.edit_message_text(
            f"🔮 *Spellbook #{tid} — {sym}*\n\n💰 Price: *{PRICE_MON} MON*\n⛓️ Chain: Monad (ID {CHAIN_ID})\n📦 Status: 🔒 Sealed (opens on purchase)\n\nTap *Buy* below to open the DApp!",
            parse_mode="Markdown", reply_markup=nft_detail_keyboard(tid, page)
        )
    elif data == "info":
        await q.edit_message_text(
            f"📖 *COLLECTION INFO*\n\n🔮 Name: Spellbook of Monad\n📦 Supply: {len(COLLECTION)} NFTs\n💰 Price: {PRICE_MON} MON each\n⛓️ Chain: Monad (ID {CHAIN_ID})\n📄 Contract:\n`{CONTRACT}`\n\n🔥 31 unique spellbooks — WMON, WETH, USDC, CHOG, MOLANDAK, GOLD and more!",
            parse_mode="Markdown", reply_markup=back_keyboard()
        )
    elif data == "howto":
        await q.edit_message_text(
            f"💎 *HOW TO BUY*\n\n1️⃣ Install MetaMask\n2️⃣ Add Monad network:\n   • Chain ID: `{CHAIN_ID}`\n   • RPC: `https://rpc.monad.xyz`\n   • Symbol: MON\n3️⃣ Get {PRICE_MON} MON\n4️⃣ Open DApp: {SITE_URL}\n5️⃣ Connect wallet → pick NFT → BUY\n6️⃣ Approve tx → spellbook reveals! ✨",
            parse_mode="Markdown", reply_markup=back_keyboard()
        )
    elif data == "contract":
        await q.edit_message_text(
            f"🔗 *CONTRACT*\n\n`{CONTRACT}`\n\n⛓️ Monad (ID {CHAIN_ID})\n\n[Monadscan](https://monadscan.com/address/{CONTRACT})\n[MonadVision](https://monadvision.com/token/{CONTRACT}?tab=Items)",
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

def main():
    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("browse", browse_cmd))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CallbackQueryHandler(button))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown))
    logger.info("Bot starting…")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
