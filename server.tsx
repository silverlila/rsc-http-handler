import fs from "fs";
import path from "path";
import http from "http";
import { renderToPipeableStream } from "react-dom/server";
import Layout from "./www/layout.js";

const COMPONENTS_DIR = path.resolve("./dist/www");

async function loadComponents() {
  const files = fs.readdirSync(COMPONENTS_DIR);

  const components = {} as Record<string, any>;
  for (const file of files) {
    if (/^[A-Z]/.test(file) && file.endsWith(".js")) {
      const componentName = path.basename(file, ".js").toLowerCase();
      components[`/${componentName}`] = path.join(COMPONENTS_DIR, file);
    }
  }
  return components;
}

async function getComponent(route: string, components: Record<string, string>) {
  const modulePath = components[route];
  if (!modulePath) return null;

  const module = await import(modulePath);
  return module.default || null;
}

(async () => {
  const routes = await loadComponents();

  http
    .createServer(async (req, res) => {
      const Component = await getComponent(
        req.url === "/" ? "/home" : (req.url as string),
        routes
      );

      if (Component) {
        try {
          const { pipe } = renderToPipeableStream(
            <Layout>
              <Component />
            </Layout>,
            {
              bootstrapScripts: ["/main.js"],
              onShellReady() {
                if (!res.headersSent) {
                  res.setHeader("Content-Type", "text/html");
                }
                pipe(res);
              },
              onError(err) {
                console.error("Rendering error:", err);
                if (!res.headersSent) {
                  res.writeHead(500, { "Content-Type": "text/plain" });
                  res.end("Internal Server Error");
                }
              },
            }
          );
        } catch (err) {
          console.error("Unexpected error:", err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
          }
        }
      } else {
        if (!res.headersSent) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        }
      }
    })
    .listen(3000, () => console.log("Server running on http://localhost:3000"));
})();
