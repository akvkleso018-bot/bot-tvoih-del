"""Точка входа: aiogram (polling) + aiohttp (Mini App API) + APScheduler."""
from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand
from aiohttp import web

from bot import config as cfg
from bot.db import Database
from bot.handlers import admin, payments, start
from bot.scheduler_jobs import setup_scheduler
from bot.webapp_api import build_app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)


async def main() -> None:
    db = Database(cfg.DB_PATH)
    await db.init()

    bot = Bot(cfg.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()
    dp["db"] = db
    dp.include_routers(start.router, payments.router, admin.router)

    # --- HTTP-сервер для Mini App ---
    app = build_app(bot, db)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, cfg.HOST, cfg.PORT)
    await site.start()
    logging.info("Mini App API: http://%s:%s/webapp", cfg.HOST, cfg.PORT)
    if "example.com" in cfg.WEBAPP_URL:
        logging.warning(
            "WEBAPP_URL выглядит как заглушка — кнопка Mini App заработает, "
            "только если указать реальный HTTPS-адрес в .env"
        )

    scheduler = setup_scheduler(bot, db)
    scheduler.start()
    logging.info("Планировщик запущен (panic/deadline/free_reminder)")

    try:
        await bot.set_my_commands([
            BotCommand(command="start", description="Открыть планировщик"),
            BotCommand(command="premium", description="Подписки за Stars"),
        ])
    except Exception:
        logging.warning("Не удалось установить команды (сеть?) — продолжаем")
    try:
        await dp.start_polling(bot)
    finally:
        scheduler.shutdown(wait=False)
        await runner.cleanup()
        await bot.session.close()
        await db.close()


if __name__ == "__main__":
    asyncio.run(main())
