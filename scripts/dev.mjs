// `yarn dev` / `npm run dev`: prepara o ambiente local e sobe o servidor.
//   1. cria o .env.local (com JWT_SECRET gerado) se não existir;
//   2. sobe o MongoDB local via Docker (quando MONGODB_URI aponta para localhost);
//   3. inicia o vinext dev.
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";

const ENV_FILE = ".env.local";
const DEFAULT_URI = "mongodb://127.0.0.1:27018/resolvehub";
const log = (msg) => console.log(`\x1b[36m[dev]\x1b[0m ${msg}`);

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
}

function ensureEnvFile() {
  if (existsSync(ENV_FILE)) return;
  writeFileSync(ENV_FILE, `MONGODB_URI=${DEFAULT_URI}\nJWT_SECRET=${randomBytes(48).toString("base64")}\n`);
  log(`${ENV_FILE} criado com um JWT_SECRET novo.`);
}

function canConnect(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout });
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });
}

async function ensureMongo() {
  const uri = process.env.MONGODB_URI ?? parseEnvFile(ENV_FILE).MONGODB_URI ?? DEFAULT_URI;
  const { hostname, port } = new URL(uri);
  const isLocal = ["127.0.0.1", "localhost"].includes(hostname);

  if (await canConnect(hostname, Number(port || 27018))) {
    log(`MongoDB já está acessível em ${hostname}:${port || 27018}.`);
    return;
  }
  if (!isLocal) {
    console.error(`[dev] Não foi possível conectar ao MongoDB em ${hostname}. Verifique MONGODB_URI.`);
    process.exit(1);
  }

  log("Subindo o MongoDB com Docker...");
  const result = spawnSync("docker", ["compose", "up", "-d", "--wait", "mongo"], { stdio: "inherit" });
  if (result.error || result.status !== 0) {
    console.error(
      "[dev] Não foi possível subir o MongoDB. Abra o Docker Desktop (ou instale o Docker) " +
        "ou aponte MONGODB_URI para um MongoDB já em execução.",
    );
    process.exit(1);
  }
  log("MongoDB pronto.");
}

ensureEnvFile();
await ensureMongo();

log("Iniciando o servidor de desenvolvimento...");
const child = spawn("npx", ["vinext", "dev", ...process.argv.slice(2)], { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
