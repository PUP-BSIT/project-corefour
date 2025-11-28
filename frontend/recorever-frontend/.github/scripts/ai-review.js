const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const github = require("@actions/github");
const core = require("@actions/core");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  modelName: "gemini-2.5-flash",
  files: {
    codingStandards: "Coding Guidelines/CODING_STANDARDS.md",
    copilotInstructions: "copilot-instructions.md",
  },
  diffLimit: 40000,
};

function initializeAI(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: CONFIG.modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          reviews: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                path: { type: SchemaType.STRING },
                line: { type: SchemaType.NUMBER },
                comment: { type: SchemaType.STRING },
                snippet: { type: SchemaType.STRING },
              },
              required: ["path", "line", "comment", "snippet"],
            },
          },
          conclusion: {
            type: SchemaType.STRING,
            enum: ["APPROVE", "REQUEST_CHANGES", "COMMENT"],
          },
        },
        required: ["reviews", "conclusion"],
      },
    },
  });
}

async function getPullRequestDiff(octokit, context) {
  const { data: prDiff } = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number,
    mediaType: { format: "diff" },
  });
  return prDiff;
}

// Manually parse the diff to get accurate line numbers
// This prevents the AI from "guessing" and getting it wrong
function parseDiffAndAddLineNumbers(diff) {
  const lines = diff.split('\n');
  let currentFile = '';
  let currentLine = 0;
  let numberedContent = [];

  for (const line of lines) {
    // Detect file header (e.g., "diff --git a/src/app.ts b/src/app.ts")
    if (line.startsWith('diff --git')) {
      const parts = line.split(' ');
      const bPath = parts.find(p => p.startsWith('b/'));
      if (bPath) {
        currentFile = bPath.substring(2);
      }
      continue;
    }

    // Detect chunk header (e.g., "@@ -10,5 +20,5 @@")
    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)/);
      if (match) {
        currentLine = parseInt(match[1], 10);
      }
      continue;
    }

    // Process Content Lines
    if (currentFile) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        numberedContent.push(`${currentFile}:${currentLine}: ${line.substring(1)}`);
        currentLine++;
      } else if (line.startsWith(' ')) {
        numberedContent.push(`${currentFile}:${currentLine}: ${line.substring(1)}`);
        currentLine++;
      } else if (line.startsWith('-')) {
      }
    }
  }
  return numberedContent.join('\n');
}

function loadCodingGuidelines() {
  const workspace = process.env.GITHUB_WORKSPACE || ".";
  const standardsPath = path.join(workspace, ".github", CONFIG.files.codingStandards);
  const fallbackPath = path.join(workspace, ".github", CONFIG.files.copilotInstructions);

  if (fs.existsSync(standardsPath)) {
    return fs.readFileSync(standardsPath, "utf8");
  } else if (fs.existsSync(fallbackPath)) {
    return fs.readFileSync(fallbackPath, "utf8");
  }
  return "";
}

function createPrompt(rules, numberedDiff) {
  return `
    You are a strict Senior Angular Code Reviewer.
    
    ### CODING GUIDELINES:
    ${rules}

    ### ACCURACY INSTRUCTIONS (CRITICAL):
    The code below is pre-processed. Each line starts with \`filepath:lineNumber: code\`.
    1. **Line Numbers:** You MUST use the exact line number provided in the prefix (e.g. for \`src/app.ts:42: code\`, the line is 42).
    2. **Line Length:** When checking the 80-char limit, DO NOT count the prefix \`filepath:lineNumber: \`. Only count the code part.
    3. **Hallucination Prevention:**
       - **Nested Subscriptions:** Only flag \`.subscribe\` if it is *inside* the callback of another \`.subscribe\`. Flag the INNER one.
       - **Types:** \`data: any\` is "Forbidden any". \`data\` (no type) is "Missing type".

    ### ADDITIONAL CHECKS:
    - **FORBIDDEN:** 'any', 'ngStyle', '*ngIf', '*ngFor'.
    - **REQUIRED:** signals, @if, @for, typed interfaces.

    ### CRITICAL:
    - **NO TAGS:** Escape all Angular keywords (e.g. use \`@if\`, not @if) to prevent tagging users.

    ### TASK:
    Review the code below. Return a JSON object.
    - If violations found -> "conclusion": "REQUEST_CHANGES".
    - If code is good -> "conclusion": "APPROVE".

    CODE TO REVIEW:
    ${numberedDiff.slice(0, CONFIG.diffLimit)} 
  `;
}

async function postReview(octokit, context, reviewData) {
  if (!reviewData.reviews || reviewData.reviews.length === 0) return;

  const validComments = reviewData.reviews
    .filter((r) => r.line > 0)
    .map((r) => {
      // Clean up comments to prevent tagging
      let safeComment = r.comment.replace(/(@(if|for|switch|let|case|default|else|empty))/g, '`$1`');
      
      return {
        path: r.path,
        line: r.line,
        body: `🤖 **AI Review:** ${safeComment}\n\n\`\`\`typescript\n${r.snippet}\n\`\`\``,
      };
    });

  if (validComments.length > 0) {
    await octokit.rest.pulls.createReview({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number,
      event: reviewData.conclusion,
      comments: validComments,
      body:
        reviewData.conclusion === "APPROVE"
          ? "✅ Code looks good."
          : "⚠️ **Violations found.** Please fix the issues below.",
    });
  }
}

async function run() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!apiKey || !githubToken) {
      core.setFailed("Missing GEMINI_API_KEY or GITHUB_TOKEN secrets.");
      return;
    }

    const model = initializeAI(apiKey);
    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    const prDiff = await getPullRequestDiff(octokit, context);
    if (!prDiff) {
      console.log("No changes found in this PR.");
      return;
    }

    // Parse the diff to add explicit line numbers for the AI
    const numberedDiff = parseDiffAndAddLineNumbers(prDiff);
    const rules = loadCodingGuidelines();
    const prompt = createPrompt(rules, numberedDiff);

    console.log(`Sending diff to ${CONFIG.modelName}...`);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let reviewData;
    try {
      reviewData = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON Parse Error:", responseText);
      return;
    }

    await postReview(octokit, context, reviewData);

    if (reviewData.conclusion === "REQUEST_CHANGES") {
      core.setFailed(
        "❌ Blocking Merge: Violations of Coding Guidelines found. Please fix the issues commented by the AI."
      );
    } else {
      console.log("No issues found.");
    }
  } catch (error) {
    core.setFailed(`Review failed: ${error.message}`);
  }
}

run();