/**
 * PM2 Ecosystem Config — Timeceptor
 * Usage:
 *   npm run build
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save && pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'timeceptor',
      script: 'server/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx/esm',
      instances: 1,          // single-core VM — 1 instance is optimal
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '400M',

      env: {
        NODE_ENV: 'development',
        PORT: 47000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 47000,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,

      // Auto-restart on crash
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
