const fs = require("node:fs");
const path = require("node:path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "SpendingCharter.sol",
  "SpendingCharter.json"
);
const abiPath = path.join(__dirname, "..", "shared", "abi", "SpendingCharter.json");

if (!fs.existsSync(artifactPath)) {
  throw new Error("SpendingCharter artifact not found; compile contracts before exporting ABIs");
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.mkdirSync(path.dirname(abiPath), { recursive: true });
fs.writeFileSync(abiPath, `${JSON.stringify(artifact.abi, null, 2)}\n`, "utf8");