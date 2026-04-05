/**
 * server/cron.ts — Scheduled jobs using node-cron
 *
 * Jobs:
 *  1. Every 15 min — send upcoming high-score window alerts (Telegram / email)
 *  2. Every 30 min — send rating prompts 90 min after a high-score window ends
 *  3. Daily 02:00 UTC — top up transit_positions 90 days ahead
 *
 * Imported and started in server/index.ts after the server is listening.
 */

import cron from 'node-cron';
import pool from './db/pool.js';
import { CronLog } from './db.js';
import { ensureTransitsCurrent } from './jobs/transits.js';
import { sendNotification, sendRatingPrompt, isBotActive } from './telegram.js';
import { sendPushToUser } from './routes/push.js';

// ─────────────────────────────────────────────────────────────────────────────
// JOB 1 — Upcoming window alerts (every 15 min)
// Finds user_scores in the next 30 minutes with score ≥ 75 and sends a push.
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule('*/15 * * * *', async () => {
  try {
    // Query all users with upcoming high-score windows (not just Telegram users)
    const { rows } = await pool.query(`
      SELECT u.uid, u.telegram_chat_id, u.email,
             s.dt, s.score, s.activity, s.hora_lord
      FROM user_scores s
      JOIN users u ON u.uid = s.uid
      WHERE s.dt BETWEEN NOW() AND NOW() + INTERVAL '30 minutes'
        AND s.score >= 75
      ORDER BY s.dt ASC
    `);

    let telegramCount = 0;
    let pushCount = 0;

    for (const row of rows) {
      const dt = new Date(row.dt);
      const hour = dt.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;

      // Send Telegram if linked and bot active
      if (row.telegram_chat_id && isBotActive()) {
        await sendNotification({
          chatId:   row.telegram_chat_id,
          uid:      row.uid,
          dt,
          score:    row.score,
          activity: row.activity,
          horaLord: row.hora_lord,
        });
        telegramCount++;
      }

      // Send Web Push notification
      try {
        await sendPushToUser(row.uid, {
          title: `⏰ Peak Window at ${h12}:00 ${ampm}`,
          body: `Score ${row.score}/100 · ${row.hora_lord} hora · Best for ${row.activity}`,
          tag: `window-${row.uid}-${row.dt}`,
          url: '/dashboard',
        });
        pushCount++;
      } catch (_) { /* user may not have push subscriptions */ }
    }

    if (telegramCount + pushCount > 0) {
      await CronLog.record('upcoming_alerts', 'ok', `tg:${telegramCount} push:${pushCount}`);
    }
  } catch (err) {
    console.error('[cron] upcoming_alerts error:', err);
    await CronLog.record('upcoming_alerts', 'error', String(err)).catch(() => {});
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// JOB 2 — Rating prompts (every 30 min)
// 90 minutes after a high-score window ended, ask user to rate the session.
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule('*/30 * * * *', async () => {
  try {
    const { rows } = await pool.query(`
      SELECT u.telegram_chat_id, s.uid, s.dt, s.score, s.hora_lord, s.activity
      FROM user_scores s
      JOIN users u ON u.uid = s.uid
      WHERE s.dt BETWEEN NOW() - INTERVAL '120 minutes' AND NOW() - INTERVAL '90 minutes'
        AND s.score >= 75
      ORDER BY s.dt ASC
    `);

    let count = 0;

    for (const row of rows) {
      // Telegram rating prompt
      if (row.telegram_chat_id && isBotActive()) {
        await sendRatingPrompt({
          chatId:   row.telegram_chat_id,
          uid:      row.uid,
          dt:       new Date(row.dt),
          score:    row.score,
          activity: row.activity,
          horaLord: row.hora_lord,
        });
        count++;
      }

      // Web Push rating prompt
      try {
        await sendPushToUser(row.uid, {
          title: '⭐ How was your window?',
          body: `Rate your ${row.activity} session (${row.hora_lord} hora, score ${row.score})`,
          tag: `rate-${row.uid}-${row.dt}`,
          url: '/dashboard',
        });
      } catch (_) { /* no push sub */ }
    }

    if (rows.length > 0) {
      await CronLog.record('rating_prompts', 'ok', `sent ${rows.length} prompts`);
    }
  } catch (err) {
    console.error('[cron] rating_prompts error:', err);
    await CronLog.record('rating_prompts', 'error', String(err)).catch(() => {});
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// JOB 3 — Transit top-up (daily 02:00 UTC)
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule('0 2 * * *', async () => {
  try {
    await ensureTransitsCurrent(90);
    await CronLog.record('transit_topup', 'ok');
    console.log('[cron] transit top-up complete');
  } catch (err) {
    console.error('[cron] transit_topup error:', err);
    await CronLog.record('transit_topup', 'error', String(err)).catch(() => {});
  }
});

console.log('[cron] 3 jobs registered (15-min alerts, 30-min ratings, daily transits)');
