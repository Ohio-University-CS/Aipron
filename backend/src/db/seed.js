import { runSeedCatalog } from "./seedCatalog.js";

runSeedCatalog().catch((err) => {
  console.error(err);
  process.exit(1);
});
