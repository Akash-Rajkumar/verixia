const fs = require("node:fs");
const path = require("node:path");

const contractsToExport = ["SpendingCharter", "ReasoningReceipts"];

for (const contractName of contractsToExport) {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    `${contractName}.sol`,
    `${contractName}.json`
  );
  const abiPath = path.join(__dirname, "..", "shared", "abi", `${contractName}.json`);

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`${contractName} artifact not found; compile contracts before exporting ABIs`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.mkdirSync(path.dirname(abiPath), { recursive: true });
  fs.writeFileSync(abiPath, `${JSON.stringify(artifact.abi, null, 2)}\n`, "utf8");
}