# Deploying a Project to the CMM Droplet

A template for putting a web project on the shared DigitalOcean droplet under its own domain, with
HTTPS, automatic deploys from GitHub, and compression and caching set up. The CMM Internship Hub
is the worked example throughout; its full runbook is [`OPERATIONS.md`](./OPERATIONS.md).

Replace every `<PLACEHOLDER>` with your project's values. The domain is a placeholder too: any
subdomain of `cmm.works` (`<name>.cmm.works`) or a domain you own works the same way.

---

## 1. How the server works

```
                 internet (ports 80 / 443)
                            │
                ┌───────────▼────────────┐
                │ Caddy  (in /opt/cmm)   │  HTTPS certificates, HTTP→HTTPS redirect,
                │ the only public port   │  gzip/zstd, routing by hostname
                └───┬───────────────┬────┘
   internship.cmm.works        <APP_DOMAIN>
        │                           │
  ┌─────▼─────┐               ┌─────▼──────────┐
  │ web  api  │  /opt/cmm     │ <PROJECT>-web  │  /opt/<PROJECT>
  └───────────┘               └────────────────┘
           all on the Docker network  cmm_default
```

- **One droplet:** `139.59.100.44`, user `deploy`, Docker + Docker Compose.
- **One Caddy for every site.** Only one process can listen on ports 80/443, and that is the Caddy
  container in CMM's stack. A new project does **not** run its own Caddy or nginx on those ports.
  It adds a site block to the shared Caddyfile, which lives in the CMM server repo at
  `infra/caddy/Caddyfile`.
- **Every project gets its own folder**, `/opt/<PROJECT>/`, holding its `docker-compose.yml` and
  `.env`. Its containers join CMM's Docker network (`cmm_default`) so Caddy can reach them by name.
- **Images are built by GitHub Actions** and pushed to GitHub Container Registry (GHCR). The droplet
  never builds anything; it pulls and restarts.

> The shared network and a second project on this droplet have not been set up yet: CMM is the only
> project today. The steps below are the intended way to add one. Confirm the network name with
> `docker network ls` on the droplet before relying on `cmm_default`.

---

## 2. Values to decide first

| Placeholder | Meaning | CMM's value |
|---|---|---|
| `<APP_DOMAIN>` | The hostname users open | `internship.cmm.works` |
| `<PROJECT>` | Short lowercase slug; used for the folder, compose project and service names | `cmm` |
| `<ORG>` | GitHub owner of the repo, **lowercase** | `cmm-internship-hub` |
| `<IMAGE>` | Image name, **lowercase** | `cmm-internship-hub-client` |
| `<PORT>` | Port the container listens on inside Docker | `80` (web), `3000` (api) |
| `<HEALTH_PATH>` | A URL that returns 200 when the app is up | `/api/health` |

Docker image names must be lowercase, which is why `<ORG>` and `<IMAGE>` are written out by hand
instead of taken from `github.repository`.

---

## 3. DNS

At the DNS provider for the domain (for `cmm.works` that is GoDaddy → **My Products → cmm.works →
DNS**), add:

| Type | Name | Value |
|---|---|---|
| `A` | the subdomain part of `<APP_DOMAIN>` (e.g. `internship`), or `@` for a bare domain | `139.59.100.44` |

- Do **not** add an `AAAA` (IPv6) record. Let's Encrypt prefers IPv6 when one exists, and certificate
  issuance fails because the droplet does not answer on IPv6.
- For a domain bought somewhere else, edit its **existing** `@` `A` record (registrars often create
  one pointing at a parking page) instead of adding a second, and turn off any domain forwarding.
- A brand-new domain can take a few hours before it resolves anywhere. A new subdomain on a working
  domain usually resolves within minutes.

Check from any terminal before going further:

```bash
nslookup <APP_DOMAIN> 8.8.8.8      # must answer 139.59.100.44
```

Caddy can only get a certificate once this works. Deploying earlier makes the HTTPS smoke check fail.

---

## 4. Container image

Any image works as long as it serves HTTP on `<PORT>` inside the container. HTTPS is Caddy's job, so
the container serves plain HTTP.

**A static single-page app (React/Vite and similar)** can copy CMM's client setup: a multi-stage
`Dockerfile` that builds with Node and serves `dist/` from nginx.

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite bakes VITE_* variables in at build time; pass them as build args from the workflow.
ARG VITE_SOME_PUBLIC_VALUE
ENV VITE_SOME_PUBLIC_VALUE=$VITE_SOME_PUBLIC_VALUE
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf`, which gives the year-long cache on hashed assets, no-cache on `index.html` and the
SPA fallback that lets a refresh on `/some/route` work:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location / {
        add_header Cache-Control "no-cache";
        try_files $uri $uri/ /index.html;
    }
}
```

