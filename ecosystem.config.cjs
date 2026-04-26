module.exports = {
  apps: [{
    name: 'ghxsty-music',
    script: 'npm',
    args: 'start',
    cwd: 'C:\\ghxsty-music',
    watch: false,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8787
    }
  }]
};