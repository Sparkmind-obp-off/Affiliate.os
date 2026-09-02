// PM2 configuration — LOCAL SANDBOX VERIFICATION ONLY.
// Production deployment goes through Cloudflare Pages via Git integration.
module.exports = {
  apps: [
    {
      name: 'affiliate-os',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
  ],
}
