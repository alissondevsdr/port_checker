module.exports = {
  apps: [
    // BACKEND
    {
      name: "tools-backend",
      cwd: "./backend",
      script: "dist/server.js",
      windowsHide: true,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
    },

    // FRONTEND
    {
      name: "tools-frontend",
      cwd: "./frontend",
      script: ".\\node_modules\\serve\\build\\main.js",
      args: "-s dist -l 5173",
      interpreter: "node",
      windowsHide: true,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "200M",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
