# Connectors by job

Purpose: pick the right MCP connector for a task, and know the exact command to add it to Claude Code.

Sources: official MCP Registry + vendor docs, collected 2026-10-21. This file covers about 150 hand-picked servers. The full registry index (roughly 47,000 entries) lives in `data/connectors.tsv`.

**Primer**
- **Transports.** `stdio` runs a local process: `claude mcp add <name> -- <command> [args]`. On native Windows, wrap `npx` as `-- cmd /c npx ...`. Remote servers use `--transport http`. `--transport sse` is deprecated, so use it only when a vendor still requires it.
- **Scopes.** `--scope local` is the default: this project only, private, stored in `~/.claude.json`. `--scope project` writes `.mcp.json` to the repo so the team shares it. `--scope user` applies to all of your projects.
- **Secrets.** API keys go in `--env KEY=value` (stdio) or `--header "Authorization: Bearer ..."` (http). Put `--env` after `--transport` and before the name. `YOUR_*` below are placeholders, never real values.
- **OAuth.** Remote OAuth servers need no key at add time. Run `/mcp` inside Claude Code, or `claude mcp login <name>`, and finish sign-in in the browser. Some vendors need your own OAuth app, which you pass with `--client-id YOUR_CLIENT_ID --client-secret` (the secret is prompted for) and `--callback-port`.
- **Manage.** Use `claude mcp list`, `claude mcp get <name>` and `claude mcp remove <name>`. Anything in the Claude.ai connector directory can also be enabled in Claude.ai or Claude Desktop under Settings > Connectors, with no command.

---

## Source control & issue tracking

### GitHub — GitHub
- **What:** Reads and changes repos, issues, pull requests, Actions runs and code-security alerts through GitHub's hosted server.
- **Use when:** triaging issues, reviewing or opening PRs, checking CI failures, or searching code across repos you can access.
- **Skip when:** you only need local git history or diffs; the `gh` CLI or the Git reference server is lighter.
- **Setup (Claude Code):** `claude mcp add --transport http github https://api.githubcopilot.com/mcp/ --header "Authorization: Bearer YOUR_GITHUB_PAT"` (PAT in a header; a local Docker image `ghcr.io/github/github-mcp-server` is also available).
- **Source:** `io.github.github/github-mcp-server` · https://github.com/github/github-mcp-server

### GitLab — GitLab
- **What:** GitLab's built-in MCP endpoint for issues, merge requests, pipelines and search, on gitlab.com or a self-managed instance.
- **Use when:** your code and CI live in GitLab.
- **Setup (Claude Code):** `claude mcp add -s user --transport http GitLab https://gitlab.com/api/v4/mcp` (or `https://YOUR_GITLAB_HOST/api/v4/mcp`). Sign in with OAuth via `/mcp`, or use a fine-grained PAT; classic PATs are rejected. It must be enabled per top-level group or instance.
- **Source:** `com.gitlab/mcp` · https://docs.gitlab.com/user/model_context_protocol/mcp_server/

