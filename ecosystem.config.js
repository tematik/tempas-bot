module.exports = {
  apps : [{
    name: 'browser-default',
    script: 'lib/index.js',
    watch: ['lib'],
    args: 'browser:start --browser 1',
    // exec_mode: 'cluster',
    max_memory_restart: '1500M',
  }],
};
