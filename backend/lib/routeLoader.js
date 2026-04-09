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

const replacementMap = new Map([
  ['next/server', toFileUrl(path.join(localLibRoot, 'nextResponse.js'))],
  ['@/lib/database', toFileUrl(path.join(localLibRoot, 'database.js'))],
  ['@/lib/auth', toFileUrl(path.join(localLibRoot, 'auth.js'))],
  ['@/lib/cloudStorage', toFileUrl(path.join(localLibRoot, 'cloudStorage.js'))],
  ['@/lib/programsData', toFileUrl(path.join(localLibRoot, 'programsData.js'))],
  ['@/lib/models/User.js', toFileUrl(path.join(localLibRoot, 'models', 'User.js'))],
  ['@/lib/models/Activity.js', toFileUrl(path.join(localLibRoot, 'models', 'Activity.js'))],
]);

const rewriteSource = (source) => {
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
  const rewrittenSource = rewriteSource(source);
  const generatedFilePath = path.join(generatedRoot, path.relative(apiRoot, filePath));
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