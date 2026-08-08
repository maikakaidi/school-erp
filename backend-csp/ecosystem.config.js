module.exports = {
  apps: [
    {
      name: 'api-school',
      script: 'src/server.js',
      instances: 'max',       // Utilise tous les CPU cores
      exec_mode: 'cluster',   // Mode cluster pour la scalabilité
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logs
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
