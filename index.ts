import { readFileSync, writeFileSync } from "fs";
import { exec } from "child_process";
import { dirname, join } from "path";

// Note: A lot of this was written by Claude

function extractFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter: Record<string, string> = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length) {
      const value = valueParts.join(":").trim();
      frontmatter[key.trim().toLowerCase()] = value;
    }
  }

  return frontmatter;
}

function removeFrontmatter(content: string) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, "");
}

function toFilePathFriendly(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

async function convertToEpub(inputFile: string) {
  const content = readFileSync(inputFile, "utf8");
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    console.error("Frontmatter is missing");
    process.exit(1);
  }
  const { title, author } = frontmatter;

  if (!title) {
    console.error("Title is missing in the frontmatter");
    process.exit(1);
  }

  const outputFileName = `${toFilePathFriendly(title)}.epub`;
  const outputFile = join(dirname(inputFile), outputFileName);

  const markdownContent = removeFrontmatter(content);

  const tempFile = join(dirname(inputFile), "temp.md");
  writeFileSync(tempFile, markdownContent);

  const pandocCommand = `pandoc -s "${tempFile}" -o "${outputFile}" -f markdown -t epub --metadata title="${title}" ${
    author ? `--metadata author="${author}"` : ""
  }`;

  exec(pandocCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`ePub file created successfully: ${outputFile}`);
  });
}

const inputFile = process.argv[2];
if (!inputFile) {
  console.error(
    "Please provide an input file path as a command-line argument."
  );
  process.exit(1);
}
convertToEpub(inputFile);
