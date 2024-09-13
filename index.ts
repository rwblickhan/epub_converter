import { readFileSync, writeFileSync } from "fs";
import { exec } from "child_process";
import { parse } from "yaml";
import { basename, dirname, join } from "path";

// Function to extract YAML frontmatter
function extractFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? parse(match[1]) : {};
}

// Function to remove YAML frontmatter from content
function removeFrontmatter(content: string) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, "");
}

// Function to create a file path-friendly string
function toFilePathFriendly(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

// Main function to convert Markdown to ePub
async function convertToEpub(inputFile: string) {
  // Read the input file
  const content = readFileSync(inputFile, "utf8");

  // Extract frontmatter
  const frontmatter = extractFrontmatter(content);
  console.log(JSON.stringify(frontmatter));
  const { Title: title, Author: author } = frontmatter;

  if (!title) {
    console.error("Title is missing in the frontmatter");
    process.exit(1);
  }

  // Create output file name based on the title
  const outputFileName = `${toFilePathFriendly(title)}.epub`;
  const outputFile = join(dirname(inputFile), outputFileName);

  // Remove frontmatter from content
  const markdownContent = removeFrontmatter(content);

  // Write the modified content to a temporary file
  const tempFile = join(dirname(inputFile), "temp.md");
  writeFileSync(tempFile, markdownContent);

  // Construct the pandoc command
  const pandocCommand = `pandoc "${tempFile}" -o "${outputFile}" -f markdown -t epub --metadata title="${title}" ${
    author ? `--metadata author="${author}"` : ""
  }`;

  // Execute pandoc command
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

// Get input file from command line arguments
const inputFile = process.argv[2];

if (!inputFile) {
  console.error(
    "Please provide an input file path as a command-line argument."
  );
  process.exit(1);
}

// Run the conversion
convertToEpub(inputFile);
