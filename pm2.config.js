module.exports = {
  apps: [
    {
      name: 'tools-backend',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ignore_watch: ['node_modules', 'dist'],
      max_memory_restart: '500M',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Auto-restart se falhar
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
