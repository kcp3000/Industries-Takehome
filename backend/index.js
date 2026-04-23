import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

dotenv.config({
  path: path.join(currentDirectory, ".env"),
});

const [{ createApp }, { port }] = await Promise.all([
  import("./src/app.js"),
  import("./src/config.js"),
]);

const app = createApp();

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