Compression is done once, by Caddy (`encode zstd gzip`), so it is not repeated here.

**A backend** (Node/Express, etc.): listen on `<PORT>` on all interfaces (`0.0.0.0`, not
`localhost`), read secrets from environment variables, and expose a health endpoint that returns
200. CMM's `Dockerfile` in this repo is a minimal Node example.

**Frontend + backend on one domain:** serve both from `<APP_DOMAIN>` and have the frontend call the
API with a relative path (`/api/...`). Same origin means no CORS setup. Do **not** bake a hostname
like `https://<APP_DOMAIN>` into the frontend build; see [Lessons learned](#10-lessons-learned).

---

## 5. Files on the droplet

```
/opt/<PROJECT>/
  docker-compose.yml   # copied by the deploy workflow from the repo's infra/docker-compose.yml
  .env                 # secrets, created by hand on the droplet; never in git
```

`infra/docker-compose.yml` in your repo:

```yaml
name: <PROJECT>

services:
  <PROJECT>-web:
    image: ghcr.io/<ORG>/<IMAGE>:latest
    restart: unless-stopped
    # env_file:            # only if the container needs runtime secrets
    #   - .env
    expose:
      - "<PORT>"

networks:
  default:
    name: cmm_default
    external: true
```

- **Prefix every service name with `<PROJECT>-`.** All projects share one network, and a service's
  name is its hostname on that network. CMM already uses `web`, `api` and `caddy`; a second `web`
  would make Caddy's routing ambiguous.
- Use `expose`, **never `ports`.** Publishing a port bypasses Caddy (no HTTPS), and 80/443 are
  already taken.
- `restart: unless-stopped` brings the containers back after a droplet reboot.

One-time setup on the droplet (`ssh -i ./cmm_deploy_key deploy@139.59.100.44`):

```bash
sudo mkdir -p /opt/<PROJECT> && sudo chown deploy:deploy /opt/<PROJECT>
nano /opt/<PROJECT>/.env          # only if the compose file uses env_file
docker network ls | grep cmm      # confirm the shared network's name
free -h && docker stats --no-stream   # make sure the droplet has memory to spare
```

---

## 6. Caddy site block

Add your site to `infra/caddy/Caddyfile` in **this repo** (CMM-Internship-Hub-Server), through a PR
like any other change:

```caddyfile
<APP_DOMAIN> {
	encode zstd gzip
	reverse_proxy <PROJECT>-web:<PORT>
}
```

Frontend and API in separate containers on one domain:

```caddyfile
<APP_DOMAIN> {
	encode zstd gzip

	handle /api/* {
		reverse_proxy <PROJECT>-api:<API_PORT>
	}

	handle {
		reverse_proxy <PROJECT>-web:80
	}
}
```

Optional: send `www.<APP_DOMAIN>` (or an old hostname) to the main one:

```caddyfile
www.<APP_DOMAIN> {
	redir https://<APP_DOMAIN>{uri} permanent
}
```

Merging that PR to `main` copies the Caddyfile to `/opt/cmm/caddy/` and reloads Caddy without
dropping connections. Caddy then requests the certificate for `<APP_DOMAIN>` on its own and renews
it automatically.

To test a Caddyfile change before merging:

```bash
# locally, with Docker running: checks the syntax
docker run --rm -v "$PWD/infra/caddy:/etc/caddy:ro" caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile

# or apply it straight to the droplet
scp -i ./cmm_deploy_key infra/caddy/Caddyfile deploy@139.59.100.44:/opt/cmm/caddy/Caddyfile
ssh -i ./cmm_deploy_key deploy@139.59.100.44 \
  "cd /opt/cmm && docker compose exec -T -w /etc/caddy caddy caddy reload --config /etc/caddy/Caddyfile"
```

A Caddyfile with an error is rejected by `caddy reload` and the old config keeps running, so a bad
edit fails the deploy but does not take the sites down.

---

## 7. Deploy workflow

`.github/workflows/deploy.yml` in your repo. On every push to `main` it builds the image, pushes it
to GHCR, copies the compose file to the droplet, restarts your containers, and checks the site over
HTTPS.

```yaml
name: Deploy

on:
  push:
    branches: [main]

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          # build-args: |
          #   VITE_SOME_PUBLIC_VALUE=${{ secrets.VITE_SOME_PUBLIC_VALUE }}
          tags: |
            ghcr.io/<ORG>/<IMAGE>:latest
            ghcr.io/<ORG>/<IMAGE>:${{ github.sha }}

      - name: Copy compose file to droplet
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.DROPLET_SSH_KEY }}
          source: "infra/docker-compose.yml"
          target: "/opt/<PROJECT>/"
          strip_components: 1

      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            cd /opt/<PROJECT>
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f

      - name: Smoke check
        run: |
          # Retries cover a first boot, while Caddy is still getting the certificate.
          curl -fsS --retry 10 --retry-delay 5 --retry-all-errors https://<APP_DOMAIN><HEALTH_PATH>
```

The workflow never touches Caddy. Caddy only changes through the CMM server repo (step 6).

**Repository secrets** (repo → Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `DROPLET_HOST` | `139.59.100.44` |
| `DROPLET_USER` | `deploy` |
| `DROPLET_SSH_KEY` | Private half of the deploy key (`cmm_deploy_key`); ask whoever maintains the droplet |
| any build-time values | e.g. `VITE_SUPABASE_URL`. GitHub does not allow an empty secret, so leave out anything that should be empty instead of storing a blank |

**Pulling images on the droplet:** GHCR packages in the CMM org are private, so the droplet logs in
to GHCR once with a **classic** personal access token that has the `read:packages` scope (stored in
`/home/deploy/.docker/config.json`). A classic token covers every package its owner can read; a
fine-grained one is limited to specific repos and fails with `unauthorized` on a new package. If
your image lives under a different GitHub account or org, make sure that token's owner can read it,
or run `docker login ghcr.io` again with one that can.

---

## 8. Sign-in providers

If the app signs users in through an external provider, register the new domain there before going
live, or sign-in returns users to the wrong address:

- **Supabase → Authentication → URL Configuration:** **Site URL** `https://<APP_DOMAIN>`, and add
  `https://<APP_DOMAIN>/**` to **Redirect URLs**.
- **Google Cloud OAuth client:** only if it lists the site under *Authorized JavaScript origins*,
  add `https://<APP_DOMAIN>`. When Google sign-in goes through Supabase, the redirect URI is
  Supabase's own callback and does not change.

---

## 9. Go-live order

1. DNS record added, and `nslookup <APP_DOMAIN> 8.8.8.8` returns `139.59.100.44` (step 3).
2. `/opt/<PROJECT>/` created on the droplet, `.env` filled in if needed (step 5).
3. Caddy site block merged in the CMM server repo (step 6). Caddy gets the certificate within
   seconds; the site answers `502` until your containers exist, which is expected.
4. Repo secrets set (step 7) and the deploy workflow merged to `main`. The containers start and the
   smoke check passes.
5. Sign-in provider URLs updated (step 8), then sign in once on `https://<APP_DOMAIN>` to confirm.

Moving an existing project to a new domain follows the same order: new DNS record, then the
hostname in the Caddyfile and in the smoke check, then the provider URLs. Keep the old hostname as a
`redir` block so existing links keep working.

---

## 10. Lessons learned

The first five happened while setting up CMM; the last two are easy mistakes to avoid.

| Symptom | Cause | Fix |
|---|---|---|
| Smoke check fails with `tlsv1 alert internal error`; Caddy logs `config is unchanged` after a reload | The Caddyfile was mounted into the container as a single file. Deploys replace the file, and a single-file mount stays on the old one | Mount the folder (`./caddy:/etc/caddy:ro`), as CMM's compose file now does |
| Certificate errors on a new domain | DNS not resolving yet, an `AAAA` record, port 80 blocked, or a Let's Encrypt rate limit | Deploy only after `nslookup` works; remove `AAAA`; check `docker compose -f /opt/cmm/docker-compose.yml logs caddy` |
| After a domain change, sign-in works but every API call fails | The frontend build had the old API hostname baked in, so calls went cross-origin and hit a redirect, which the browser blocks | Use relative API paths; never put a hostname in a build-time variable |
| Google sign-in returns to `/#` instead of the app's start page | Supabase's default (implicit) flow clears the token with `location.hash = ''`, which interrupts the router's redirect while lazy-loaded pages download | Create the Supabase client with `auth: { flowType: "pkce" }` |
| Campus Wi-Fi shows certificate warnings, or blocks `sslip.io` | The university network (Fortinet) inspects HTTPS and re-signs certificates | Test from mobile data or rely on the GitHub Actions smoke check |
| Deploying twice to `main` at once breaks things | Two deploys racing on the droplet | Keep the `concurrency` block in the workflow |
| `docker compose down -v` was run on CMM's stack | Removes `caddy_data`, so every certificate is re-requested and can hit Let's Encrypt's weekly limit | Do not use `-v` on `/opt/cmm` |

---

## 11. Removing a project

1. Remove its site block from the CMM Caddyfile (PR in this repo).
2. On the droplet: `cd /opt/<PROJECT> && docker compose down`, then delete the folder.
3. Delete the DNS record, the repo secrets and the sign-in provider URLs.
