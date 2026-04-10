import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { createRequestAdapter } from './requestAdapter.js';
import { sendWebResponse } from './responseSender.js';

const backendRoot = process.cwd();
const apiRoot = path.join(backendRoot, 'routes');
const localLibRoot = path.join(backendRoot, 'lib');
const generatedRoot = path.join(backendRoot, '.cache', 'routes');

const methodNames = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

const toFileUrl = (filePath) => pathToFileURL(filePath).href;

// Build replacement map with relative paths for cross-platform compatibility
const buildReplacementMap = (generatedFilePath) => {
  const relativePath = path.relative(path.dirname(generatedFilePath), localLibRoot).replace(/\\/g, '/');
  const baseImport = relativePath ? `${relativePath}/` : './';

  return new Map([
    ['next/server', `${baseImport}nextResponse.js`],
    ['@/lib/database', `${baseImport}database.js`],
    ['@/lib/auth', `${baseImport}auth.js`],
    ['@/lib/cloudStorage', `${baseImport}cloudStorage.js`],
    ['@/lib/programsData', `${baseImport}programsData.js`],
    ['@/lib/models/User.js', `${baseImport}models/User.js`],
    ['@/lib/models/Activity.js', `${baseImport}models/Activity.js`],
  ]);
};

const rewriteSource = (source, replacementMap) => {
  return source.replace(/from\s+['"]([^'"]+)['"]/g, (match, specifier) => {
    const replacement = replacementMap.get(specifier);
    if (!replacement) {
      return match;
    }

    return `from '${replacement}'`;
  });
};

const routePathFromFile = (filePath) => {
  const relative = path.relative(apiRoot, path.dirname(filePath)).replace(/\\/g, '/');
  const segments = relative ? relative.split('/') : [];
  const routeSegments = segments.map((segment) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return `:${segment.slice(1, -1)}`;
    }

    return segment;
  });

  return `/api${routeSegments.length ? `/${routeSegments.join('/')}` : ''}`;
};

const collectRouteFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const routeFiles = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      routeFiles.push(...await collectRouteFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name === 'route.js') {
      routeFiles.push(entryPath);
    }
  }

  return routeFiles;
};

const importRouteModule = async (filePath) => {
  const source = await fs.readFile(filePath, 'utf8');
  const generatedFilePath = path.join(generatedRoot, path.relative(apiRoot, filePath));
  const replacementMap = buildReplacementMap(generatedFilePath);
  const rewrittenSource = rewriteSource(source, replacementMap);
  await fs.mkdir(path.dirname(generatedFilePath), { recursive: true });
  await fs.writeFile(generatedFilePath, rewrittenSource, 'utf8');
  return import(pathToFileURL(generatedFilePath).href);
};

export const registerRoutes = async (app) => {
  const routeFiles = await collectRouteFiles(apiRoot);

  for (const filePath of routeFiles) {
    const module = await importRouteModule(filePath);
    const routePath = routePathFromFile(filePath);

    for (const methodName of methodNames) {
      const handler = module[methodName];
      if (typeof handler !== 'function') {
        continue;
      }

      app[methodName.toLowerCase()](routePath, async (req, res) => {
        try {
          const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
          const request = createRequestAdapter(req, fullUrl);
          const response = await handler(request, { params: req.params });
          await sendWebResponse(res, response);
        } catch (error) {
          console.error(`Route error for ${methodName} ${routePath}:`, error);
          const payload = { message: 'Internal server error' };
          if (process.env.NODE_ENV !== 'production') {
            payload.error = error.message;
          }
          res.status(500).json(payload);
        }
      });
    }
  }

  console.log(`Registered ${routeFiles.length} API route modules from backend/routes`);
};