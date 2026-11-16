"""Админ-бот: работает ВНУТРИ процесса основного бота, читает базу напрямую.

Включается, если задан ADMIN_BOT_TOKEN. Отвечает только ADMIN_ID.
"""
from __future__ import annotations

import asyncio
import html as html_mod
import logging
import time
from datetime import datetime

from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from bot import config as cfg
from bot.db import Database
from bot.profile import week_bounds

log = logging.getLogger(__name__)
router = Router()

START_TS = time.time()
FOREVER_TS = 4102444800


@router.message.middleware
@router.callback_query.middleware
async def admin_only(handler, event, data):
    user = getattr(event, "from_user", None)
    if not user or user.id not in cfg.ADMIN_IDS:
        if isinstance(event, CallbackQuery):
            await event.answer("⛔ Нет доступа", show_alert=True)
        else:
            await event.answer("⛔ Нет доступа.")
        return
    return await handler(event, data)

MENU = (
    "🛡 <b>Панель администратора</b>\n\n"
    "Вся статистика бота «Бот твоих дел» — кнопки ниже.\n\n"
    "Команды:\n"
    "/stats — сводка\n"
    "/users — все пользователи\n"
    "/user &lt;id или @username&gt; — карточка игрока\n"
    "/payments — последние платежи\n"
    "/suggestions — идеи пользователей\n"
    "/broadcast &lt;текст&gt; — рассылка всем\n"
    "/topreset — сбросить топ недели\n"
    "/ping — статус системы"
)

BC_TEXTS: dict[int, str] = {}


def esc(s) -> str:
    return html_mod.escape(str(s or ""))


def fmt_dt(ts: int) -> str:
    return datetime.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")


def kb_main() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Статистика", callback_data="p:stats")],
        [InlineKeyboardButton(text="💳 Платежи", callback_data="p:pay"),
         InlineKeyboardButton(text="👥 Пользователи", callback_data="p:us:0")],
        [InlineKeyboardButton(text="💡 Идеи", callback_data="p:sug")],
    ])


def suggestion_kb(sid: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="✅ Принять", callback_data=f"p:ok:{sid}"),
        InlineKeyboardButton(text="❌ Отклонить", callback_data=f"p:no:{sid}"),
    ]])


# ---------- пользователи и подписки ----------

USERS_PER_PAGE = 8

PERIOD_DAYS = {"week": 7, "month": 30, "year": 365, "forever": 0}
PERIOD_TITLES = {"week": "неделя", "month": "месяц", "year": "год", "forever": "навсегда"}
TIER_TITLES = {"regular": "⭐ Обычная", "elite": "💎 Elite"}


def tier_line(row: dict) -> str:
    tier = row.get("tier") or "none"
    until = row.get("premium_until") or 0
    if tier == "elite":
        t = "💎 Elite"
    elif tier == "regular":
        t = "⭐ Обычная"
    else:
        return "— без подписки"
    if until >= FOREVER_TS:
        return f"{t} · навсегда"
    return f"{t} · до {fmt_dt(until)}"


def user_line(row: dict, num: int | None = None) -> str:
    name = esc(row.get("first_name") or "Игрок")
    tag = f" (@{esc(row.get('username'))})" if row.get("username") else ""
    prefix = f"{num}. " if num else ""
    return f"{prefix}<b>{name}</b>{tag} — {tier_line(row)}\n   id: <code>{row['telegram_id']}</code>"


