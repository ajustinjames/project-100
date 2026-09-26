import { fileURLToPath } from "node:url";
import { project100Site } from "@project-100/web/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    project100Site({
      repoRoot: fileURLToPath(new URL("..", import.meta.url)),
      pages: {
        "index.html": {
          title: "Project 100",
          description:
            "A growing collection of small, useful web apps. The goal: 100 live and maintained at the same time.",
          indexable: true,
        },
        "labs/index.html": {
          title: "Labs · Project 100",
          description: "Experimental Project 100 prototypes that have not launched.",
          indexable: false,
        },
        "404.html": {
          title: "Not found · Project 100",
          description: "This page does not exist.",
          indexable: false,
        },
      },
    }),
  ],
});
