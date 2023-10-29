const { exec } = require("child_process");
const path = require("path");

async function execShell(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve({
        error,
        stdout,
        stderr,
      });
    });
  });
}
async function buildContract() {
  await execShell(
    `cd .. && cd contracts && yarn install && yarn build && cd .. && cd ui `
  );
}

async function copyContractFile() {
  const sourceFile = path.resolve(
    __dirname,
    "../../contracts/build/src/Add.js"
  );
  const targetFolder = path.resolve(__dirname, "../src/contracts/");
  await execShell(`cp -r ${sourceFile} ${targetFolder}`);
}

async function copyContractSourceFile() {
  const sourceFile = path.resolve(__dirname, "../../contracts/src/Add.ts");
  const targetFolder = path.resolve(__dirname, "../src/contracts/source");
  await execShell(`cp -r ${sourceFile} ${targetFolder}`);
}
(async () => {
  await buildContract();
  await copyContractFile();
  await copyContractSourceFile();
})();
