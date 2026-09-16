const path = require("path");
const fs = require("fs");

const supabasePackagePath = path.join(
  __dirname,
  "..",
  "..",
  "backend",
  "node_modules",
  "@supabase",
  "supabase-js"
);

const { createClient } = require(supabasePackagePath);

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed
      .slice(0, separator)
      .trim();

    let value = trimmed
      .slice(separator + 1)
      .trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const backendEnvPath = path.join(
  __dirname,
  "..",
  "..",
  "backend",
  ".env"
);

if (!fs.existsSync(backendEnvPath)) {
  throw new Error(
    `Backend .env file not found: ${backendEnvPath}`
  );
}

loadEnvFile(backendEnvPath);

const supabaseUrl =
  process.env.SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

if (
  !supabaseUrl ||
  !supabaseSecretKey
) {
  throw new Error(
    "SUPABASE_URL or SUPABASE_SECRET_KEY is missing from backend/.env"
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);

async function main() {
  console.log(
    "Fetching recommendation events from Supabase..."
  );

  const { data, error } =
    await supabase
      .from("recommendation_events")
      .select(
        [
          "user_id",
          "recommendation_type",
          "recommendation_action",
          "recommendation",
          "reason",
          "generated_at",
          "accepted",
          "completed",
          "difficulty_feedback",
          "user_feedback",
          "outcome_score",
          "context_snapshot",
          "outcome_recorded_at"
        ].join(",")
      )
      .order("generated_at", {
        ascending: true
      });

  if (error) {
    throw new Error(
      `Supabase query failed: ${error.message}`
    );
  }

  const outputPath =
    path.join(
      __dirname,
      "recommendation_events.json"
    );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      data || [],
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `Exported ${
      data ? data.length : 0
    } recommendation events.`
  );

  console.log(
    `Saved: ${outputPath}`
  );
}

main().catch((error) => {
  console.error(
    "Export failed:"
  );

  console.error(
    error.message
  );

  process.exit(1);
});