#!/usr/bin/env node
/**
 * Mobile is the shipping app. Ensures mobile/package.json pins react and react-dom
 * to the same version (Expo + Expo web localhost share one React — avoids invalid hook
 * calls and blank screens from duplicate React).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const mobile = JSON.parse(readFileSync(join(root, "mobile/package.json"), "utf8"));
const react = mobile.dependencies?.react;
const reactDom = mobile.dependencies?.["react-dom"];

if (!react || !reactDom) {
  console.error("mobile/package.json must declare dependencies.react and dependencies['react-dom'].");
  process.exit(1);
}

if (react !== reactDom) {
  console.error(
    `mobile/package.json: react ("${react}") and react-dom ("${reactDom}") must match exactly.`
  );
  process.exit(1);
}

console.log(`OK: mobile pins react and react-dom to ${react}.`);