### Linear — Linear
- **What:** Creates, searches and updates Linear issues, projects, cycles and comments.
- **Use when:** planning sprints, filing bugs from a coding session, or summarizing a team's backlog.
- **Setup (Claude Code):** `claude mcp add --transport http linear-server https://mcp.linear.app/mcp` (OAuth via `/mcp`; a read-only endpoint is at `/mcp/readonly`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `app.linear/linear` · https://linear.app/docs/mcp

### Atlassian Rovo (Jira, Confluence, Compass) — Atlassian
- **What:** One server for Jira issues, Confluence pages, Compass components and other Atlassian apps, with your existing permissions.
- **Use when:** you need Jira tickets or Confluence docs in context, or want to file or update them.
- **Setup (Claude Code):** `claude mcp add --transport http atlassian https://mcp.atlassian.com/v2/mcp` (OAuth 2.1 via `/mcp`; an API token is optional).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.atlassian/atlassian-mcp-server` · https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/

## Deploy & hosting

### Vercel — Vercel
- **What:** Searches Vercel docs and inspects projects, deployments, build logs and analytics.
- **Use when:** debugging a failed Vercel deploy or checking what is live.
- **Setup (Claude Code):** `claude mcp add --transport http vercel https://mcp.vercel.com` (OAuth via `/mcp`; only approved clients).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.vercel/vercel-mcp` · https://vercel.com/docs/agent-resources/vercel-mcp

### Netlify — Netlify
- **What:** Creates, deploys and configures Netlify sites, functions, env vars and extensions.
- **Use when:** shipping a static or Jamstack site to Netlify from the terminal.
- **Setup (Claude Code):** `claude mcp add --transport http netlify https://netlify-mcp.netlify.app/mcp` (signs in through the browser). Local alternative: `claude mcp add netlify -- npx -y @netlify/mcp`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.netlify.com/build/build-with-ai/agent-setup-guides/set-up-claude-code-for-netlify/

### Cloudflare — Cloudflare
- **What:** One server that reaches the whole Cloudflare API (Workers, KV, R2, D1, DNS and more). Separate servers cover docs, containers, the browser and DEX.
- **Use when:** managing Workers or other Cloudflare resources, or reading Cloudflare docs (`https://docs.mcp.cloudflare.com/mcp`).
- **Skip when:** you're tempted by the single-product servers (bindings, builds, observability, radar, logs and others). Cloudflare marks them deprecated in favour of this one.
- **Setup (Claude Code):** `claude mcp add --transport http cloudflare https://mcp.cloudflare.com/mcp` (OAuth via `/mcp`; Bearer API token for CI). Cloudflare also ships a plugin: `/plugin marketplace add cloudflare/skills`
- **Also in:** Claude.ai / Claude Desktop connector directory (as "Cloudflare Developer Platform")
- **Source:** `com.cloudflare.mcp/mcp` · https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/

### Railway — Railway
- **What:** Creates projects, deploys services, and reads logs, status and variables on Railway.
- **Use when:** deploying an app or database to Railway and debugging it.
- **Setup (Claude Code):** `claude mcp add --transport http railway https://mcp.railway.com` (OAuth). Railway's CLI can also do it: `railway mcp install --agent claude-code`. The npm `@railway/mcp-server` is deprecated.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.railway/mcp` · https://docs.railway.com/cli/mcp

### Render — Render
- **What:** Creates and manages Render web services, cron jobs, Postgres and Key Value, and reads deploys, logs and metrics.
- **Use when:** your app is hosted on Render.
- **Setup (Claude Code):** `claude mcp add --transport http render https://mcp.render.com/mcp --header "Authorization: Bearer YOUR_RENDER_API_KEY"` (Render's Claude Code plugin offers OAuth instead).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://render.com/docs/mcp-server

### Heroku — Heroku (Salesforce)
- **What:** Manages Heroku apps, dynos, add-ons, Postgres and pipelines.
- **Use when:** operating or scaling Heroku apps.
- **Setup (Claude Code):** `claude mcp add --transport http heroku https://mcp.heroku.com/mcp` (OAuth). Local: `claude mcp add --transport stdio heroku -- heroku mcp:start` (uses your Heroku CLI login).
- **Source:** https://devcenter.heroku.com/articles/heroku-remote-mcp-server

### DigitalOcean — DigitalOcean
- **What:** Per-service servers for App Platform, Droplets, Kubernetes (DOKS), managed databases, Spaces and networking.
- **Use when:** deploying or inspecting DigitalOcean infrastructure.
- **Setup (Claude Code):** `claude mcp add --transport http digitalocean-apps https://apps.mcp.digitalocean.com/mcp --header "Authorization: Bearer YOUR_DIGITALOCEAN_API_TOKEN"` (leave out the header to use OAuth; swap `apps` for `droplets`, `databases`, `doks` and so on). Local: `claude mcp add digitalocean-mcp -e DIGITALOCEAN_API_TOKEN=YOUR_TOKEN -- npx @digitalocean/mcp --services apps,databases`
- **Source:** https://github.com/digitalocean-labs/mcp-digitalocean · https://docs.digitalocean.com/reference/mcp/configure-mcp/

### Fly.io — Fly.io
- **What:** An experimental MCP mode built into `flyctl` for apps, Machines, volumes, logs and status.
- **Use when:** you already deploy with flyctl and want the agent to drive it.
- **Setup (Claude Code):** `claude mcp add flyio -- fly mcp server` (uses your flyctl login).
- **Source:** https://docs.fly.io/flyctl/mcp-server

### Firebase — Google
- **What:** The Firebase CLI as an MCP server: projects, Firestore, Auth, security rules, Hosting and Crashlytics.
- **Use when:** building or debugging a Firebase-backed app.
- **Skip when:** you need general Google Cloud resources; use Google Cloud remote MCP instead.
- **Setup (Claude Code):** `claude mcp add firebase npx -- -y firebase-tools@latest mcp` (uses your Firebase CLI login or ADC). A plugin is also available: `claude plugin marketplace add firebase/firebase-tools`
- **Source:** `io.github.firebase/firebase-mcp` · https://firebase.google.com/docs/ai-assistance/mcp-server

## Cloud & infrastructure

### AWS MCP Server — AWS
- **What:** AWS's managed server that makes authenticated AWS API calls, searches AWS docs and runs AWS-authored skills.
- **Use when:** you need to inspect or change AWS resources in any service.
- **Skip when:** you only need docs; the no-auth AWS Knowledge server is enough.
- **Setup (Claude Code):** `claude mcp add aws-mcp https://aws-mcp.us-east-1.api.aws/mcp --transport http` (OAuth; needs the IAM policy `AWSMCPSignInOAuthAccessPolicy`). For SigV4 instead, use the `mcp-proxy-for-aws` stdio proxy from the docs.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.aws/aws-mcp` · https://docs.aws.amazon.com/aws-mcp/latest/userguide/getting-started-aws-mcp-server.html

### Azure MCP Server — Microsoft
- **What:** A local server covering Azure Storage, Cosmos DB, Key Vault, AKS, Monitor and dozens of other services.
- **Use when:** you need to query or manage Azure resources with your Azure CLI identity.
- **Setup (Claude Code):** `claude mcp add azure -- npx -y @azure/mcp@latest server start` (uses DefaultAzureCredential, so sign in with `az login`). Microsoft's own route is the plugin: `/plugin install azure@claude-plugins-official`
- **Source:** `com.microsoft/azure` · https://github.com/microsoft/mcp/blob/main/servers/Azure.Mcp.Server/README.md

### Google Cloud remote MCP — Google
- **What:** Google-managed MCP endpoints per GCP API, such as `run`, `compute`, `container`, `firestore`, `monitoring` and `bigquery`.
- **Use when:** you need to act on specific Google Cloud services without installing anything.
- **Skip when:** you'd rather wrap the gcloud CLI you already have; use gcloud MCP.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret cloudrun https://run.googleapis.com/mcp` (OAuth 2.0 client from your GCP project; IAM role `roles/mcp.toolUser`).
- **Source:** `com.googleapis.run/mcp` and siblings · https://docs.cloud.google.com/mcp/supported-products

### gcloud MCP — Google
- **What:** Runs gcloud CLI commands for the agent, using your active gcloud account.
- **Use when:** you're scripting broad GCP admin work that gcloud already covers.
- **Setup (Claude Code):** `claude mcp add gcloud -- npx -y @google-cloud/gcloud-mcp` (needs Node 20+ and gcloud).
- **Source:** https://github.com/googleapis/gcloud-mcp

### Docker MCP Toolkit — Docker
- **What:** A gateway that runs servers from the Docker MCP Catalog in containers, with Toolkit managing their secrets.
- **Use when:** you want many community servers isolated in containers behind one entry.
- **Setup (Claude Code):** `docker mcp client connect claude-code` (writes an `MCP_DOCKER` entry). Manual: `claude mcp add MCP_DOCKER -- docker mcp gateway run`. Requires Docker Desktop with MCP Toolkit enabled.
- **Source:** https://docs.docker.com/ai/mcp-catalog-and-toolkit/get-started/

### Kubernetes — containers (Red Hat)
- **What:** A native Kubernetes and OpenShift server for pods, resources, logs, events and Helm, driven by your kubeconfig.
- **Use when:** debugging workloads or applying manifests on a cluster.
- **Setup (Claude Code):** `claude mcp add kubernetes -- npx -y kubernetes-mcp-server@latest` (uses `KUBECONFIG` or the in-cluster config).
- **Source:** `io.github.containers/kubernetes-mcp-server` · https://github.com/containers/kubernetes-mcp-server

### Terraform — HashiCorp
- **What:** Looks up Terraform Registry providers, modules and policies, and manages HCP Terraform or TFE workspaces.
- **Use when:** you're writing or reviewing Terraform and need accurate provider schemas.
- **Setup (Claude Code):** `claude mcp add terraform -s user -t stdio -- docker run -i --rm hashicorp/terraform-mcp-server` (optional `TFE_TOKEN` for HCP Terraform).
- **Source:** `io.github.hashicorp/terraform-mcp-server` · https://github.com/hashicorp/terraform-mcp-server

### Pulumi — Pulumi
- **What:** Pulumi Cloud, registry lookups, stacks and Pulumi Neo, served remotely.
- **Use when:** your infrastructure as code is Pulumi.
- **Skip when:** your infrastructure is Terraform; use Terraform.
- **Setup (Claude Code):** `claude mcp add --transport http pulumi https://mcp.ai.pulumi.com/mcp` (asks for a Pulumi access token on first connect).
- **Source:** https://www.pulumi.com/docs/iac/guides/ai-integration/mcp-server/

## CI, API & code quality

### CircleCI — CircleCI
- **What:** Reads CircleCI build logs, flaky tests and pipeline status, and validates config.
- **Use when:** a CircleCI pipeline is red and you want the failure explained.
- **Setup (Claude Code):** `claude mcp add --transport http circleci https://mcp.circleci.com/v1/mcp` (OAuth or personal API token). The npm `@circleci/mcp-server-circleci` is deprecated.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.circleci/mcp` · https://circleci.com/docs/guides/toolkit/circleci-mcp-overview/

### Buildkite — Buildkite
- **What:** Covers Buildkite pipelines, builds, jobs, logs and test analytics.
- **Use when:** your CI runs on Buildkite.
- **Setup (Claude Code):** `claude mcp add --transport http buildkite https://mcp.buildkite.com/mcp` (OAuth; read-only at `/mcp/readonly`).
- **Source:** `io.github.buildkite/buildkite-mcp-server` · https://buildkite.com/docs/apis/mcp-server

### Postman — Postman
- **What:** Manages Postman workspaces, collections, environments, specs and mocks.
- **Use when:** you're generating or testing API collections, or syncing code with an API spec.
- **Setup (Claude Code):** `claude mcp add --transport http postman https://mcp.postman.com/minimal` (OAuth in the US; add `--header "Authorization: Bearer YOUR_POSTMAN_API_KEY"` for the EU or headless use; the full toolset is at `/mcp`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.postman/postman-mcp-server` · https://learning.postman.com/docs/reference/postman-api/postman-mcp-server/postman-mcp-remote-server/

### Snyk — Snyk
- **What:** Snyk's SCA, SAST, IaC and container scans, run through the Snyk CLI.
- **Use when:** you want dependency and code vulnerabilities checked before a commit.
- **Setup (Claude Code):** `npx -y snyk@latest mcp configure --tool=claude-cli` (vendor helper). Manual: `claude mcp add snyk -- npx -y snyk@latest mcp -t stdio` (authenticate first with `snyk auth`).
- **Source:** `io.snyk/mcp` · https://docs.snyk.io/agent-security/agentic-security-with-snyk-studio/quickstart-guides/claude-code-guide

### Semgrep — Semgrep
- **What:** Local Semgrep scanning for static analysis, custom rules and findings.
- **Use when:** you want fast, rule-based security scans of code the agent just wrote.
- **Skip when:** you also need dependency (SCA) coverage; use Snyk.
- **Setup (Claude Code):** `claude mcp add semgrep -- semgrep mcp` (needs the Semgrep CLI; `SEMGREP_APP_TOKEN` is optional). Semgrep also offers a Claude Code plugin through `/plugin`.
- **Source:** https://github.com/semgrep/semgrep/blob/develop/cli/src/semgrep/mcp/README.md

### SonarQube — SonarSource
- **What:** Reads SonarQube Cloud or Server issues and quality gates, and analyzes code snippets.
- **Use when:** your team gates merges on SonarQube.
- **Setup (Claude Code):** `claude mcp add sonarqube --env SONARQUBE_TOKEN=YOUR_TOKEN --env SONARQUBE_ORG=YOUR_ORG -- docker run --init --pull=always -i --rm -e SONARQUBE_TOKEN -e SONARQUBE_ORG sonarsource/sonarqube-mcp` (SonarQube Server uses `SONARQUBE_URL` in place of `SONARQUBE_ORG`).
- **Source:** `io.github.SonarSource/sonarqube-mcp-server` · https://github.com/SonarSource/sonarqube-mcp-server

### JetBrains IDE MCP — JetBrains
- **What:** The MCP server built into IntelliJ-based IDEs (2025.2+). It exposes run configurations, inspections, files and the terminal.
- **Use when:** you want Claude Code to use IDE intelligence such as inspections and refactors.
- **Setup (Claude Code):** no CLI command is documented. In the IDE, go to Settings > Tools > MCP Server > Clients Auto-Configuration, auto-configure Claude Code, then restart Claude Code.
- **Source:** https://www.jetbrains.com/help/idea/mcp-server.html

## Observability & incidents

### Sentry — Sentry
- **What:** Searches Sentry issues, errors, traces and releases, and can run Seer root-cause analysis.
- **Use when:** fixing a production error; paste the issue and let the agent pull the stack trace.
- **Setup (Claude Code):** `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` (OAuth via `/mcp`; you can scope it as `/mcp/YOUR_ORG/YOUR_PROJECT`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.getsentry/sentry-mcp` · https://mcp.sentry.dev/

### Datadog — Datadog
- **What:** Searches Datadog logs, metrics, traces, monitors, incidents and dashboards.
- **Use when:** an incident needs correlated telemetry, or you want to check monitors from the terminal.
- **Setup (Claude Code):** `claude mcp add --transport http datadog-mcp YOUR_MCP_SERVER_ENDPOINT`. The endpoint depends on your site; for US1 it is `https://mcp.datadoghq.com/api/unstable/mcp-server/mcp`. Authenticate with OAuth, or with `DD_API_KEY`/`DD_APPLICATION_KEY` headers. Datadog recommends `/plugin install datadog@claude-plugins-official`.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.datadoghq.com/bits_ai/mcp_server/setup/

### Grafana — Grafana Labs
- **What:** Searches Grafana dashboards, queries Prometheus and Loki, and manages alerts and incidents.
- **Use when:** your metrics and logs live in Grafana Cloud or a self-hosted Grafana.
- **Setup (Claude Code):** `claude mcp add grafana --transport http https://mcp.grafana.com/mcp` (Grafana Cloud, OAuth). For OSS, run `uvx mcp-grafana` with `GRAFANA_URL` and `GRAFANA_SERVICE_ACCOUNT_TOKEN`.
- **Also in:** Claude.ai / Claude Desktop connector directory (as "Grafana Cloud")
- **Source:** `io.github.grafana/mcp-grafana` · https://grafana.com/docs/grafana-cloud/ai-tools/mcp-servers/cloud-mcp/

### PagerDuty — PagerDuty
- **What:** Manages PagerDuty incidents, services, on-call schedules and escalation.
- **Use when:** you need to find who is on call, acknowledge or annotate incidents, or review an incident's history.
- **Setup (Claude Code):** `claude mcp add-json pagerduty '{"type":"http","url":"https://mcp.pagerduty.com/mcp","headers":{"Authorization":"Token token=YOUR_PAGERDUTY_API_KEY"}}'` (EU: `mcp.eu.pagerduty.com`). OAuth is also supported.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.pagerduty.com/ai-automation/advance/pagerduty-mcp-server

### Honeycomb — Honeycomb
- **What:** Runs Honeycomb queries, traces, SLO and board lookups.
- **Use when:** you're debugging with high-cardinality trace data in Honeycomb.
- **Setup (Claude Code):** `claude mcp add honeycomb --transport http https://mcp.honeycomb.io/mcp` (OAuth; EU: `mcp.eu1.honeycomb.io`). Honeycomb Intelligence must be enabled.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.honeycomb/mcp` · https://docs.honeycomb.io/integrations/mcp/configuration-guide/

### New Relic — New Relic
- **What:** Runs NRQL queries and reads entities, alerts, incidents and APM data.
- **Use when:** your observability stack is New Relic.
- **Setup (Claude Code):** `claude mcp add --transport http --scope user newrelic https://mcp.newrelic.com/mcp/`, then `claude mcp login newrelic` (OAuth; an `api-key` header also works).
- **Source:** `com.newrelic/mcp-server` · https://docs.newrelic.com/docs/agentic-ai/mcp/setup/

## Databases

### Supabase — Supabase
- **What:** Manages Supabase projects, runs SQL, applies migrations, deploys edge functions, and handles branches and logs.
- **Use when:** building on Supabase Postgres, Auth and Storage.
- **Setup (Claude Code):** `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp"` (OAuth via `/mcp`; PAT Bearer for CI).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.supabase/mcp` · https://supabase.com/docs/guides/getting-started/mcp

### Neon — Neon
- **What:** Manages serverless Postgres on Neon: projects, branches, SQL, schema diffs and migrations.
- **Use when:** you want branch-per-feature Postgres and safe migration previews.
- **Setup (Claude Code):** `claude mcp add --transport http neon https://mcp.neon.tech/mcp --header "Authorization: Bearer YOUR_NEON_API_KEY"` (leave out the header and use `/mcp` for OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.neon/mcp` · https://neon.com/docs/ai/connect-mcp-clients-to-neon

### PlanetScale — PlanetScale
- **What:** Manages PlanetScale orgs, databases and branches, runs queries and reads Insights, for MySQL and Postgres.
- **Use when:** your production database is on PlanetScale.
- **Setup (Claude Code):** `claude mcp add --transport http "planetscale" https://mcp.pscale.dev/mcp/planetscale` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.planetscale/mcp-server` · https://planetscale.com/docs/connect/mcp

### Prisma Postgres — Prisma
- **What:** Creates and manages Prisma Postgres databases, backups, connection strings and migrations.
- **Use when:** you're spinning up a Postgres database for a Prisma app.
- **Setup (Claude Code):** `claude mcp add --transport http prisma https://mcp.prisma.io/mcp` (OAuth).
- **Source:** `io.prisma/mcp` · https://www.prisma.io/docs/ai/tools/mcp-server

### Turso — Turso
- **What:** Manages Turso Cloud SQLite databases, groups and branches, and runs SQL.
- **Use when:** you need edge SQLite (libSQL) databases.
- **Setup (Claude Code):** `claude mcp add --transport http turso https://mcp.turso.ai/mcp` (OAuth 2.1). Turso also offers a plugin: `/plugin marketplace add tursodatabase/turso-mcp`
- **Source:** https://docs.turso.tech/integrations/mcp

### Convex — Convex
- **What:** Inspects Convex tables, data, logs and functions, and runs functions on a dev deployment.
- **Use when:** building a Convex app.
- **Setup (Claude Code):** `claude mcp add --transport stdio convex -- npx -y convex@latest mcp start` (needs `npx convex login`). Convex recommends `/plugin install convex@claude-plugins-official`.
- **Source:** https://docs.convex.dev/ai/convex-mcp-server

### DBHub (Postgres, MySQL, SQLite, SQL Server, MariaDB) — Bytebase
- **What:** A universal SQL gateway: point it at a DSN and it explores schemas and runs queries.
- **Use when:** you need any self-hosted or local relational database, especially read-only analytics on Postgres.
- **Skip when:** the database is on Supabase, Neon or PlanetScale; use their servers, which also manage the platform.
- **Setup (Claude Code):** `claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "postgresql://readonly:YOUR_PASSWORD@host:5432/dbname"` (from the Claude Code docs; needs Node 22.5+).
- **Source:** `io.github.bytebase/dbhub` · https://github.com/bytebase/dbhub

### Postgres MCP Pro — Crystal DBA
- **What:** Postgres access with index tuning, EXPLAIN analysis and health checks, plus a read-only "restricted" mode.
- **Use when:** you're doing performance work on Postgres, not just querying it.
- **Skip when:** you only need querying across several database engines; use DBHub.
- **Setup (Claude Code):** `claude mcp add --transport stdio --env DATABASE_URI=postgresql://user:YOUR_PASSWORD@localhost:5432/dbname postgres-pro -- uvx postgres-mcp --access-mode=restricted`
- **Source:** https://github.com/crystaldba/postgres-mcp

### MongoDB — MongoDB
- **What:** Queries, aggregations and schema inspection for MongoDB, plus Atlas cluster, user and access management.
- **Use when:** your app uses MongoDB or Atlas.
- **Setup (Claude Code):** `claude mcp add --transport stdio --env MDB_MCP_CONNECTION_STRING=YOUR_CONNECTION_STRING mongodb -- npx -y mongodb-mcp-server@latest`. For the hosted Atlas server, use the plugin: `claude plugin install mongodb@claude-plugins-official` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory (as "MongoDB Atlas")
- **Source:** `io.github.mongodb-js/mongodb-mcp-server` · https://github.com/mongodb-js/mongodb-mcp-server

### Redis — Redis
- **What:** Natural-language access to Redis data structures, JSON, and search or vector indexes.
- **Use when:** you're inspecting caches, queues or vector data in Redis.
- **Setup (Claude Code):** `claude mcp add --transport stdio redis -- uvx --from redis-mcp-server@latest redis-mcp-server --url redis://localhost:6379/0`
- **Source:** `io.github.redis/mcp-redis` · https://github.com/redis/mcp-redis

### Neo4j — Neo4j
- **What:** The official Neo4j server: reads the graph schema and runs read or write Cypher.
- **Use when:** your data is a property graph, or you want graph-shaped long-term memory.
- **Setup (Claude Code):** first `pip install neo4j-mcp-server`, then `claude mcp add --transport stdio --env NEO4J_MCP_URI=bolt://localhost:7687 --env NEO4J_MCP_USERNAME=neo4j --env NEO4J_MCP_PASSWORD=YOUR_PASSWORD --env NEO4J_MCP_READ_ONLY=true neo4j -- python -m neo4j_mcp_server`
- **Source:** https://github.com/neo4j/mcp · https://neo4j.com/docs/mcp/current/installation/

### Elasticsearch (Agent Builder) — Elastic
- **What:** Kibana Agent Builder's MCP endpoint, which exposes ES|QL and search tools over your indices.
- **Use when:** your logs or documents are in Elasticsearch 9.2+ or Elastic Serverless.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID kibana-mcp https://YOUR_KIBANA_URL/api/agent_builder/mcp` (OAuth on Serverless; otherwise an Elastic API key). The old `elastic/mcp-server-elasticsearch` is deprecated.
- **Source:** https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server

### Qdrant — Qdrant
- **What:** A simple semantic memory with `qdrant-store` and `qdrant-find` tools backed by a Qdrant collection.
- **Use when:** you want vector memory or code search the agent can write to and recall from.
- **Setup (Claude Code):** `claude mcp add code-search -e QDRANT_URL="http://localhost:6333" -e COLLECTION_NAME="code-repository" -e EMBEDDING_MODEL="sentence-transformers/all-MiniLM-L6-v2" -- uvx mcp-server-qdrant`
- **Source:** https://github.com/qdrant/mcp-server-qdrant

### Chroma — Chroma
- **What:** CRUD on Chroma collections and documents, with semantic and full-text queries.
- **Use when:** you need a local or Chroma Cloud vector store for retrieval-augmented work.
- **Setup (Claude Code):** `claude mcp add --transport stdio chroma -- uvx chroma-mcp --client-type persistent --data-dir /abs/path/to/data`
- **Source:** https://github.com/chroma-core/chroma-mcp

### Pinecone — Pinecone
- **What:** Searches Pinecone docs, manages indexes, and upserts and searches records.
- **Use when:** building retrieval-augmented features on Pinecone.
- **Setup (Claude Code):** `claude mcp add-json pinecone-mcp '{"type": "stdio", "command": "npx", "args": ["-y", "@pinecone-database/mcp"], "env": {"PINECONE_API_KEY": "YOUR_API_KEY"}}'` (each Pinecone Assistant also has its own HTTP MCP endpoint).
- **Source:** https://docs.pinecone.io/guides/operations/mcp-server

### ClickHouse — ClickHouse
- **What:** Queries and inspects schemas on ClickHouse Cloud services, or on a self-hosted ClickHouse (read-only by default).
- **Use when:** you need fast analytics on large event tables.
- **Setup (Claude Code):** `claude mcp add --transport http clickhouse-cloud https://mcp.clickhouse.cloud/mcp` (OAuth). For self-hosted: `claude mcp add --transport stdio --env CLICKHOUSE_HOST=YOUR_HOST --env CLICKHOUSE_USER=YOUR_USER --env CLICKHOUSE_PASSWORD=YOUR_PASSWORD clickhouse -- uv run --with mcp-clickhouse --python 3.12 mcp-clickhouse`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.ClickHouse/mcp-clickhouse` · https://clickhouse.com/docs/use-cases/AI/MCP/remote_mcp

### MotherDuck / DuckDB — MotherDuck
- **What:** SQL over local DuckDB files, in-memory DuckDB, or MotherDuck's hosted DuckDB.
- **Use when:** you want ad-hoc analysis of CSV or Parquet files locally, or data shared on MotherDuck.
- **Setup (Claude Code):** remote: `claude mcp add --transport http MotherDuck https://api.motherduck.com/mcp` (OAuth). Local DuckDB: `claude mcp add --scope user duckdb --transport stdio -- uvx mcp-server-motherduck --db-path :memory: --read-write --allow-switch-databases`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.motherduckdb/mcp-server-motherduck` · https://motherduck.com/docs/key-tasks/ai-and-motherduck/mcp-setup/

### Airtable — Airtable
- **What:** Reads and updates Airtable bases, tables, records and schema.
- **Use when:** your team's structured data or lightweight CRM is in Airtable.
- **Setup (Claude Code):** `claude mcp add --transport http airtable https://mcp.airtable.com/mcp` (OAuth or personal access token).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.airtable/mcp` · https://support.airtable.com/docs/using-the-airtable-mcp-server

## Data warehouses, BI & product analytics

### Snowflake — Snowflake
- **What:** An account-hosted MCP server, created with `CREATE MCP SERVER`, that exposes Cortex Search, Cortex Analyst, Agents and SQL as tools.
- **Use when:** you want governed natural-language access to Snowflake data.
- **Skip when:** you're considering Snowflake-Labs/mcp; its README marks it deprecated in favour of this managed server.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret snowflake https://YOUR_ACCOUNT_URL/api/v2/databases/YOUR_DB/schemas/YOUR_SCHEMA/mcp-servers/YOUR_SERVER` (Snowflake OAuth security integration).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp

### BigQuery — Google Cloud
- **What:** Google-managed BigQuery tools to list datasets and tables, read schemas and run SQL.
- **Use when:** you're querying BigQuery with IAM-governed access.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret bigquery https://bigquery.googleapis.com/mcp` (Google OAuth client; roles `roles/mcp.toolUser` and `bigquery.jobUser`).
- **Also in:** Claude.ai / Claude Desktop connector directory (as "Google Cloud BigQuery")
- **Source:** https://docs.cloud.google.com/bigquery/docs/use-bigquery-mcp

### MCP Toolbox for Databases — Google
- **What:** An open-source database server with prebuilt toolsets for BigQuery, AlloyDB, Cloud SQL, Spanner and about 30 more.
- **Use when:** you want one self-hosted server across many Google and OSS databases, or custom SQL tools defined in YAML.
- **Setup (Claude Code):** `claude mcp add --transport stdio --env BIGQUERY_PROJECT=YOUR_PROJECT bigquery-toolbox -- npx -y @toolbox-sdk/server --prebuilt=bigquery --stdio` (uses Google ADC).
- **Source:** `io.github.googleapis/mcp-toolbox` · https://github.com/googleapis/genai-toolbox

### Databricks — Databricks
- **What:** Managed MCP for Genie spaces, Databricks SQL, Vector Search and Unity Catalog functions.
- **Use when:** your lakehouse is Databricks.
- **Setup (Claude Code):** `claude mcp add --transport http --scope user --client-id claude-code --callback-port 3118 databricks-tools "https://YOUR_WORKSPACE_HOSTNAME/ai-gateway/mcp-services/system.ai.dbsql"` (OAuth; an admin enables the Unity AI Gateway beta).
- **Also in:** Claude.ai / Claude Desktop connector directory (as "Databricks Genie")
- **Source:** https://docs.databricks.com/aws/en/ai-gateway/coding-agent-claude

### dbt — dbt Labs
- **What:** dbt's Semantic Layer, Discovery and Admin APIs and SQL (remote), or local dbt CLI run, build, test and lineage.
- **Use when:** you're answering metric questions from governed definitions, or developing dbt models.
- **Setup (Claude Code):** remote: `claude mcp add --transport http dbt https://YOUR_DBT_HOST_URL/api/ai/v1/mcp/` (OAuth). Local: `claude mcp add --transport stdio --env DBT_PROJECT_DIR=/path/to/project --env DBT_PATH=/path/to/dbt dbt -- uvx dbt-mcp`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.getdbt.com/docs/dbt-ai/setup-remote-mcp · https://github.com/dbt-labs/dbt-mcp

### Hex — Hex
- **What:** Searches Hex projects and asks Hex's data agent questions in threads.
- **Use when:** your analysts already model data in Hex notebooks.
- **Setup (Claude Code):** `claude mcp add --transport http hex https://app.hex.tech/mcp` (OAuth; use your own Hex host if you have one).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://learn.hex.tech/docs/administration/mcp-server

### Metabase — Metabase
- **What:** Queries Metabase questions, metrics, models and tables with the signed-in user's permissions.
- **Use when:** your business metrics are curated in Metabase.
- **Setup (Claude Code):** `claude mcp add --transport http metabase https://YOUR_METABASE_URL/api/metabase-mcp` (OAuth with your Metabase login; an admin enables it under Admin > AI > MCP).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.metabase/mcp` · https://www.metabase.com/docs/latest/ai/mcp

### PostHog — PostHog
- **What:** PostHog insights, HogQL queries, feature flags, experiments and error tracking.
- **Use when:** you want to check product usage or flip a feature flag while coding.
- **Setup (Claude Code):** `claude mcp add --transport http posthog https://mcp.posthog.com/mcp -s user` (OAuth; routes to US or EU automatically).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.PostHog/mcp` · https://posthog.com/docs/model-context-protocol/claude-code

### Amplitude — Amplitude
- **What:** Amplitude charts, dashboards, experiments and event taxonomy, plus ad-hoc queries.
- **Use when:** your product analytics are in Amplitude.
- **Setup (Claude Code):** `claude mcp add -t http -s user Amplitude "https://mcp.amplitude.com/mcp"` (OAuth; EU: `mcp.eu.amplitude.com`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.amplitude/mcp-server` · https://amplitude.com/docs/amplitude-ai/amplitude-mcp/claude-code

### Mixpanel — Mixpanel
- **What:** Queries Mixpanel events, funnels, retention and saved reports.
- **Use when:** your product analytics are in Mixpanel.
- **Setup (Claude Code):** `claude mcp add --transport http mixpanel https://mcp.mixpanel.com/mcp` (OAuth; EU: `mcp-eu.mixpanel.com`, IN: `mcp-in.mixpanel.com`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.mixpanel.com/docs/features/mcp

## Docs & reference for coding

### Context7 — Upstash
- **What:** Fetches current, version-specific library docs and code examples on demand.
- **Use when:** working with fast-moving frameworks where training data is stale.
- **Skip when:** you only need Microsoft or Azure docs; Microsoft Learn is authoritative there.
- **Setup (Claude Code):** `claude mcp add --scope user --header "Authorization: Bearer YOUR_API_KEY" --transport http context7 https://mcp.context7.com/mcp` or `claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.upstash/context7` · https://github.com/upstash/context7

### Microsoft Learn — Microsoft
- **What:** Searches and fetches official Microsoft and Azure docs and code samples. No account needed.
- **Use when:** writing .NET, Azure, Microsoft 365 or Windows code.
- **Setup (Claude Code):** `claude mcp add --transport http microsoft-learn https://learn.microsoft.com/api/mcp` (no auth). Microsoft also offers `/plugin install microsoft-docs@claude-plugins-official`.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.microsoft/microsoft-learn-mcp` · https://github.com/MicrosoftDocs/mcp

### DeepWiki — Cognition
- **What:** Answers questions from auto-generated wikis of public GitHub repositories.
- **Use when:** you need to understand an unfamiliar open-source repo's architecture fast.
- **Skip when:** the repo is private; DeepWiki covers public repos only.
- **Setup (Claude Code):** `claude mcp add -s user -t http deepwiki https://mcp.deepwiki.com/mcp` (no auth).
- **Source:** https://docs.devin.ai/work-with-devin/deepwiki-mcp

### Ref — Ref
- **What:** Token-efficient search over API and library docs, including your private docs.
- **Use when:** you want doc lookups that keep context small.
- **Setup (Claude Code):** `claude mcp add --transport http ref https://api.ref.tools/mcp --header "x-ref-api-key: YOUR_API_KEY"`
- **Source:** `tools.ref/ref-tools-mcp` · https://github.com/ref-tools/ref-tools-mcp

### AWS Knowledge — AWS Labs
- **What:** Free, no-auth search of AWS documentation, What's New posts and regional availability.
- **Use when:** you need AWS docs answers without granting account access.
- **Skip when:** you also need to act on resources; use AWS MCP Server, which AWS now recommends.
- **Setup (Claude Code):** `claude mcp add --transport http aws-knowledge https://knowledge-mcp.global.api.aws`
- **Source:** https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server

### Hugging Face — Hugging Face
- **What:** Searches Hub models, datasets, Spaces and papers, and calls Gradio Space tools.
- **Use when:** you're choosing a model or dataset, or running a hosted ML demo as a tool.
- **Setup (Claude Code):** `claude mcp add hf-mcp-server -t http https://huggingface.co/mcp?login` (OAuth) or `claude mcp add hf-mcp-server -t http https://huggingface.co/mcp -H "Authorization: Bearer YOUR_HF_TOKEN"`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `co.huggingface/hf-mcp-server` · https://github.com/huggingface/hf-mcp-server

### Twilio Docs — Twilio
- **What:** Read-only search and retrieval of Twilio API docs and specs. It cannot send messages.
- **Use when:** writing code against Twilio APIs.
- **Setup (Claude Code):** `claude mcp add --transport http twilio-docs https://mcp.twilio.com/docs` (no auth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://www.twilio.com/docs/ai/mcp

## Browser automation & web scraping

### Playwright MCP — Microsoft
- **What:** Drives a real browser through accessibility snapshots: navigate, click, fill forms and take screenshots.
- **Use when:** you're testing your own web app end to end, or automating sites that need clicks.
- **Skip when:** you need performance traces or DevTools-level debugging (use Chrome DevTools MCP), or cloud browsers at scale (use Browserbase).
- **Setup (Claude Code):** `claude mcp add playwright npx @playwright/mcp@latest`
- **Source:** `io.github.microsoft/playwright-mcp` · https://github.com/microsoft/playwright-mcp

### Chrome DevTools MCP — Google (ChromeDevTools)
- **What:** Controls and inspects a live Chrome instance: performance traces, network, console and screenshots.
- **Use when:** you're debugging front-end performance or network issues. It is also the maintained replacement for the archived Puppeteer reference server.
- **Setup (Claude Code):** `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest`
- **Source:** `io.github.ChromeDevTools/chrome-devtools-mcp` · https://github.com/ChromeDevTools/chrome-devtools-mcp

### Browserbase — Browserbase
- **What:** Hosted cloud browsers driven by Stagehand: navigate, act and extract with natural-language steps.
- **Use when:** you need scalable, stealthy remote browsers that keep sessions, rather than a local Chrome.
- **Setup (Claude Code):** `claude mcp add --transport http browserbase "https://mcp.browserbase.com/mcp?browserbaseApiKey=YOUR_BROWSERBASE_API_KEY"` (the key goes in the URL, so keep this out of shared `.mcp.json` files).
- **Source:** `io.github.browserbase/mcp-server-browserbase` · https://docs.browserbase.com/integrations/mcp/setup

### Firecrawl — Firecrawl
- **What:** Scrapes, crawls, maps, searches and extracts structured data from websites as clean markdown.
- **Use when:** you need site-wide crawls or JS-rendered pages turned into LLM-ready text.
- **Skip when:** you need a single static page; the Fetch reference server is enough.
- **Setup (Claude Code):** `claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp --header "Authorization: Bearer YOUR_FIRECRAWL_API_KEY"` (or OAuth at `/v2/mcp-oauth`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.firecrawl/firecrawl-mcp-server` · https://github.com/firecrawl/firecrawl-mcp-server

### Apify — Apify
- **What:** Runs any of thousands of ready-made Apify Store scrapers ("Actors") as tools.
- **Use when:** you need site-specific scraping for maps, e-commerce or social sites without writing a scraper.
- **Setup (Claude Code):** `claude mcp add --transport http apify https://mcp.apify.com` (OAuth, or `Authorization: Bearer YOUR_APIFY_TOKEN`).
- **Source:** `com.apify/apify-mcp-server` · https://docs.apify.com/platform/integrations/mcp

### Bright Data — Bright Data
- **What:** Unblocked scraping, SERP results and a remote browser behind Bright Data's proxy network.
- **Use when:** target sites block ordinary fetchers.
- **Setup (Claude Code):** `claude mcp add --transport http brightdata "https://mcp.brightdata.com/mcp?token=YOUR_API_TOKEN"`
- **Source:** `io.github.brightdata/brightdata-mcp` · https://github.com/brightdata/brightdata-mcp

### Jina AI — Jina AI
- **What:** Jina Reader (URL to markdown), web search, embeddings and reranking.
- **Use when:** you need cheap URL-to-markdown conversion plus search and rerank in one server.
- **Setup (Claude Code):** `claude mcp add -s user --transport http jina https://mcp.jina.ai/v1 --header "Authorization: Bearer YOUR_JINA_API_KEY"` (the key is optional for basic use).
- **Source:** https://github.com/jina-ai/MCP

## Web search & research

### Exa — Exa
- **What:** Neural web search plus code-context search across GitHub, docs and Stack Overflow.
- **Use when:** you're finding high-quality sources or real code examples by meaning, not keywords.
- **Setup (Claude Code):** `claude mcp add --transport http exa https://mcp.exa.ai/mcp --header "x-api-key: YOUR_EXA_API_KEY"` (Exa also ships `claude plugin install exa@claude-plugins-official`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `ai.exa/exa` · https://exa.ai/docs/reference/exa-mcp

### Brave Search — Brave
- **What:** Web, news, image, video and local search from Brave's independent index.
- **Use when:** you want a privacy-respecting general search API with a free tier.
- **Setup (Claude Code):** `claude mcp add --transport stdio --env BRAVE_API_KEY=YOUR_KEY brave-search -- npx -y @brave/brave-search-mcp-server` (replaces the archived reference brave-search server).
- **Source:** `io.github.brave/brave-search-mcp-server` · https://github.com/brave/brave-search-mcp-server

### Tavily — Tavily
- **What:** Search, extract, crawl, map and multi-step research, tuned for agents.
- **Use when:** you want agent-oriented search results with extraction in one call.
- **Setup (Claude Code):** `claude mcp add --transport http tavily https://mcp.tavily.com/mcp` (OAuth via `/mcp`; an API-key URL form also exists).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.tavily-ai/tavily-mcp` · https://github.com/tavily-ai/tavily-mcp

### Perplexity — Perplexity AI
- **What:** Perplexity Sonar search, reasoning and deep-research answers with citations.
- **Use when:** you want a synthesized, cited answer rather than raw links.
- **Setup (Claude Code):** `claude mcp add --transport http perplexity https://api.perplexity.ai/mcp --header "Authorization: Bearer YOUR_API_KEY"` or `claude mcp add perplexity --env PERPLEXITY_API_KEY="YOUR_API_KEY" -- npx -y @perplexity-ai/mcp-server`
- **Source:** `ai.perplexity/mcp-server` · https://github.com/perplexityai/modelcontextprotocol

### Kagi — Kagi
- **What:** Kagi's ad-free search and its Universal Summarizer.
- **Use when:** you already pay for Kagi and want high-signal results.
- **Setup (Claude Code):** `claude mcp add kagi -e KAGI_API_KEY="YOUR_API_KEY" -- uvx kagimcp`
- **Source:** https://github.com/kagisearch/kagimcp

## Integration platforms (one connector, many apps)

### Zapier — Zapier
- **What:** Runs actions across 8,000+ apps through the Zapier actions you enable.
- **Use when:** you need an app that has no official MCP server, or simple cross-app automations.
- **Skip when:** the app has its own official server (Slack, Notion, GitHub and so on), which usually offers richer tools.
- **Setup (Claude Code):** `claude mcp add --transport http "Zapier-MCP" https://mcp.zapier.com/api/v1/connect` (OAuth via `/mcp`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.zapier/mcp` · https://docs.zapier.com/mcp/get-started/connect/claude-code

### Composio Connect — Composio
- **What:** One endpoint to 1,000+ apps through a handful of meta-tools that discover and run actions, with managed OAuth per app.
- **Use when:** you want broad SaaS coverage with on-demand tool discovery instead of loading hundreds of tools. Composio's older "Rube" endpoint is no longer reachable, so use this one.
- **Setup (Claude Code):** `claude mcp add --transport http composio https://connect.composio.dev/mcp` (OAuth). Composio recommends its CLI: `composio setup --target claude`. Or install its Claude Code plugin: `/plugin marketplace add ComposioHQ/composio-plugin-cc`, then `/plugin install composio@composio`.
- **Source:** `io.github.ComposioHQ/composio` · https://docs.composio.dev/docs/composio-connect

### Pipedream — Pipedream
- **What:** 3,000+ APIs and about 10,000 prebuilt tools, with Pipedream handling each app's auth.
- **Use when:** you need many integrations with per-user OAuth, especially when embedding them in your own product (developer endpoint).
- **Setup (Claude Code):** `claude mcp add --transport http pipedream https://mcp.pipedream.net/v2` (OAuth).
- **Source:** https://pipedream.com/docs/connect/mcp/users

### Make — Make
- **What:** Exposes your Make scenarios as callable tools and manages scenarios.
- **Use when:** your automations are already built in Make.
- **Setup (Claude Code):** `claude mcp add --transport http make https://mcp.make.com` (OAuth; a token URL is also supported).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.make/mcp-server` · https://developers.make.com/mcp-server

### n8n — n8n
- **What:** Your n8n instance's built-in MCP server: search, run, inspect and publish workflows.
- **Use when:** you self-host n8n and want the agent to trigger or build workflows.
- **Setup (Claude Code):** `claude mcp add --transport http n8n https://YOUR_N8N_DOMAIN/mcp-server/http` (OAuth or personal access token).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-client-examples

### Activepieces — Activepieces
- **What:** An open-source automation platform whose instance MCP endpoint builds and runs flows and pieces.
- **Use when:** you want an MIT-licensed, self-hostable alternative to Zapier.
- **Setup (Claude Code):** `claude mcp add --transport http activepieces https://YOUR_INSTANCE/mcp` (OAuth).
- **Source:** `io.github.activepieces/activepieces` · https://www.activepieces.com/docs/mcp/overview

## Knowledge, docs & files

### Notion — Notion
- **What:** Searches, reads, creates and updates Notion pages and databases.
- **Use when:** specs, wikis or task databases live in Notion.
- **Setup (Claude Code):** `claude mcp add --transport http notion https://mcp.notion.com/mcp` (OAuth via `/mcp`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.notion/mcp` · https://developers.notion.com/docs/get-started-with-mcp

### Google Drive — Google
- **What:** Searches, reads and creates files in Google Drive.
- **Use when:** you need source docs or sheets from Drive.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret gdrive https://drivemcp.googleapis.com/mcp/v1` (needs your own Google OAuth client and the Developer Preview API enabled; in Claude.ai it is one click).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.google.com/workspace/guides/configure-mcp-servers

### Box — Box
- **What:** Searches and reads Box files and folders, and asks Box AI questions over documents.
- **Use when:** enterprise content is in Box.
- **Setup (Claude Code):** `claude mcp add box --transport http https://mcp.box.com` (OAuth; a Box admin must make the integration available).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developer.box.com/guides/box-mcp/integrations/claude-code

### Dropbox — Dropbox
- **What:** Lists, searches, reads, moves and shares Dropbox files.
- **Use when:** your files live in Dropbox.
- **Setup (Claude Code):** `claude mcp add --transport http DropboxMCP https://mcp.dropbox.com/mcp` (OAuth; beta).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://help.dropbox.com/integrations/connect-dropbox-mcp-server

### Glean — Glean
- **What:** Enterprise search and chat across all connected company apps, plus people and code search.
- **Use when:** your company runs Glean and the answer could be anywhere.
- **Setup (Claude Code):** `/plugin marketplace add gleanwork/claude-plugins`, then `/plugin install glean@glean-plugins`. The endpoint is tenant-specific (`https://YOUR_INSTANCE-be.glean.com/mcp/default`); an admin must enable it.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.glean/mcp` · https://developers.glean.com/guides/mcp/claude-code

### Guru — Guru
- **What:** Searches verified Guru knowledge cards, generates answers and drafts updates.
- **Use when:** support or sales knowledge lives in Guru.
- **Setup (Claude Code):** `claude mcp add --transport http guru https://mcp.api.getguru.com/mcp` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.getguru/mcp-server` · https://help.getguru.com/docs/connecting-gurus-mcp-server-to-claude-desktop

### Granola — Granola
- **What:** Queries your Granola meeting notes and transcripts.
- **Use when:** you need to pull decisions or action items from past meetings.
- **Setup (Claude Code):** `claude mcp add granola --transport http https://mcp.granola.ai/mcp` (OAuth; the free plan is limited).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.granola.ai/help-center/sharing/integrations/mcp

### Fireflies — Fireflies.ai
- **What:** Searches and reads Fireflies meeting transcripts and summaries.
- **Use when:** your calls are recorded by Fireflies.
- **Setup (Claude Code):** `claude mcp add --transport http fireflies https://api.fireflies.ai/mcp` (OAuth or Bearer API key).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `ai.fireflies/fireflies` · https://docs.fireflies.ai/getting-started/mcp-configuration

### Docusign — Docusign
- **What:** Reads Docusign agreements and envelopes and triggers agreement workflows.
- **Use when:** you need to track contract status or start signing workflows.
- **Setup (Claude Code):** `claude mcp add --transport http docusign https://mcp.docusign.com/mcp` (OAuth; an account admin can toggle MCP connections).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.docusign.com/platform/mcp-server/

## Communication, email & calendar

### Slack — Slack
- **What:** Searches Slack messages, channels and users, reads threads, sends messages and creates canvases.
- **Use when:** you need team context from Slack or want to post an update.
- **Setup (Claude Code):** `/plugin install slack@claude-plugins-official` (recommended; it ships the registered Slack app). Manual: `claude mcp add --transport http --scope local slack https://mcp.slack.com/mcp`, which needs your own Slack app client ID. A workspace admin must approve MCP.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.slack.dev/ai/slack-mcp-server/connect-to-harnesses

### Gmail — Google
- **What:** Searches and reads threads, drafts replies and manages labels. It cannot send.
- **Use when:** triaging an inbox or drafting responses with context.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret gmail https://gmailmcp.googleapis.com/mcp/v1` (own Google OAuth client; Developer Preview).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.google.com/workspace/guides/configure-mcp-servers

### Google Calendar — Google
- **What:** Lists, searches, creates and updates events, responds to invites and suggests free times.
- **Use when:** scheduling or summarizing your week.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret gcal https://calendarmcp.googleapis.com/mcp/v1` (own Google OAuth client; Developer Preview).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.google.com/workspace/guides/configure-mcp-servers

### Microsoft 365 — Anthropic (Microsoft data)
- **What:** Read access to SharePoint, OneDrive, Outlook mail and calendar, and Teams chats in a work tenant.
- **Use when:** you're in Claude.ai or Desktop and need company content from Microsoft 365.
- **Skip when:** you're in Claude Code; use Microsoft Work IQ.
- **Setup (Claude Code):** no public Claude Code endpoint is documented. Enable it from the Claude.ai directory; a Global Admin must give one-time Entra consent.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://support.claude.com/en/articles/12542951

### Microsoft Work IQ — Microsoft
- **What:** Microsoft 365 Copilot-grounded queries over your mail, calendar, Teams, files and people.
- **Use when:** you need Microsoft 365 work context inside Claude Code.
- **Setup (Claude Code):** `claude mcp add workiq -- npx -y @microsoft/workiq mcp` (needs an M365 Copilot license and Entra admin consent; public preview).
- **Source:** `com.microsoft/workiq-*` · https://github.com/microsoft/work-iq

### Zoom — Zoom
- **What:** Searches meetings and recordings and reads Zoom meeting assets, docs and Team Chat.
- **Use when:** you need recaps or transcripts from Zoom meetings.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret zoom https://mcp.zoom.us/mcp/zoom/streamable` (needs your own Zoom Marketplace General app; no dynamic client registration).
- **Also in:** Claude.ai / Claude Desktop connector directory (as "Zoom for Claude")
- **Source:** `io.github.zoom/zoom-workspace` · https://developers.zoom.us/docs/mcp/servers/connect-to-zoom-mcp-servers/

### Resend — Resend
- **What:** Sends transactional and broadcast email, and manages domains, contacts and templates.
- **Use when:** your app or agent needs to send email programmatically.
- **Setup (Claude Code):** `claude mcp add --transport http resend https://mcp.resend.com/mcp --header "Authorization: Bearer YOUR_RESEND_API_KEY"` (or `claude plugin install resend@claude-plugins-official`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://resend.com/docs/knowledge-base/mcp-server

## Project & task management

### Asana — Asana
- **What:** Searches and creates Asana tasks, projects, portfolios and goals.
- **Use when:** your team plans work in Asana.
- **Setup (Claude Code):** `claude mcp add --transport http --client-id YOUR_CLIENT_ID --client-secret --callback-port 8080 asana https://mcp.asana.com/v2/mcp` (needs your own Asana OAuth app with redirect `http://localhost:8080/callback`; the old `/sse` URL is retired).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.asana.com/docs/connecting-mcp-clients-to-asanas-v2-server

### monday.com — monday.com
- **What:** Covers monday.com boards, items, updates, dashboards and workflows.
- **Use when:** projects or CRM pipelines are tracked in monday.com.
- **Setup (Claude Code):** `claude mcp add --transport http monday https://mcp.monday.com/mcp` (OAuth; may need an admin to install the MCP app).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.monday/monday.com` · https://developer.monday.com/api-reference/docs/mondaycom-mcp

### ClickUp — ClickUp
- **What:** Searches the ClickUp workspace and manages tasks, docs and comments.
- **Use when:** your team works in ClickUp.
- **Setup (Claude Code):** `claude mcp add --transport http clickup https://mcp.clickup.com/mcp` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developer.clickup.com/docs/connect-an-ai-assistant-to-clickups-mcp-server-1

### Trello — Atlassian
- **What:** Reads and updates Trello boards, lists, cards and checklists, one workspace per connection.
- **Use when:** you're managing lightweight kanban boards.
- **Setup (Claude Code):** `claude mcp add --transport http trello https://mcp.trello.com/v1` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://support.atlassian.com/trello/docs/connect-trello-to-ai-assistants-with-trello-mcp/

### Todoist — Doist
- **What:** Adds, completes and organizes Todoist tasks, projects and sections.
- **Use when:** managing a personal task list.
- **Setup (Claude Code):** `claude mcp add --transport http todoist https://ai.todoist.net/mcp` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `net.todoist/mcp` · https://github.com/Doist/todoist-ai

### Smartsheet — Smartsheet
- **What:** Reads and edits Smartsheet sheets, rows, columns and summaries.
- **Use when:** operations or PMO tracking lives in Smartsheet.
- **Setup (Claude Code):** `claude mcp add --transport http smartsheet-mcp https://mcp.smartsheet.com -H "Authorization:Bearer YOUR_SMARTSHEET_API_TOKEN"` (EU: `mcp.smartsheet.eu`, AU: `mcp.smartsheet.au`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.smartsheet.com/ai-mcp/smartsheet/install-the-smartsheet-mcp-server/connect-claude-code

## CRM, sales & support

### HubSpot — HubSpot
- **What:** HubSpot CRM contacts, companies, deals and tickets, plus marketing analytics.
- **Use when:** you need customer and pipeline context or CRM updates.
- **Setup (Claude Code):** `claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic` (from the Claude Code docs; OAuth via `/mcp`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://code.claude.com/docs/en/mcp · https://developers.hubspot.com/docs/apps/developer-platform/build-apps/integrate-with-the-remote-hubspot-mcp-server

### Salesforce — Salesforce
- **What:** Discovers and runs Salesforce data and actions (SObject query and CRUD) under the user's permissions.
- **Use when:** your CRM is Salesforce and you're in Claude.ai or Desktop.
- **Setup (Claude Code):** no Claude Code endpoint could be verified from Salesforce's docs. An admin must activate Hosted MCP Servers and create an External Client App, then you connect from the Claude.ai directory.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide

### Attio — Attio
- **What:** Searches and updates Attio CRM records, notes, tasks and lists, and reads call recordings.
- **Use when:** you run a modern, data-model-first CRM on Attio.
- **Setup (Claude Code):** `claude mcp add --transport http attio https://mcp.attio.com/mcp` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.attio.com/mcp/overview

### Apollo.io — Apollo.io
- **What:** People and company search, enrichment, job-posting signals and outreach sequences.
- **Use when:** you're prospecting or enriching leads.
- **Setup (Claude Code):** `claude mcp add --transport http apollo https://mcp.apollo.io/mcp` (OAuth; uses credits).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.apolloio/apollo-mcp` · https://github.com/apolloio/apollo-mcp-plugin

### ZoomInfo — ZoomInfo
- **What:** Verified B2B contact and company search, enrichment and intent signals.
- **Use when:** your sales team licenses ZoomInfo.
- **Setup (Claude Code):** `claude mcp add --transport http zoominfo https://mcp.zoominfo.com/mcp` (OAuth; needs a license and admin enablement).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.Zoominfo/zoominfo-mcp` · https://docs.gtm.ai/docs/connect-to-zoominfo-mcp

### Intercom — Intercom
- **What:** Searches and reads Intercom conversations, tickets and contacts.
- **Use when:** you're analyzing support conversations or looking up a customer's history.
- **Setup (Claude Code):** `claude mcp add --transport http intercom https://mcp.intercom.com/mcp` (OAuth; EU: `mcp.eu.intercom.com`).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.intercom.com/docs/guides/mcp

## Design, diagrams & sites

### Figma — Figma
- **What:** Pulls design context, screenshots, variables and Code Connect mappings from Figma frames, and generates FigJam diagrams.
- **Use when:** you're turning a Figma design into code, or checking an implementation against a design.
- **Setup (Claude Code):** `claude mcp add --transport http figma https://mcp.figma.com/mcp` (OAuth) or `claude plugin install figma@claude-plugins-official`. For the desktop app (selection-based, paid Dev or Full seat): `claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.figma.mcp/mcp` · https://developers.figma.com/docs/figma-mcp-server/remote-server-installation

### Canva — Canva
- **What:** Searches, creates, autofills, edits and exports Canva designs.
- **Use when:** making marketing graphics or presentations from a brief.
- **Setup (Claude Code):** `claude mcp add --transport http canva https://mcp.canva.com/mcp` (OAuth; Canva may restrict unregistered clients). For Canva app development: `claude mcp add canva-dev -- npx -y @canva/cli@latest mcp`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.canva.mcp/mcp` · https://www.canva.dev/docs/apps/dev-mcp-server/

### Miro — Miro
- **What:** Reads and creates content on Miro boards: diagrams, docs, tables and sticky notes.
- **Use when:** you're turning workshop boards into specs, or diagrams into code.
- **Setup (Claude Code):** `claude plugin install miro@claude-plugins-official` or `claude mcp add --transport http miro https://mcp.miro.com` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.miroapp/mcp-server` · https://developers.miro.com/docs/miro-mcp

### Lucid — Lucid
- **What:** Searches Lucid documents and creates diagrams, org charts, mind maps and sequence diagrams.
- **Use when:** you need polished architecture or process diagrams in Lucidchart.
- **Setup (Claude Code):** `claude mcp add --transport http lucid https://mcp.lucid.app/mcp` (OAuth; a Team or Enterprise admin must enable it).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `app.lucid.mcp/lucid` · https://help.lucid.co/hc/en-us/articles/42578801807508

### Gamma — Gamma
- **What:** Generates presentations, documents, social posts and sites from a prompt.
- **Use when:** you need a fast, styled deck or one-pager.
- **Setup (Claude Code):** `claude mcp add --transport http gamma https://mcp.gamma.app/mcp` (OAuth; Gamma may require client registration first).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.gamma.app/mcp/gamma-mcp-server

### Webflow — Webflow
- **What:** Builds and edits Webflow pages, CMS collections, styles and components, and works on the Designer canvas.
- **Use when:** your marketing site runs on Webflow.
- **Setup (Claude Code):** `claude mcp add --transport http webflow https://mcp.webflow.com/mcp` (OAuth; install the MCP Bridge App in the Designer).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.webflow/mcp` · https://developers.webflow.com/mcp/installing/claude-code

### Wix — Wix
- **What:** Searches Wix docs and manages Wix sites, apps and business data through Wix APIs.
- **Use when:** you're building or running a Wix site or app.
- **Setup (Claude Code):** `claude mcp add --transport http wix-mcp-remote https://mcp.wix.com/mcp` (Wix login via OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.wix/mcp` · https://dev.wix.com/docs/api-reference/articles/ai-tools/wix-mcp/about-the-wix-mcp

## Marketing & SEO

### Ahrefs — Ahrefs
- **What:** Backlinks, keyword, site-explorer and AI-search (Brand Radar) data.
- **Use when:** you're doing SEO audits, competitor research or keyword planning.
- **Setup (Claude Code):** `claude mcp add ahrefs https://api.ahrefs.com/mcp/mcp -t http` (OAuth; Lite plan or higher).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.ahrefs.com/mcp/docs/introduction

### Semrush — Semrush
- **What:** Keyword, domain, backlink, traffic and competitor research reports.
- **Use when:** your SEO and PPC research runs on Semrush.
- **Setup (Claude Code):** `claude mcp add semrush https://mcp.semrush.com/v2/mcp -t http` (OAuth 2.1; needs a plan with API units).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developer.semrush.com/api/basics/semrush-mcp/

### Similarweb — Similarweb
- **What:** Website and app traffic, engagement, referral and audience intelligence.
- **Use when:** you're sizing competitors or markets by digital traffic.
- **Setup (Claude Code):** `claude mcp add --transport http similarweb https://mcp.similarweb.com --header "api-key: YOUR_SIMILARWEB_API_KEY"` (needs an API-enabled plan).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.similarweb.com/docs/claude-mcp-integration

### Klaviyo — Klaviyo
- **What:** Klaviyo campaigns, flows, profiles, catalogs and performance metrics.
- **Use when:** you're running e-commerce email and SMS marketing on Klaviyo.
- **Setup (Claude Code):** `claude mcp add --transport http klaviyo https://mcp.klaviyo.com/mcp` (OAuth; Owner, Admin or Manager role).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developers.klaviyo.com/en/docs/connect_to_the_klaviyo_mcp_server

## Media generation & assets

### ElevenLabs — ElevenLabs
- **What:** Hosted server for building and managing ElevenLabs voice agents and their knowledge bases.
- **Use when:** you're configuring conversational voice agents.
- **Setup (Claude Code):** `claude mcp add --transport http elevenlabs https://api.elevenlabs.io/v1/mcp` (OAuth). The local `elevenlabs-mcp` PyPI package is deprecated.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.elevenlabs/mcp` · https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp

### Cloudinary — Cloudinary
- **What:** Uploads, transforms, searches and tags images and videos in Cloudinary.
- **Use when:** managing a media library or generating transformed asset URLs.
- **Setup (Claude Code):** `claude mcp add --transport sse cloudinary-asset-mgmt https://asset-management.mcp.cloudinary.com/mcp` (as Cloudinary documents it; OAuth). Separate servers cover config, metadata and analysis.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.cloudinary/asset-management-mcp` · https://cloudinary.com/documentation/cloudinary_llm_mcp

### Replicate — Replicate
- **What:** Searches and runs any public model on Replicate for image, video, audio or LLM work.
- **Use when:** you want access to thousands of open models through one API.
- **Setup (Claude Code):** `claude mcp add replicate https://mcp.replicate.com/sse --transport sse --scope user` (web sign-in via `/mcp`).
- **Source:** https://replicate.com/docs/reference/mcp

### fal — fal
- **What:** Fast image, video and audio generation across fal's hosted models.
- **Use when:** you need low-latency generative media, such as Flux or video models.
- **Setup (Claude Code):** `claude mcp add --transport http fal https://mcp.fal.ai/mcp-relay` (OAuth).
- **Source:** https://fal.ai/docs/model-apis/mcp

### HeyGen — HeyGen
- **What:** Generates avatar and presenter videos from scripts.
- **Use when:** you're making talking-head explainer or marketing videos.
- **Setup (Claude Code):** `claude mcp add --transport http heygen https://mcp.heygen.com/mcp/v1/` (OAuth; Web plan).
- **Source:** https://www.heygen.com/model-context-protocol

### Runway — Runway
- **What:** Video and image generation with Runway's models.
- **Use when:** you need cinematic generative video.
- **Setup (Claude Code):** `claude mcp add --transport http runway https://mcp.runwayml.com/mcp` (OAuth). For API developers, the Dev MCP is `https://dev.runwayml.com/mcp`.
- **Source:** https://docs.dev.runwayml.com/guides/mcp/

### Mux — Mux
- **What:** Covers Mux video assets, live streams and playback data.
- **Use when:** your app hosts or streams video on Mux.
- **Setup (Claude Code):** `claude mcp add --transport http mux https://mcp.mux.com` (OAuth; Basic auth with a token ID and secret also works).
- **Source:** `com.mux/mcp` · https://www.mux.com/docs/integrations/mcp-server

### Descript — Descript
- **What:** Imports media into Descript and edits projects by prompt through Underlord.
- **Use when:** you're editing podcasts or talking-head videos by transcript.
- **Setup (Claude Code):** `claude mcp add --transport http descript https://api.descript.com/v2/mcp` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://help.descript.com/api-and-mcp/mcp-custom

## Payments & commerce

### Stripe — Stripe
- **What:** Reads and writes Stripe objects (customers, payments, subscriptions and more) and searches Stripe docs.
- **Use when:** building a Stripe integration or answering billing questions.
- **Setup (Claude Code):** `claude mcp add --transport http stripe https://mcp.stripe.com` (OAuth via `/mcp`, or a Bearer agent API key; plain secret keys stop working after 30 Nov 2026).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.stripe/mcp` · https://docs.stripe.com/mcp

### PayPal — PayPal
- **What:** PayPal invoices, orders, products, subscriptions, disputes and transaction reports.
- **Use when:** your business takes payments through PayPal.
- **Setup (Claude Code):** `claude mcp add --transport http paypal https://mcp.paypal.com/http` (login via OAuth; sandbox: `https://mcp.sandbox.paypal.com/http`). The registry lists `/mcp` for the same host.
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `com.paypal.mcp/mcp` · https://developer.paypal.com/tools/mcp-server/

### Square — Square
- **What:** The Square API surface: payments, catalog, customers, orders and merchant data.
- **Use when:** you're running in-person or online sales on Square.
- **Setup (Claude Code):** `claude mcp add --transport http square https://mcp.squareup.com/mcp` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developer.squareup.com/docs/mcp

### Shopify Dev MCP — Shopify
- **What:** Searches Shopify docs and introspects and validates Admin and Storefront GraphQL. It does not touch store data.
- **Use when:** you're building Shopify apps or themes.
- **Skip when:** you want to manage a live store's products and orders; enable the Shopify connector in the Claude.ai directory.
- **Setup (Claude Code):** `claude mcp add --transport stdio shopify-dev-mcp -- npx -y @shopify/dev-mcp@latest`
- **Also in:** Claude.ai / Claude Desktop connector directory (store-management connector)
- **Source:** https://shopify.dev/docs/apps/build/ai-toolkit

### Plaid Developer Tools — Plaid
- **What:** Production diagnostics for a Plaid integration: debug Items, view Link analytics and check usage.
- **Use when:** you're troubleshooting a fintech app built on Plaid.
- **Setup (Claude Code):** `claude mcp add --transport http plaid https://api.dashboard.plaid.com/mcp/ --header "Authorization: Bearer YOUR_ACCESS_TOKEN"` (the token comes from client_credentials with scope `mcp:dashboard` and expires in 15 minutes).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://plaid.com/docs/resources/mcp/

## Finance, accounting & market data

### QuickBooks Online — Intuit
- **What:** CRUD on QuickBooks Online entities (invoices, bills, customers and more) and financial reports.
- **Use when:** you're automating bookkeeping on QBO.
- **Setup (Claude Code):** build `intuit/quickbooks-online-mcp-server`, then `claude mcp add --transport stdio --env QUICKBOOKS_CLIENT_ID=YOUR_ID --env QUICKBOOKS_CLIENT_SECRET=YOUR_SECRET --env QUICKBOOKS_REFRESH_TOKEN=YOUR_TOKEN --env QUICKBOOKS_REALM_ID=YOUR_REALM --env QUICKBOOKS_ENVIRONMENT=sandbox quickbooks -- node /path/to/dist/index.js`
- **Also in:** Claude.ai / Claude Desktop connector directory (as "Intuit QuickBooks")
- **Source:** https://github.com/intuit/quickbooks-online-mcp-server

### Xero — Xero
- **What:** Xero accounting data: contacts, invoices, P&L, balance sheet and payroll.
- **Use when:** your books are in Xero.
- **Setup (Claude Code):** `claude mcp add --transport stdio --env XERO_CLIENT_ID=YOUR_ID --env XERO_CLIENT_SECRET=YOUR_SECRET xero -- npx -y @xeroapi/xero-mcp-server@latest`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://github.com/XeroAPI/xero-mcp-server

### Ramp — Ramp
- **What:** Ramp spend, cards, limits, bills and purchase orders, as the signed-in user.
- **Use when:** you're analyzing corporate spend on Ramp.
- **Setup (Claude Code):** `claude mcp add --transport http ramp https://mcp.ramp.com/mcp` (OAuth; custom clients may need their redirect URI allowlisted).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://agents.ramp.com/docs/guides/connecting

### Mercury — Mercury
- **What:** Mercury bank accounts, transactions, statements and recipients, plus approval-gated transfers (beta).
- **Use when:** you're doing startup banking analysis on Mercury.
- **Setup (Claude Code):** `claude mcp add --transport http -s user mercury https://mcp.mercury.com/mcp`, then `claude mcp login mercury`
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.mercury.com/docs/connecting-mercury-mcp

### Brex — Brex
- **What:** Brex expenses, cards, limits, users and reimbursements (beta).
- **Use when:** you're on Brex corporate cards.
- **Setup (Claude Code):** `claude mcp add --transport http brex https://api.brex.com/mcp` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://developer.brex.com/docs/mcp

### Alpha Vantage — Alpha Vantage
- **What:** Stock, options, FX, crypto, fundamentals, earnings and technical indicators.
- **Use when:** you need broad market data with a free tier.
- **Setup (Claude Code):** `claude mcp add --transport http alphavantage https://mcp.alphavantage.co/mcp` (OAuth page asks for your API key).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** `io.github.alphavantage/alpha_vantage_mcp` · https://github.com/alphavantage/alpha_vantage_mcp

### Financial Datasets — Financial Datasets
- **What:** Company financial statements, filings, prices, earnings and ownership data.
- **Use when:** you're doing fundamental analysis on US equities.
- **Setup (Claude Code):** `claude mcp add --transport http financial-datasets https://mcp.financialdatasets.ai/` (OAuth).
- **Also in:** Claude.ai / Claude Desktop connector directory
- **Source:** https://docs.financialdatasets.ai/mcp-server

### Massive (formerly Polygon.io) — Massive
- **What:** Real-time and historical market data for stocks, options, FX and crypto.
- **Use when:** you need tick-level or aggregate market data from a Polygon/Massive plan.
- **Setup (Claude Code):** `claude mcp add --transport http massive https://mcp.massive.com/` (OAuth).
- **Source:** https://massive.com/docs/ai-tools/clients/claude-code

### Coinbase for Agents — Coinbase
- **What:** Coinbase portfolios plus live trading of spot, futures and equities, and x402 payments.
- **Use when:** the user explicitly wants an agent to act on their Coinbase account. It moves real money.
- **Setup (Claude Code):** `claude mcp add coinbase --transport http https://agents.coinbase.com/mcp` (Coinbase OAuth; allowlisted clients).
- **Source:** https://docs.cdp.coinbase.com/ai-agents/coinbase-for-agents/coinbase-mcp

### Alpaca — Alpaca
- **What:** Brokerage trading (paper or live) and market data through the Alpaca API.
- **Use when:** you're testing trading strategies with a paper account.
- **Setup (Claude Code):** `claude mcp add --transport stdio --scope user --env ALPACA_API_KEY=YOUR_KEY --env ALPACA_SECRET_KEY=YOUR_SECRET alpaca -- uvx alpaca-mcp-server`
- **Source:** https://github.com/alpacahq/alpaca-mcp-server

## Files, memory & reasoning (MCP reference servers)

### Filesystem — Model Context Protocol
- **What:** Sandboxed read, write, search and edit of files under directories you allow.
- **Use when:** Claude Desktop or another client needs controlled local file access.
- **Skip when:** you're already in Claude Code, which has built-in file tools.
- **Setup (Claude Code):** `claude mcp add --transport stdio filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/dir`
- **Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

### Fetch — Model Context Protocol
- **What:** Fetches a URL and returns it as markdown, with chunked reading.
- **Use when:** you need simple single-page retrieval in clients without built-in web fetch.
- **Skip when:** pages are JS-heavy or need crawling; use Firecrawl or Playwright.
- **Setup (Claude Code):** `claude mcp add --transport stdio fetch -- uvx mcp-server-fetch`
- **Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/fetch

### Memory — Model Context Protocol
- **What:** A persistent knowledge-graph memory of entities, relations and observations stored in a local file.
- **Use when:** you want facts remembered across sessions without a database.
- **Skip when:** you need semantic vector recall; use Qdrant or Chroma.
- **Setup (Claude Code):** `claude mcp add --transport stdio memory -- npx -y @modelcontextprotocol/server-memory`
- **Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/memory

### Sequential Thinking — Model Context Protocol
- **What:** A structured scratchpad tool for step-by-step reasoning that can branch and revise.
- **Use when:** a model without extended thinking needs explicit multi-step planning.
- **Setup (Claude Code):** `claude mcp add --transport stdio sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking`
- **Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking

### Git — Model Context Protocol
- **What:** Reads and operates on a local git repo: status, diff, log, branch and commit.
- **Use when:** a client without shell access needs git operations.
- **Skip when:** you're in Claude Code, which already runs git through Bash.
- **Setup (Claude Code):** `claude mcp add --transport stdio git -- uvx mcp-server-git --repository /path/to/repo`
- **Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/git

### Time — Model Context Protocol
- **What:** Gets the current time and converts between IANA time zones.
- **Use when:** scheduling across time zones in clients with no clock tool.
- **Setup (Claude Code):** `claude mcp add --transport stdio time -- uvx mcp-server-time`
- **Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/time

### Everything — Model Context Protocol
- **What:** A test server that exercises every MCP feature: tools, resources, prompts, sampling and more.
- **Use when:** you're developing or debugging an MCP client.
- **Setup (Claude Code):** `claude mcp add --transport stdio everything -- npx -y @modelcontextprotocol/server-everything`
- **Source:** https://github.com/modelcontextprotocol/servers/tree/main/src/everything

> Archived reference servers (Puppeteer, Brave Search, GitHub, GitLab, Google Drive, PostgreSQL, Redis, Sentry, Slack, SQLite and others in `modelcontextprotocol/servers-archived`) get no security fixes. Prefer the vendor servers listed above.
