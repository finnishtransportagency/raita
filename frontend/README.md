This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

The application is served in http://localhost:3000/reports

Note: all commands should be run on the frontend directory and not the project root.

## Api

The recommended way is to redirect api requests to a backend running in the cloud dev environment. This can be done by using the bastion host pipe. The api requests can be routed to a port locally using the following environment variables

- DEV_RAITA_API_BASEURL
- DEV_RAITA_API_KEY

For example to route to a local pipe on port 3001

```bash
DEV_RAITA_API_BASEURL=http://localhost:3001/api DEV_RAITA_API_KEY=<apikey> npm run dev
```

## Middleware

The middleware.ts file is is only used for redirecting api requests in the local dev environment.

## Tests

Run the unit tests using

```bash
npm run test
```

## GraphQL

Whenever GraphQL query definitions are changed in frontend/shared/graphql/queries, run `npm run graphql:codegen` to update typescript type definitions

# Production build

```bash
npm run build
```
