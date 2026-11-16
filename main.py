"""Точка входа для хостинга: запускает бота, API и планировщик."""
import asyncio

from bot.main import main

if __name__ == "__main__":
    asyncio.run(main())
