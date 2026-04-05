/**
 * server/telegram.ts — Telegram bot for Timeceptor
 *
 * Features:
 *  - /start          — link Telegram to Timeceptor account via a deep-link token
 *  - /today          — show today's best windows
 *  - /week           — show this week's top 5
 *  - Inline buttons  — rate a session (great / average / poor)
 *  - Push alerts     — upcoming high-score window (called from cron.ts)
 *  - Rating prompts  — "How was your Mars hour?" (called from cron.ts)
 *
 * Set TELEGRAM_BOT_TOKEN in .env. If missing, bot is disabled (no crash).
 */

import TelegramBot from 'node-telegram-bot-api';
import { Users, UserScores, Ratings } from './db.js';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot: TelegramBot | null = null;

export function isBotActive(): boolean {
  return bot !== null;
}

if (TOKEN) {
  bot = new TelegramBot(TOKEN, { polling: true });
  console.log('[telegram] bot started (polling)');

  // ── /start <uid> ── Link chat to Timeceptor account ────────────────────
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const uid    = match?.[1]?.trim();

    if (!uid) {
      return bot!.sendMessage(chatId,
        '✦ Welcome to Timeceptor!\n\n' +
        'Open timeceptor.com, go to Settings → Link Telegram, and tap the button to connect your account.');
    }

    try {
      const user = await Users.get(uid);
      if (!user) {
        return bot!.sendMessage(chatId, '❌ Account not found. Make sure you signed up at timeceptor.com first.');
      }

      await Users.setTelegramChatId(uid, chatId);
      return bot!.sendMessage(chatId,
        `✅ Linked to ${user.email ?? 'your account'}!\n\n` +
        `You'll get alerts before high-energy windows and rating prompts after. Use /today or /week anytime.`);
    } catch (err) {
      console.error('[telegram] /start error:', err);
      return bot!.sendMessage(chatId, '⚠️ Something went wrong. Try again later.');
    }
  });

  // ── /today ── Best windows today ───────────────────────────────────────
  bot.onText(/\/today/, async (msg) => {
    const chatId = msg.chat.id.toString();
    try {
      const user = await findUserByChatId(chatId);
      if (!user) return bot!.sendMessage(chatId, '❌ Account not linked. Use /start <uid>');

      const now   = new Date();
      const start = new Date(now); start.setUTCHours(0, 0, 0, 0);
      const end   = new Date(now); end.setUTCHours(23, 59, 59, 999);

      const scores = await UserScores.forRange(user.uid, start, end);
      const top    = scores.filter(s => s.score >= 40).sort((a, b) => b.score - a.score).slice(0, 8);

      if (top.length === 0) {
        return bot!.sendMessage(chatId, '📊 No high-energy windows today. Rest day! 🧘');
      }

      const lines = top.map(s => {
        const h = s.dt.getUTCHours().toString().padStart(2, '0');
        const emoji = s.score >= 70 ? '🔥' : s.score >= 50 ? '⚡' : '✨';
        return `${emoji} ${h}:00 — ${s.horaLord} hora — ${s.score}/100 (${s.activity})`;
      });

      return bot!.sendMessage(chatId, `✦ Today's Best Windows\n\n${lines.join('\n')}`);
    } catch (err) {
      console.error('[telegram] /today error:', err);
      return bot!.sendMessage(chatId, '⚠️ Error fetching today\'s windows.');
    }
  });

  // ── /week ── Top 5 this week ───────────────────────────────────────────
  bot.onText(/\/week/, async (msg) => {
    const chatId = msg.chat.id.toString();
    try {
      const user = await findUserByChatId(chatId);
      if (!user) return bot!.sendMessage(chatId, '❌ Account not linked. Use /start <uid>');

      const upcoming = await UserScores.upcoming(user.uid, 70, 5);

      if (upcoming.length === 0) {
        return bot!.sendMessage(chatId, '📊 No 70+ score windows upcoming. Keep an eye on /today.');
      }

      const lines = upcoming.map(s => {
        const day = s.dt.toISOString().slice(5, 10); // MM-DD
        const h   = s.dt.getUTCHours().toString().padStart(2, '0');
        return `🔥 ${day} ${h}:00 — ${s.horaLord} — ${s.score}/100 (${s.activity})`;
      });

      return bot!.sendMessage(chatId, `✦ Upcoming High-Energy Windows\n\n${lines.join('\n')}`);
    } catch (err) {
      console.error('[telegram] /week error:', err);
      return bot!.sendMessage(chatId, '⚠️ Error fetching weekly windows.');
    }
  });

  // ── Callback query handler — inline rating buttons ─────────────────────
  bot.on('callback_query', async (query) => {
    if (!query.data || !query.message) return;
    try {
      // data format: "rate:<uid>:<ISO dt>:<rating>"
      const parts = query.data.split(':');
      if (parts[0] !== 'rate' || parts.length < 4) return;

      const [, uid, dtStr, rating] = parts;
      if (!['great', 'average', 'poor'].includes(rating)) return;

      const dt   = new Date(dtStr);
      const date = dt.toISOString().slice(0, 10);
      const hour = dt.getUTCHours();

      await Ratings.add({
        uid,
        date,
        hour,
        horaRuler: '', // will be filled from score context
        score:     0,
        planets:   [],
        rating:    rating as 'great' | 'average' | 'poor',
        ratedAt:   new Date().toISOString(),
      });

      const emoji = rating === 'great' ? '🌟' : rating === 'average' ? '👍' : '😴';
      await bot!.answerCallbackQuery(query.id, { text: `${emoji} Rated: ${rating}` });
      await bot!.editMessageReplyMarkup(
        { inline_keyboard: [] },
        {
          chat_id:    query.message.chat.id,
          message_id: query.message.message_id,
        },
      );
    } catch (err) {
      console.error('[telegram] callback_query error:', err);
    }
  });
} else {
  console.log('[telegram] TELEGRAM_BOT_TOKEN not set — bot disabled');
}

