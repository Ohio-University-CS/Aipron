// Back-compat: seeds the full public catalog (idempotent by title).
import { runSeedCatalog } from "./seedCatalog.js";

runSeedCatalog().catch((err) => {
  console.error(err);
  process.exit(1);
});
