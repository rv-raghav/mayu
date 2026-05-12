module.exports = {
  apps: [{
    name: 'mayu-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: { NODE_ENV: 'production' },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 2000,
  }],
};
