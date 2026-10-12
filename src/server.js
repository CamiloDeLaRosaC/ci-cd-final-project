const { createApp } = require('./app');
const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
const server = createApp().listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ event: 'started', port, service: 'ci-cd-final-project' }));
});
function shutdown(signal) {
  console.log(JSON.stringify({ event: 'shutdown', signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
