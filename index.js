import path, { dirname } from "path";
import { promises as fs } from "fs";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";

async function generateProjectSkeleton(projectName) {
  const projectPath = path.join(process.cwd(), projectName);

  try {
    await mkdir(projectPath);

    const appFilePath = path.join(projectPath, "app.js");
    const appContent = `
    import express from "express";
    import pug from "pug";
    import morgan from "morgan";
    import path, { dirname } from "path";
    import { fileURLToPath } from "url";
    import createHttpError from "http-errors";
    import cookieParser from "cookie-parser";
    import helmet from "helmet";
    import { rateLimit } from "express-rate-limit"
    
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = express();
    const port = process.env.PORT || 3001;
    
    import indexRouter from "./routes/index.js";
    
    //template-engine: pug see docs at https://pugjs.org
    app.set("view engine", pug);
    
    //middleware setup
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, "public")));
    app.use(cookieParser());
    app.use(helmet());
    
    // security limiting request just comment it if youre still in development
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 20
    });
    app.use(limiter)
    
    // Routes setup
    app.use("/", indexRouter);
    
    // Custom middleware for handling 404 errors
    app.use((req, res, next) => {
      next(createHttpError(404, "Not Found"));
    });
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      const status = err.status || 500;
      const message = err.message || "Internal Server Error";
      const err_msg = req.app.get("env")  === 'development' ? err : '';
      res.render("error.pug", { status: status, message: message, error: err_msg });
    });
    
    app.listen(port, () => {
      console.log(\`Application is running at port : \${port}\`);
    });
    `;

    await writeFile(appFilePath, appContent);

    const packageJson = {
      name: projectName,
      version: "1.0.0",
      main: "app.js",
      type: "module",
      scripts: {
        start: "node app.js",
      },
      dependencies: {
        "cookie-parser": "^1.4.6",
        express: "^4.19.2",
        "express-rate-limit": "^7.2.0",
        helmet: "^7.1.0",
        "http-errors": "^2.0.0",
        morgan: "^1.10.0",
        pug: "^3.0.2",
      },
    };

    const packageJsonFilePath = path.join(projectPath, "package.json");
    await writeFile(packageJsonFilePath, JSON.stringify(packageJson, null, 2));

    const foldersToCreate = [
      "routes",
      "views",
      "public",
      "public/images",
      "public/scripts",
      "public/styles",
    ];

    for (const folder of foldersToCreate) {
      const folderPath = path.join(projectPath, folder);
      await fs.mkdir(folderPath);
    }

    const routesPath = path.join(projectPath, "routes", "index.js");
    const routesContent = `
      import express from 'express'
      const router = express.Router()

      /* GET home page. */
      router.get('/', (req, res) => {
      res.render('index.pug', { title: 'Hey', message: 'Hello there!' })
      });

      export default router;
    `;

    await writeFile(routesPath, routesContent);

    const viewIndexPath = path.join(projectPath, "views", "index.pug");
    const viewIndexContent = `
        doctype html
        html(lang="en")
        head
            meta(charset="UTF-8")
            meta(name="viewport", content="width=device-width, initial-scale=1.0")
            title= title
        body 
        h1= message
    `;

    await writeFile(viewIndexPath, viewIndexContent);

    const viewErrorPath = path.join(projectPath, "views", "error.pug");
    const viewErrorContent = `
        h1= status 
        p= message 
        hr
        if error
            p= error
    `;

    await writeFile(viewErrorPath, viewErrorContent);

    console.log(`Express project '${projectName}' generated successfully!`);
  } catch (err) {
    console.error("Error generating project:", err);
  }
}

export default generateProjectSkeleton;
