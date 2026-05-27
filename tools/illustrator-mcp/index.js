import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execFileSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEMP = tmpdir();
const JSX_PATH = join(TEMP, "ai-mcp-script.jsx");
const PS1_PATH = join(TEMP, "ai-mcp-runner.ps1");
const RESULT_PATH = join(TEMP, "ai-mcp-result.json");

// Wraps user JSX in try/catch compatible with ExtendScript (no window, no JSON.stringify).
// Convention: call __done({ exportedPath: "..." }) at the end of your script.
// If you don't call __done(), the wrapper writes a default success/error result.
function wrapJsx(userScript) {
  return `
(function () {
  var __resultData = null;

  // Helper the user script calls to report result + optional exportedPath
  function __done(obj) {
    __resultData = obj || {};
    __resultData.success = true;
  }

  // Serialize a plain object to JSON without JSON.stringify (ExtendScript compat)
  function __toJson(obj) {
    var parts = [];
    for (var k in obj) {
      if (!obj.hasOwnProperty(k)) continue;
      var v = obj[k];
      var vs;
      if (typeof v === "string") {
        vs = '"' + v.replace(/\\\\/g, "\\\\\\\\").replace(/"/g, '\\\\"').replace(/\\n/g, "\\\\n") + '"';
      } else if (typeof v === "boolean" || typeof v === "number") {
        vs = String(v);
      } else {
        continue;
      }
      parts.push('"' + k + '":' + vs);
    }
    return "{" + parts.join(",") + "}";
  }

  function __writeFile(obj) {
    try {
      var f = File(Folder.temp + "/ai-mcp-result.json");
      f.encoding = "UTF-8";
      f.open("w");
      f.write(__toJson(obj));
      f.close();
    } catch (_err) {}
  }

  try {
    ${userScript}
    if (__resultData === null) __resultData = { success: true };
    __writeFile(__resultData);
  } catch (e) {
    __writeFile({ success: false, error: String(e) });
  }
})();
`.trim();
}

function runInIllustrator(jsxScript) {
  writeFileSync(JSX_PATH, wrapJsx(jsxScript), "utf-8");

  try { if (existsSync(RESULT_PATH)) unlinkSync(RESULT_PATH); } catch (_) {}

  // Try active instance first, fallback to launching Illustrator
  const jsxPathEscaped = JSX_PATH.replace(/\\/g, "\\\\");
  const ps1 = `
$ErrorActionPreference = "Stop"
try {
    $ai = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Illustrator.Application")
} catch {
    $ai = New-Object -ComObject "Illustrator.Application"
}
$ai.DoJavaScriptFile("${jsxPathEscaped}")
`;
  writeFileSync(PS1_PATH, ps1, "utf-8");

  execFileSync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy", "Bypass",
    "-File", PS1_PATH,
  ], { timeout: 60000, stdio: "pipe" });

  if (existsSync(RESULT_PATH)) {
    return JSON.parse(readFileSync(RESULT_PATH, "utf-8"));
  }
  return { success: true };
}

// ---------------------------------------------------------------------------

const server = new Server(
  { name: "illustrator-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "run_jsx",
      description: `Executes a JSX/ExtendScript in Adobe Illustrator via Windows COM automation.
Use this to create vector artwork, set up artboards, apply styles, and export assets.

EXPORT CONVENTION — at the end of your script, call:
  __done({ exportedPath: "C:/absolute/path/to/file.png" });
The server reads the exported PNG and returns it as an image. __done() is injected by the wrapper.
Do NOT use window.__mcpResult (window is not defined in ExtendScript).

DOCUMENT SETUP — always start scripts with:
  var doc = app.documents.length > 0 ? app.activeDocument : app.documents.add();
  doc.artboards[0].artboardRect = [0, 0, WIDTH, -HEIGHT];  // Illustrator uses negative Y

EXPORT AS PNG — use ExportOptionsPNG24:
  var opts = new ExportOptionsPNG24();
  opts.artBoardClipping = true;
  opts.horizontalScale = (TARGET_PX / DOC_PTS) * 100;
  opts.verticalScale   = (TARGET_PX / DOC_PTS) * 100;
  doc.exportFile(new File(outputPath), ExportType.PNG24, opts);`,
      inputSchema: {
        type: "object",
        properties: {
          script: {
            type: "string",
            description: "Complete JSX script to execute in Illustrator",
          },
        },
        required: ["script"],
      },
    },
    {
      name: "preview_file",
      description: "Reads a PNG/SVG from disk and returns it as base64 so Claude can see the generated asset. Use this to review a previously exported file.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute path to the PNG or SVG file",
          },
        },
        required: ["path"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // ── run_jsx ──────────────────────────────────────────────────────────────
  if (name === "run_jsx") {
    try {
      const result = runInIllustrator(args.script);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `Illustrator JSX error: ${result.error}` }],
          isError: true,
        };
      }

      const content = [];
      content.push({
        type: "text",
        text: result.exportedPath
          ? `OK — exported to: ${result.exportedPath}`
          : "OK — script executed successfully",
      });

      // If the script exported a PNG, attach it so Claude can see it
      if (result.exportedPath && existsSync(result.exportedPath)) {
        const data = readFileSync(result.exportedPath);
        content.push({
          type: "image",
          data: data.toString("base64"),
          mimeType: "image/png",
        });
      }

      return { content };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Execution error: ${err.message}` }],
        isError: true,
      };
    }
  }

  // ── preview_file ─────────────────────────────────────────────────────────
  if (name === "preview_file") {
    try {
      const data = readFileSync(args.path);
      return {
        content: [
          { type: "text", text: `File: ${args.path}` },
          { type: "image", data: data.toString("base64"), mimeType: "image/png" },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Cannot read file: ${err.message}` }],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
