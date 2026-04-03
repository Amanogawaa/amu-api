import app from "./app";

async function startServer() {
  try {
    await app.start();
  } catch (error) {
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  app.server?.close(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  app.server?.close(() => {
    process.exit(0);
  });
});

startServer();
