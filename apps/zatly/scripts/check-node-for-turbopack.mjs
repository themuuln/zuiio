const [majorStr, minorStr] = process.versions.node.split(".");
const major = Number(majorStr);
const minor = Number(minorStr);

const isSupportedRange = major > 20 || (major === 20 && minor >= 9);
const isEvenMajor = major % 2 === 0;
const isTooNew = major >= 25;

if (!isSupportedRange || !isEvenMajor || isTooNew) {
  console.error(
    [
      "Turbopack stability check failed for this project.",
      `Current Node.js: ${process.versions.node}`,
      "Use an LTS even-major Node version for Next.js dev (recommended: 22.x).",
      "Quick fix:",
      "  nvm install 22 && nvm use 22",
    ].join("\n"),
  );
  process.exit(1);
}

