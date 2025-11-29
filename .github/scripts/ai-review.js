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
  maxLineLength: 80, // Hard limit handled by JS
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

function parseDiff(diff) {
  const lines = diff.split('\n');
  let currentFile = '';
  let currentLine = 0;
  let parsedLines = [];

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      const parts = line.split(' ');
      const bPath = parts.find(p => p.startsWith('b/'));
      if (bPath) currentFile = bPath.substring(2);
      continue;
    }

    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)/);
      if (match) currentLine = parseInt(match[1], 10);
      continue;
    }

    if (currentFile) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.substring(1);
        parsedLines.push({
          file: currentFile,
          line: currentLine,
          content: content
        });
        currentLine++;
      } else if (line.startsWith(' ') && !line.startsWith('+++')) {
        currentLine++;
      }
    }
  }
  return parsedLines;
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

function createPrompt(rules, numberedDiffString) {
  return `
    You are a strict Senior Angular Code Reviewer.
    
    ### CODING GUIDELINES:
    ${rules}

    ### ACCURACY INSTRUCTIONS:
    The code provided below is in the format: \`FILE:LINE:CONTENT\`.
    1. **Line Numbers:** You MUST return the exact line number provided in the line prefix.
    2. **Line Length:** IGNORE line length violations. The system checks this automatically.
    
    ### HALLUCINATION PREVENTION (CRITICAL):
    - **Inferred Types:** Do NOT flag missing types for arrow function parameters in callbacks (e.g. \`.subscribe(data => ...)\` is OK).
        Only flag missing types in explicit function declarations.
    - **Nested Subscriptions:** Only flag \`.subscribe\` if you clearly see it *inside* another \`.subscribe\` block.
    
    ### OUTPUT RULES:
    - **No Tags:** Escape all Angular keywords (use \`@if\`, not @if).
    - **Snippet:** Copy the code content exactly into the snippet field.

    ### TASK:
    Review the code lines below. Return a JSON object.
    - If violations found -> "conclusion": "COMMENT".
    - If code is good -> "conclusion": "APPROVE".

    CODE TO REVIEW:
    ${numberedDiffString.slice(0, CONFIG.diffLimit)} 
  `;
}

async function postReview(octokit, context, reviewData, automaticComments) {
  let allComments = [...automaticComments];

  if (reviewData.reviews && reviewData.reviews.length > 0) {
    const aiComments = reviewData.reviews
      .filter((r) => r.line > 0)
      .map((r) => {
        // Escape special characters to prevent GitHub markdown issues
        let safeComment = r.comment.replace(/(@(if|for|switch|let|case|default|else|empty))/g, '`$1`');
        return {
          path: r.path,
          line: r.line,
          body: `🤖 **AI Review:** ${safeComment}\n\n\`\`\`typescript\n${r.snippet}\n\`\`\``,
        };
      });
    allComments = allComments.concat(aiComments);
  }

  if (allComments.length > 0) {
    await octokit.rest.pulls.createReview({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number,
      event: "COMMENT", 
      comments: allComments,
      body: "⚠️ **AI Code Analysis:** I found some potential issues for you to review.",
    });
    return "FOUND_ISSUES";
  }
  return "APPROVE";
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

    const parsedLines = parseDiff(prDiff);
    const automaticComments = [];
    const numberedDiffLines = [];

    for (const lineObj of parsedLines) {
      const isIgnorable = /^\s*(\/\/|\/\*|\*|import )/.test(lineObj.content);
      
      // Check for line length violations
      if (!isIgnorable && lineObj.content.length > CONFIG.maxLineLength) {
        automaticComments.push({
          path: lineObj.file,
          line: lineObj.line,
          body: `📏 **Style Violation:** Line exceeds ${CONFIG.maxLineLength} characters 
                (Current: ${lineObj.content.length}). Please break this line.`
        });
      }
      
      numberedDiffLines.push(`${lineObj.file}:${lineObj.line}:${lineObj.content}`);
    }

    const rules = loadCodingGuidelines();
    const prompt = createPrompt(rules, numberedDiffLines.join('\n'));

    console.log(`Sending content to ${CONFIG.modelName}...`);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let reviewData;
    try {
      reviewData = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON Parse Error:", responseText);
      return; 
    }

    // Post the review (comments only)
    const finalStatus = await postReview(octokit, context, reviewData, automaticComments);

    if (finalStatus === "FOUND_ISSUES") {
      core.warning("⚠️ AI found potential violations. Please review the comments.");
    } else {
      console.log("No issues found.");
    }
  } catch (error) {
    core.setFailed(`Review failed: ${error.message}`);
  }
}

run();