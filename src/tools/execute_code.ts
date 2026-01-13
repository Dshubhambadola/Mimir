import { tool } from "@langchain/core/tools";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { z } from "zod";

const execAsync = util.promisify(exec);

const ExecuteCodeSchema = z.object({
  language: z.enum(["python", "javascript"]).describe("The programming language to execute."),
  code: z.string().describe("The code snippet to execute."),
});

export const execute_code = tool(
  async ({ language, code }) => {
    const tempDir = path.resolve(process.cwd(), "temp_execution");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileId = Date.now().toString();
    let fileName = "";
    let dockerImage = "";
    let runCommand = "";

    if (language === "python") {
      fileName = `script_${fileId}.py`;
      dockerImage = "python:3.9-slim";
      // Run with limited resources and timeout
      runCommand = `python /app/${fileName}`;
    } else if (language === "javascript") {
      fileName = `script_${fileId}.js`;
      dockerImage = "node:18-slim";
      runCommand = `node /app/${fileName}`;
    }

    const hostFilePath = path.join(tempDir, fileName);
    fs.writeFileSync(hostFilePath, code);

    // Docker command breakdown:
    // --rm: Remove container after exit
    // -v: Mount temp dir to /app
    // -w: Set working directory to /app
    // --network none: Disable network access for security
    const dockerCmd = `docker run --rm -v "${tempDir}:/app" -w /app --network none ${dockerImage} ${runCommand}`;

    try {
      console.log(`Executing ${language} code via Docker...`);
      const { stdout, stderr } = await execAsync(dockerCmd, { timeout: 10000 }); // 10s timeout

      // Cleanup
      fs.unlinkSync(hostFilePath);

      if (stderr) {
        return `Stderr: ${stderr}\nStdout: ${stdout}`;
      }
      return stdout.trim() || "Code executed successfully with no output.";
    } catch (error: any) {
      // Cleanup
      if (fs.existsSync(hostFilePath)) fs.unlinkSync(hostFilePath);

      return `Execution Error: ${error.message || error.toString()}. \nStderr: ${error.stderr || ""}`;
    }
  },
  {
    name: "execute_code",
    description: "Executes code in a sandboxed Docker container. Use this to run calculations, data processing, or test code snippets. Supported languages: python, javascript.",
    schema: ExecuteCodeSchema
  }
);
