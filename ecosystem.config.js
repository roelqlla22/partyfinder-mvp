module.exports = {
  apps: [
    {
      name: "partyfinder",
      cwd: "C:/Users/roeld/Downloads/partyfinder-mvp",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      windowsHide: true
    }
  ]
};
