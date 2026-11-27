# mmo-cr-internal-admin-frontend

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_mmo-cr-internal-admin-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_mmo-cr-internal-admin-frontend)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_mmo-cr-internal-admin-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_mmo-cr-internal-admin-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_mmo-cr-internal-admin-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_mmo-cr-internal-admin-frontend)

Core delivery platform Node.js Frontend Template.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Server-side Caching](#server-side-caching)
- [Redis](#redis)
- [Web Administration Portal UI (walkthrough)](#web-administration-portal-ui-walkthrough)
- [Local Development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd mmo-cr-internal-admin-frontend
nvm use
```

## Server-side Caching

We use Catbox for server-side caching. By default the service will use CatboxRedis when deployed and CatboxMemory for
local development.
You can override the default behaviour by setting the `SESSION_CACHE_ENGINE` environment variable to either `redis` or
`memory`.

Please note: CatboxMemory (`memory`) is _not_ suitable for production use! The cache will not be shared between each
instance of the service and it will not persist between restarts.

## Redis

Redis is an in-memory key-value store. Every instance of a service has access to the same Redis key-value store similar
to how services might have a database (or MongoDB). All frontend services are given access to a namespaced prefixed that
matches the service name. e.g. `my-service` will have access to everything in Redis that is prefixed with `my-service`.

If your service does not require a session cache to be shared between instances or if you don't require Redis, you can
disable setting `SESSION_CACHE_ENGINE=false` or changing the default value in `src/config/index.js`.

## Proxy

We are using forward-proxy which is set up by default. Services are automatically configured with the proxy environment variables when deployed.

Node.js 24 uses these variables to route outbound HTTP(S) requests through the proxy:

NODE_USE_ENV_PROXY=1
HTTPS_PROXY=...
NO_PROXY=...

No additional proxy configuration is required in the service.

## Web Administration Portal UI (walkthrough)

The admin UI is being built section by section from
[the implementation brief](design/plans/admin-ui-implementation-brief.md) and the
screenshots in [`design/admin-screens/`](design/admin-screens/). It uses mock data
and a mock sign-in ([ADR 0001](docs/adr/0001-mock-sign-in-and-session-mock-data.md)).

- Start the app (`npm run dev`) and sign in at `/sign-in` with any email address and
  password. Use `PORT=3001 npm run dev` if port 3000 is already in use.
- Implemented: sign in and out, portal home, the **Users** section (list with
  search, filters and pagination, create, confirmation, profile tabs, amend,
  deactivate, add or remove a vessel, notes), the **Vessels** section (list with
  search, filters, pagination and CSV export, vessel profile with Users, Fishing
  trips, History and Notes tabs, add or remove a user) and the **Fishing trips**
  section (list with search, date range and other filters, trip details with Catch
  breakdown, History and Notes tabs, original and amended versions, version history)
  and the **Trip breakdown** page (catch by species with search, filters, pagination
  and CSV export) and the **Audit log** (search, date, staff member and record type
  filters, with links to the user, vessel or trip) and **Banner message** (view and
  update the service message).
- The trip details layout **Archive** page lists the earlier layout options; each
  opens the current trip details page, as the archived variants are not built.
  **Option 1** opens the example trip in layout A (as-is) with its Pots and Trammel net gears only. Trip details pages otherwise show Vessel and User tabs, as in the prototype.
  **Option 2 (two-column information)** shows trip details and record status side by side (`?layout=two-column`).
- Role-based access follows the prototype
  (`src/server/common/helpers/admin-auth/permissions.js`): navigation, actions and
  pages are limited by role, and blocked pages redirect to Users. Switch roles with
  `/role-preview/{role-key}` (for example `/role-preview/full-ops`).
- List pages remember their search, filters and page, so "Back to ..." links from
  a user, vessel or trip return to the same results.
- Deactivated users can be reactivated from their profile (their previous status is
  restored).
- Amend catch recording, Download PDF and Access catch recording show a "not
  available yet" page: they have no destination in the prototype yet.
- Seed data: `src/server/common/mock-data/admin/`. Changes are kept in your session.
  Select **Clear data** in the portal home footer to reset them.

## Local Development

### Setup

Install application dependencies:

```bash
npm install
```

### Git hooks

Install git hooks (optional)

```bash
npm run git:hooks
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json)
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## Docker

### Development image

> [!TIP]
> For Apple Silicon users, you may need to add `--platform linux/amd64` to the `docker run` command to ensure
> compatibility fEx: `docker build --platform=linux/arm64 --no-cache --tag mmo-cr-internal-admin-frontend`

Build:

```bash
docker build --target development --no-cache --tag mmo-cr-internal-admin-frontend:development .
```

Run:

```bash
docker run -p 3000:3000 mmo-cr-internal-admin-frontend:development
```

### Production image

Build:

```bash
docker build --no-cache --tag mmo-cr-internal-admin-frontend .
```

Run:

```bash
docker run -p 3000:3000 mmo-cr-internal-admin-frontend
```

### Docker Compose

A local environment with:

- Floci (replacing Localstack) for AWS services (S3, SQS)
- Redis
- MongoDB
- This service.
- A commented out backend example.

```bash
docker compose up --build -d
```

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties).

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
