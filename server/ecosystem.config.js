module.exports = {
    apps: [
      {
        name: 'shukhee-auth-api', // Name of your application
        script: 'dist/main.js', // Path to your server file
        exec_mode: 'cluster', // Run in cluster mode
      },
    ],
  };
