// PM2 Ecosystem Config cho server nhỏ: 2 CPU / 4GB RAM
// Sử dụng: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      // Load production environment variables từ .env.production
      env_file: ".env.production",
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=2048 --max-semi-space-size=128",
        PORT: 3000,
      },
      max_memory_restart: "2G",
      watch: false,
      ignore_watch: ["node_modules", ".next", "logs"],
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
    },
  ],
};
