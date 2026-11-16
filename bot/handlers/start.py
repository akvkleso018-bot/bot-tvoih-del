"""Команды /start и /app — приветствие (RU + EN) и кнопка входа в Mini App."""
from __future__ import annotations

from aiogram import Router
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from bot import config as cfg

router = Router()

SEP = "\n\n——— English ———\n\n"


def _prices(tier: str, lang: str = "ru") -> str:
    """Строка цен из конфига — тексты не разойдутся с реальными инвойсами."""
    p = cfg.SUBSCRIPTION_PLANS[tier]
    if lang == "ru":
        return (f"неделя {p['week']['stars']}⭐ · месяц {p['month']['stars']}⭐ · "
                f"год {p['year']['stars']}⭐ · навсегда {p['forever']['stars']}⭐")
    return (f"week {p['week']['stars']}⭐ · month {p['month']['stars']}⭐ · "
            f"year {p['year']['stars']}⭐ · forever {p['forever']['stars']}⭐")


WELCOME_RU = (
    "Привет, <b>{name}</b>! 👋\n\n"
    "Я — <b>Бот твоих дел</b>: превращаю хаос дел в понятный план на день.\n\n"
    "📋 <b>Задачи с дедлайнами</b>\n"
    "• добавляй дела текстом или голосом (микрофон в приложении)\n"
    "• ставь дедлайн каждой задаче — есть календарь и быстрые чипы времени\n"
    "• закрывай дела кнопкой «Сделано!» и смотри прогресс дня в процентах\n\n"
    "🔥 <b>Режим паники</b> (подписка)\n"
    "• вечером бот настойчиво и эмоционально напоминает о невыполненном, пока день не закрыт\n"
    "• жёсткие напоминания за час до каждого горящего дедлайна\n\n"
    "🏆 <b>Честный топ недели</b>\n"
    "• очки только за задачи, выполненные в срок — накрутить нельзя\n"
    "• топ-3 каждый понедельник получают подписку: +3/+2/+1 дня\n"
    "• добавляй игроков в друзья (заявки, анонимные профили) и соревнуйся среди друзей\n\n"
    "👑 <b>Подписки</b>\n"
    "• <b>Обычная</b> — 6 задач в день: {prices_reg}\n"
    "• <b>Elite</b> — безлимит задач: {prices_elite}\n"
    "• без подписки — 2 задачи в день\n\n"
    "🎨 <b>Настройки</b> (шестерёнка в приложении): 10 тем, акцентные цвета, шрифты,\n"
    "размер текста, язык RU/EN и другое.\n\n"
    "💡 Профиль, статистика и репутация — кнопка «Профиль» в приложении.\n\n"
    "Открой планировщик кнопкой ниже и наведи порядок в делах!"
)

WELCOME_EN = (
    "Hi <b>{name}</b>! 👋\n\n"
    "I'm <b>Your Deals Bot</b> — I turn daily chaos into a clear plan.\n\n"
    "📋 <b>Tasks with deadlines</b>\n"
    "• add tasks by text or voice (mic in the app)\n"
    "• set a deadline for each task — calendar and quick time chips included\n"
    "• close tasks with “Done!” and watch your daily progress %\n\n"
    "🔥 <b>Panic mode</b> (subscription)\n"
    "• in the evening the bot persistently and emotionally reminds you about unfinished tasks until the day is closed\n"
    "• hard reminders one hour before every burning deadline\n\n"
    "🏆 <b>Honest weekly top</b>\n"
    "• points only for tasks completed on time — no cheating\n"
    "• top-3 get a subscription every Monday: +3/+2/+1 days\n"
    "• add players as friends (requests, anonymous profiles) and compete among friends\n\n"
    "👑 <b>Subscriptions</b>\n"
    "• <b>Standard</b> — 6 tasks a day: {prices_reg_en}\n"
    "• <b>Elite</b> — unlimited tasks: {prices_elite_en}\n"
    "• no subscription — 2 tasks a day\n\n"
    "🎨 <b>Settings</b> (gear icon in the app): 10 themes, accent colors, fonts,\n"
    "text size, RU/EN language and more.\n\n"
    "💡 Profile, stats and reputation — the “Profile” button in the app.\n\n"
    "Open the planner with the button below and get things done!"
)

GIFT_RU = (
    "\n\n🎁 <b>Подарок новичку:</b> подписка «Обычная» на 2 дня уже активирована — "
    "попробуй 6 задач в день и Режим паники!"
)
GIFT_EN = (
    "\n\n🎁 <b>Newcomer gift:</b> the Standard plan is already active for 2 days — "
    "try 6 tasks a day and Panic mode!"
)


def main_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="Открыть планировщик · Open the planner",
                web_app=WebAppInfo(url=cfg.WEBAPP_URL),
            )],
            [InlineKeyboardButton(
                text="Подписки · Plans",
                callback_data="buy_premium",
            )],
        ]
    )


@router.message(CommandStart())
async def cmd_start(message: Message, db) -> None:
    uid = message.from_user.id
    row = await db.get_user(uid)
    is_new = row is None
    await db.upsert_user(uid, message.from_user.username, message.from_user.first_name)

    gift = ""
    if is_new:
        await db.add_subscription(uid, "regular", 2)
        gift = GIFT_RU + GIFT_EN

    await message.answer(
        WELCOME_RU.format(
            name=message.from_user.first_name or "друг",
            prices_reg=_prices("regular"),
            prices_elite=_prices("elite"),
        )
        + SEP
        + WELCOME_EN.format(
            name=message.from_user.first_name or "friend",
            prices_reg_en=_prices("regular", "en"),
            prices_elite_en=_prices("elite", "en"),
        )
        + gift,
        reply_markup=main_kb(),
    )


@router.message(Command("app"))
async def cmd_app(message: Message) -> None:
    await message.answer(
        "Открой планировщик кнопкой ниже 👇 · Open the planner below 👇",
        reply_markup=main_kb(),
    )