def users_kb(page: int, total: int) -> InlineKeyboardMarkup:
    pages = max(1, (total + USERS_PER_PAGE - 1) // USERS_PER_PAGE)
    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton(text="◀️", callback_data=f"p:us:{page - 1}"))
    nav.append(InlineKeyboardButton(text=f"{page + 1}/{pages}", callback_data="p:noop"))
    if page + 1 < pages:
        nav.append(InlineKeyboardButton(text="▶️", callback_data=f"p:us:{page + 1}"))
    rows = [nav] if len(nav) > 1 else []
    rows.append([InlineKeyboardButton(text="🏠 В меню", callback_data="p:menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


async def users_text(db: Database, page: int) -> tuple[str, int]:
    users = await db.list_users()
    total = len(users)
    start = page * USERS_PER_PAGE
    chunk = users[start:start + USERS_PER_PAGE]
    if not chunk:
        return "👥 Пользователей пока нет.", 0
    lines = [f"👥 <b>Пользователи</b> · всего {total}", ""]
    for i, u in enumerate(chunk, start=start + 1):
        lines.append(user_line(u, i))
    lines.append("")
    lines.append("Нажми на «Пользователи» → id → карточка и выдача подписки.")
    return "\n".join(lines), total


def user_card_kb(uid: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎁 Выдать подписку", callback_data=f"p:gt:{uid}")],
        [InlineKeyboardButton(text="🗑 Отозвать подписку", callback_data=f"p:rv:{uid}")],
        [InlineKeyboardButton(text="◀️ К списку", callback_data="p:us:0"),
         InlineKeyboardButton(text="🏠 В меню", callback_data="p:menu")],
    ])


def tier_kb(uid: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ Обычная", callback_data=f"p:gr:{uid}:regular"),
         InlineKeyboardButton(text="💎 Elite", callback_data=f"p:gr:{uid}:elite")],
        [InlineKeyboardButton(text="◀️ Назад", callback_data=f"p:u:{uid}")],
    ])


def period_kb(uid: int, tier: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="1 неделя", callback_data=f"p:pd:{uid}:{tier}:week"),
         InlineKeyboardButton(text="1 месяц", callback_data=f"p:pd:{uid}:{tier}:month")],
        [InlineKeyboardButton(text="1 год", callback_data=f"p:pd:{uid}:{tier}:year"),
         InlineKeyboardButton(text="♾ Навсегда", callback_data=f"p:pd:{uid}:{tier}:forever")],
        [InlineKeyboardButton(text="◀️ Назад", callback_data=f"p:gt:{uid}")],
    ])


async def stats_text(db: Database) -> str:
    day_start, _ = db.day_bounds()
    ws, _ = week_bounds()
    s = await db.stats()
    lines = [
        "📊 <b>Статистика бота твоих дел</b>",
        "",
        f"👥 Пользователей: <b>{s['users']}</b>",
        f"   • новых сегодня: {await db.new_users_count(day_start)}"
        f" · за неделю: {await db.new_users_count(ws)}",
        f"👑 Подписок: <b>{s['premium']}</b>",
        f"   • Обычная: {s['regular']} · Elite: {s['elite']}",
        "",
        "📋 Задачи:",
        f"   • всего: <b>{s['tasks_total']}</b>",
        f"   • активных сегодня: <b>{s['tasks_open']}</b>",
        f"   • выполнено сегодня: <b>{s['done_today']}</b>",
        "",
        "⭐ Доход:",
        f"   • всего: <b>{s['stars']} Stars</b>",
        f"   • сегодня: <b>{await db.stars_sum(day_start)}</b>"
        f" · за неделю: <b>{await db.stars_sum(ws)}</b>",
        "",
        f"💡 Идей на рассмотрении: <b>{len(await db.active_suggestions(limit=100))}</b>",
        f"⏱ Аптайм панели: {fmt_uptime()}",
    ]
    return "\n".join(lines)


def fmt_uptime() -> str:
    secs = int(time.time() - START_TS)
    d, r = divmod(secs, 86400)
    h, r = divmod(r, 3600)
    m, _ = divmod(r, 60)
    return (f"{d} д " if d else "") + f"{h} ч {m} мин"


async def payments_text(db: Database) -> str:
    pays = await db.recent_payments(15)
    if not pays:
        return "💳 Платежей пока не было."
    lines = ["💳 <b>Последние платежи</b>", ""]
    for p in pays:
        who = esc(p.get("first_name") or "Игрок")
        tag = f" (@{esc(p['username'])})" if p.get("username") else ""
        plan = f" · {esc(p['plan'].replace(':', ' · '))}" if p.get("plan") else ""
        lines.append(
            f"• <b>{who}</b>{tag}{plan} — <b>+{p['stars']}⭐</b> ({fmt_dt(p['created_at'])})\n"
            f"   id: <code>{p['user_id']}</code>"
        )
    return "\n".join(lines)


