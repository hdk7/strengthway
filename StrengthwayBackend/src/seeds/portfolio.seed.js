"use strict";

require("../config/env");
const { connectDB, disconnectDB } = require("../config/database");
const PortfolioItem = require("../modules/portfolio/portfolio.model");
const { SEED_PORTFOLIO } = require("./data/portfolio.seed");

/**
 * Seeds Portfolio Items into MongoDB Atlas.
 * Idempotent: upserts by item ID.
 */
async function seedPortfolio(options = {}) {
  const { drop = false, silent = false } = options;

  if (drop) {
    try {
      await PortfolioItem.collection.drop();
      if (!silent) console.log("[Seed:Portfolio] Collection dropped.");
    } catch (e) {
      // Ignore if collection doesn't exist
    }
  }

  let upserted = 0;
  for (const item of SEED_PORTFOLIO) {
    await PortfolioItem.findOneAndUpdate(
      { id: item.id },
      { $set: item },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    upserted++;
  }

  if (!silent) {
    console.log(`[Seed:Portfolio] ✓ ${upserted} portfolio items seeded/upserted.`);
  }

  return { total: SEED_PORTFOLIO.length, upserted };
}

// Standalone execution support: node src/seeds/portfolio.seed.js
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      const drop = process.argv.includes("--drop");
      await seedPortfolio({ drop });
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error("[Seed:Portfolio] ✗ Error:", err.message);
      process.exit(1);
    }
  })();
}

module.exports = seedPortfolio;
