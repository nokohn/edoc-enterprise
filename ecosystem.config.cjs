module.exports = {
  apps: [
    {
      name: 'edoc-app',
      cwd: __dirname,
      script: 'server/dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      restart_delay: 3000,
      autorestart: true,
      max_restarts: 50,
    },
    {
      name: 'edoc-tunnel',
      cwd: __dirname,
      script: 'tools/tunnel-runner.js',
      restart_delay: 5000,
      autorestart: true,
      max_restarts: 50,
    }
  ]
};