async def user_text(db: Database, uid: int) -> str:
    u = await db.user_detail(uid)
    if not u:
        return f"Пользователь <code>{uid}</code> не найден."
    tier = {"regular": "Обычная", "elite": "Elite", "none": "—"}[u["tier"]]
    if u["premium_until"] >= FOREVER_TS:
        until = "навсегда"
    elif u["premium_until"]:
        until = fmt_dt(u["premium_until"])
    else:
        until = "—"
    return "\n".join([
        f"👤 <b>{esc(u['first_name'] or 'Игрок')}</b>"
        + (f" (@{esc(u['username'])})" if u.get("username") else ""),
        f"id: <code>{u['telegram_id']}</code>",
        "",
        f"👑 Подписка: <b>{tier}</b> · до: {until}",
        f"📋 Задач: всего {u['tasks']['total']}"
        f" · активных {u['tasks']['active']}"
        f" · выполнено {u['tasks']['completed']}",
        f"💳 Платежей: {u['payments']['n']} на <b>{u['payments']['stars']}⭐</b>",
        f"📅 С нами с: {fmt_dt(u['created_at'])}",
    ])


# ---------- команды ----------

@router.message(CommandStart())
async def cmd_start(m: Message, db: Database):
    await m.answer(MENU, reply_markup=kb_main())


@router.message(Command("stats"))
async def cmd_stats(m: Message, db: Database):
    await m.answer(await stats_text(db), reply_markup=kb_main())


@router.message(Command("payments"))
async def cmd_payments(m: Message, db: Database):
    await m.answer(await payments_text(db))


@router.message(Command("suggestions"))
async def cmd_suggestions(m: Message, db: Database):
    sugs = await db.active_suggestions()
    if not sugs:
        await m.answer("💡 Активных идей нет.")
        return
    await m.answer(f"💡 Активных идей: <b>{len(sugs)}</b>")
    for sg in sugs[:10]:
        who = esc(sg.get("first_name") or "Игрок")
        tag = f" (@{esc(sg['username'])})" if sg.get("username") else ""
        await m.answer(
            f"💡 <b>#{sg['id']}</b> от {who}{tag} ({fmt_dt(sg['created_at'])}):\n\n«{esc(sg['text'])}»",
            reply_markup=suggestion_kb(sg["id"]),
        )


@router.message(Command("user"))
async def cmd_user(m: Message, db: Database):
    parts = (m.text or "").split()
    if len(parts) < 2 or not parts[1].strip():
        await m.answer("Использование: <code>/user &lt;id или @username&gt;</code>")
        return
    q = parts[1].strip()
    if q.startswith("@"):
        row = await db.user_by_username(q)
    elif q.lstrip("-").isdigit():
        row = await db.get_user(int(q))
    else:
        row = await db.user_by_username(q)
    if not row:
        await m.answer("Пользователь не найден — он ещё ни разу не писал боту.")
        return
    await m.answer(await user_text(db, int(row["telegram_id"])), reply_markup=user_card_kb(int(row["telegram_id"])))


@router.message(Command("users"))
async def cmd_users(m: Message, db: Database):
    text, total = await users_text(db, 0)
    await m.answer(text, reply_markup=users_kb(0, total))


@router.message(Command("topreset"))
async def cmd_topreset(m: Message, db: Database):
    from bot.profile import week_bounds

    ws, we = week_bounds()
    top = await db.weekly_leaderboard(ws, we, limit=3)
    if not top:
        await m.answer("🏆 Топ недели и так пуст — сбрасывать нечего.")
        return
    lines = ["🏆 <b>Текущий топ недели:</b>", ""]
    for i, r in enumerate(top, 1):
        pts = r["on_time"] * 10 + r["late"] * 3
        lines.append(f"  {i}. {esc(r['first_name'] or 'Игрок')} — {pts} очков")
    lines += ["", "Очки, набранные до сброса, обнулятся (у пользователей не изменятся подписки).", "Точно сбросить?"]
    confirm = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🗑 Да, сбросить", callback_data="p:tr:yes"),
        InlineKeyboardButton(text="❌ Нет", callback_data="p:tr:no"),
    ]])
    await m.answer("\n".join(lines), reply_markup=confirm)


