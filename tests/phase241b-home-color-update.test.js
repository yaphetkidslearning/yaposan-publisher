const fs = require("fs");
const assert = require("assert");
const source = fs.readFileSync("src/app/index.tsx", "utf8");
assert(source.includes("headingCreate"));
assert(source.includes("headingToday"));
assert(source.includes("Search anything..."));
assert(source.includes("headerNotificationBadge"));
assert(source.includes("#050b16"));
console.log("Phase 24.1B home color verification passed");