// ── Helper: find user by telegram chat ID ─────────────────────────────────────
async function findUserByChatId(chatId: string) {
  // Simple scan — fine for < 10k users. Index later if needed.
  const users = await Users.list();
  return users.find(u => u.telegramChatId === chatId) ?? null;
}

// ── Exported push functions — called from cron.ts ─────────────────────────────

interface WindowInfo {
  chatId:   string;
  uid:      string;
  dt:       Date;
  score:    number;
  activity: string;
  horaLord: string;
}

export async function sendNotification(w: WindowInfo): Promise<void> {
  if (!bot) return;
  const h     = w.dt.getUTCHours().toString().padStart(2, '0');
  const emoji = w.score >= 80 ? '🔥' : '⚡';

  const text =
    `${emoji} High-energy window starting!\n\n` +
    `🕐 ${h}:00 UTC — ${w.horaLord} hora\n` +
    `📊 Score: ${w.score}/100\n` +
    `🎯 Best for: ${w.activity}`;

  try {
    await bot.sendMessage(w.chatId, text);
  } catch (err) {
    console.error(`[telegram] failed to send notification to ${w.chatId}:`, err);
  }
}

export async function sendRatingPrompt(w: WindowInfo): Promise<void> {
  if (!bot) return;
  const h = w.dt.getUTCHours().toString().padStart(2, '0');
  const dtISO = w.dt.toISOString();

  const text =
    `⏰ How was your ${w.horaLord} hour (${h}:00 UTC)?\n\n` +
    `Score was ${w.score}/100 for ${w.activity}. Did it match your energy?`;

  try {
    await bot.sendMessage(w.chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🌟 Great',   callback_data: `rate:${w.uid}:${dtISO}:great`   },
          { text: '👍 Average', callback_data: `rate:${w.uid}:${dtISO}:average` },
          { text: '😴 Poor',    callback_data: `rate:${w.uid}:${dtISO}:poor`    },
        ]],
      },
    });
  } catch (err) {
    console.error(`[telegram] failed to send rating prompt to ${w.chatId}:`, err);
  }
}