@router.message(Command("broadcast"))
async def cmd_broadcast(m: Message):
    parts = (m.text or "").split(maxsplit=1)
    if len(parts) < 2:
        await m.answer("Использование: <code>/broadcast &lt;текст&gt;</code>")
        return
    text = parts[1][:4000]
    bc_id = abs(hash(text)) % 10**9
    BC_TEXTS[bc_id] = text
    confirm = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="📣 Да, отправить всем", callback_data=f"p:bc:{bc_id}"),
        InlineKeyboardButton(text="❌ Нет", callback_data=f"p:bcno:{bc_id}"),
    ]])
    await m.answer(
        "Отправить всем пользователям?\n\n" + html_mod.escape(text[:1000]),
        reply_markup=confirm,
    )


@router.message(Command("ping"))
async def cmd_ping(m: Message, db: Database):
    try:
        await db.get_user(0)
        db_ok = True
    except Exception:
        db_ok = False
    await m.answer(
        f"🟢 Все системы работают\n"
        f"База данных: {'ок' if db_ok else 'ОШИБКА'}\n"
        f"Аптайм контейнера: {fmt_uptime()}"
    )


# ---------- колбэки ----------

@router.callback_query(F.data.startswith("p:"))
async def on_press(cb: CallbackQuery, db: Database, main_bot: Bot, admin_bot: Bot):
    parts = cb.data.split(":")
    act = parts[1]

    if act == "noop":
        await cb.answer()
        return

    if act == "menu":
        await cb.message.edit_text(MENU, reply_markup=kb_main())
        await cb.answer()
        return

    if act == "stats":
        await cb.message.edit_text(await stats_text(db), reply_markup=kb_main())
        await cb.answer("Обновлено")
        return

    if act == "pay":
        await cb.message.edit_text(await payments_text(db), reply_markup=kb_main())
        await cb.answer()
        return

    if act == "sug":
        sugs = await db.active_suggestions()
        if not sugs:
            await cb.message.edit_text("💡 Активных идей нет.", reply_markup=kb_main())
        else:
            head = f"💡 Активных идей: <b>{len(sugs)}</b>"
            await cb.message.edit_text(head)
            for sg in sugs[:10]:
                await admin_bot.send_message(
                    cb.from_user.id,
                    f"💡 <b>#{sg['id']}</b> от {esc(sg.get('first_name') or 'Игрок')}:\n\n«{esc(sg['text'])}»",
                    reply_markup=suggestion_kb(sg["id"]),
                )
        await cb.answer()
        return

    if act == "us":
        page = int(parts[2]) if len(parts) > 2 and parts[2].lstrip("-").isdigit() else 0
        text, total = await users_text(db, page)
        await cb.message.edit_text(text, reply_markup=users_kb(page, total))
        await cb.answer()
        return

    if act == "u":
        uid = int(parts[2])
        await cb.message.edit_text(await user_text(db, uid), reply_markup=user_card_kb(uid))
        await cb.answer()
        return

    if act == "gt":
        uid = int(parts[2])
        row = await db.get_user(uid)
        name = esc(row["first_name"] or "Игрок") if row else f"id {uid}"
        await cb.message.edit_text(
            f"🎁 Подписка для <b>{name}</b>\n\nВыбери тариф:",
            reply_markup=tier_kb(uid),
        )
        await cb.answer()
        return

    if act == "gr":
        uid, tier = int(parts[2]), parts[3]
        await cb.message.edit_text(
            f"Тариф: <b>{TIER_TITLES.get(tier, tier)}</b>\n\nВыбери период:",
            reply_markup=period_kb(uid, tier),
        )
        await cb.answer()
        return

    if act == "pd":
        uid, tier, period = int(parts[2]), parts[3], parts[4]
        days = PERIOD_DAYS.get(period)
        if tier not in ("regular", "elite") or days is None:
            await cb.answer("Неверный тариф", show_alert=True)
            return
        await db.add_subscription(uid, tier, days)
        row = await db.get_user(uid)
        name = esc(row["first_name"] or "Игрок") if row else f"id {uid}"
        await cb.message.edit_text(
            f"✅ <b>{name}</b> — выдана подписка {TIER_TITLES.get(tier, tier)} "
            f"({PERIOD_TITLES[period]})\n\n{tier_line(dict(row)) if row else ''}",
            reply_markup=user_card_kb(uid),
        )
        await cb.answer("Выдано ✅")
        return

    if act == "rv":
        uid = int(parts[2])
        await db.revoke_premium(uid)
        row = await db.get_user(uid)
        name = esc(row["first_name"] or "Игрок") if row else f"id {uid}"
        await cb.message.edit_text(
            f"🗑 <b>{name}</b> — подписка отозвана.",
            reply_markup=user_card_kb(uid),
        )
        await cb.answer("Отозвано")
        return

    if act in ("ok", "no"):
        sid = int(parts[2])
        sg = await db.get_suggestion(sid)
        ok_status = await db.set_suggestion_status(sid, "done" if act == "ok" else "declined")
        await cb.answer("Принято ✅" if act == "ok" else "Отклонено ❌")
        if ok_status:
            try:
                await cb.message.edit_reply_markup(reply_markup=None)
            except Exception:
                pass
            # уведомляем автора идеи через основной бот
            await _notify_author(main_bot, sg, "done" if act == "ok" else "declined")
        return

    if act == "tr":
        if parts[2] != "yes":
            await cb.message.edit_text("Сброс топа отменён.")
            await cb.answer("Отменено")
            return
        ts = await db.reset_top()
        from datetime import datetime as _dt

        when = _dt.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")
        await cb.message.edit_text(
            f"🗑 Топ недели сброшен ({when}).\n"
            "Очки считаются заново — только за задачи, выполненные после сброса.\n"
            "Награды и подписки пользователей не тронуты."
        )
        await cb.answer("Сброшено")
        return

    if act == "bcno":
        bc_id = int(parts[2])
        BC_TEXTS.pop(bc_id, None)
        await cb.message.edit_text("❌ Рассылка отменена.")
        await cb.answer("Отменено")
        return

    if act == "bc":
        text = BC_TEXTS.pop(int(parts[2]), "")
        if not text:
            await cb.answer("Текст рассылки устарел — отправь /broadcast заново", show_alert=True)
            return
        safe = esc(text)  # бот шлёт в HTML-режиме: <, > и & в тексте ломают разметку
        sent, failed = 0, 0
        last_err = ""
        for uid in await db.all_user_ids():
            try:
                await main_bot.send_message(uid, safe)
                sent += 1
            except Exception as e:
                failed += 1
                if not last_err:
                    last_err = str(e)[:160]
            await asyncio.sleep(0.05)
        report = f"📣 Рассылка завершена: {sent} доставлено, {failed} не удалось."
        if failed and last_err:
            report += f"\n⚠️ Причина: {esc(last_err)}"
        await cb.message.edit_text(report)
        await cb.answer()
        return

    await cb.answer()


async def _notify_author(bot: Bot, sg: dict | None, status: str) -> None:
    """Уведомление автору идеи о решении (через основной бот)."""
    if not sg or not sg.get("user_id"):
        return
    short = esc((sg.get("text") or "")[:100])
    if status == "done":
        msg = f"✅ Твою идею приняли: «{short}»\n\nСпасибо за вклад в «Бот твоих дел»!"
    else:
        msg = f"❌ Твою идею отклонили: «{short}»\n\nСпасибо, что поделился — присылай ещё!"
    try:
        await bot.send_message(int(sg["user_id"]), msg)
    except Exception:
        log.warning("Не удалось уведомить автора идеи #%s", sg.get("id"))
