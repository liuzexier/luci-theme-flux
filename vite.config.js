import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { defineConfig } from 'vite';
import { compileCss, cssPaths } from './scripts/css-pipeline.mjs';

const routerTarget = process.env.ROUTER_TARGET || 'http://192.168.17.1';
const routerUrl = new URL(routerTarget);
const configuredRouterHosts = process.env.ROUTER_TARGETS || '192.168.17.1,192.168.6.1';
const allowAnyRouter = configuredRouterHosts.trim() === '*';
const allowedRouterHosts = new Set(
  configuredRouterHosts
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
    .map((host) => {
      try {
        return new URL(host.includes('://') ? host : `http://${host}`).hostname;
      } catch {
        return host;
      }
    }),
);
const fluxAssets = path.resolve(import.meta.dirname, 'htdocs/luci-static/flux');
const assetPrefix = '/luci-static/flux/';

function forwardProxyRequest(req, res, requestUrl) {
  const transport = requestUrl.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: requestUrl.host };
  delete headers['proxy-connection'];

  const upstream = transport.request({
    headers,
    hostname: requestUrl.hostname,
    method: req.method,
    path: `${requestUrl.pathname}${requestUrl.search}`,
    port: requestUrl.port || undefined,
    protocol: requestUrl.protocol,
  }, (upstreamResponse) => {
    res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(res);
  });

  upstream.on('error', (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    }
    res.end(`Unable to reach ${requestUrl.host}: ${error.message}\n`);
  });

  req.pipe(upstream);
}

function localFluxAssets() {
  return {
    name: 'local-flux-assets',
    configureServer(server) {
      const reloadPatterns = [
        path.resolve(import.meta.dirname, 'src/styles'),
        path.resolve(import.meta.dirname, 'luasrc'),
        path.resolve(import.meta.dirname, 'preview'),
        path.resolve(import.meta.dirname, 'htdocs/luci-static/flux'),
      ];

      server.watcher.add(reloadPatterns);
      server.watcher.on('change', (changedPath) => {
        if (changedPath !== cssPaths.outputFile && reloadPatterns.some((root) => changedPath.startsWith(root))) {
          server.ws.send({ type: 'full-reload' });
        }
      });

      server.middlewares.use(async (req, res, next) => {
        const originalUrl = req.url || '/';
        const isForwardProxyRequest = /^https?:\/\//.test(originalUrl);
        const requestUrl = new URL(originalUrl, 'http://localhost');

        if (isForwardProxyRequest) {
          if (!allowAnyRouter && !allowedRouterHosts.has(requestUrl.hostname)) {
            res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
            res.end(`This development proxy does not allow ${requestUrl.hostname}. Allowed hosts: ${[...allowedRouterHosts].join(', ')}.\n`);
            return;
          }
        }

        if (!requestUrl.pathname.startsWith(assetPrefix)) {
          if (isForwardProxyRequest) {
            forwardProxyRequest(req, res, requestUrl);
            return;
          }

          next();
          return;
        }

        const relativePath = requestUrl.pathname.slice(assetPrefix.length);

        if (relativePath === 'cascade.css') {
          try {
            const css = await compileCss();
            res.writeHead(200, {
              'cache-control': 'no-store, no-cache, must-revalidate',
              'content-length': Buffer.byteLength(css),
              'content-type': 'text/css; charset=utf-8',
              expires: '0',
              pragma: 'no-cache',
            });
            res.end(css);
          } catch (error) {
            server.ssrFixStacktrace(error);
            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
            res.end(error.stack || error.message);
          }
          return;
        }

        const assetPath = path.resolve(fluxAssets, relativePath);

        if (!assetPath.startsWith(`${fluxAssets}${path.sep}`)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        fs.readFile(assetPath, (error, content) => {
          if (error) {
            if (error.code === 'ENOENT') {
              next();
              return;
            }

            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
            res.end(error.message);
            return;
          }

          // Only the development proxy adds this message; packaged assets stay quiet.
          if (relativePath === 'mobile.js') {
            content = Buffer.concat([
              Buffer.from('console.info("%c[Flux Local Dev]%c Assets are served by the local Vite proxy.", "font-weight:700", "font-weight:400");\n'),
              content,
            ]);
          }

          const extension = path.extname(assetPath);
          const contentTypes = {
            '.css': 'text/css; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.svg': 'image/svg+xml',
          };

          res.writeHead(200, {
            'cache-control': 'no-store, no-cache, must-revalidate',
            'content-length': content.length,
            'content-type': contentTypes[extension] || 'application/octet-stream',
            expires: '0',
            pragma: 'no-cache',
          });
          res.end(content);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [localFluxAssets()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 8094),
    proxy: {
      '/': {
        changeOrigin: true,
        target: routerTarget,
      },
    },
  },
});
