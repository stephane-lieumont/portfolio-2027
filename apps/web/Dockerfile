# The site image (ADR-0021): nginx and the two prerendered trees. Nothing is
# built here; CI runs `pnpm build:site` first, then builds with apps/web as
# the context: docker build -t portfolio-site apps/web
FROM nginxinc/nginx-unprivileged:1.30.6-alpine3.24

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY dist/web/nginx/csp-inline-scripts.conf /etc/nginx/csp-inline-scripts.conf
COPY dist/web/browser /srv/site

RUN nginx -t

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
