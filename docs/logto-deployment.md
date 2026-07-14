# Logto deployment

## Logto Console

Create a **Traditional web** application for the Next.js frontend.

- Redirect URI: `https://mulandance.ca/callback`
- Post sign-out redirect URI: `https://mulandance.ca/`
- Enable the `email` user scope.
- Enable Account Center if profile, password, MFA, or session management links are used.

Create a global API resource. Its resource indicator must exactly match
`LOGTO_API_RESOURCE`; the recommended value is `https://api.mulandance.ca`.
Application business permissions remain in the Mulan database rather than Logto RBAC.

## Docker environment

```env
LOGTO_ENDPOINT=https://login.mulandance.ca
LOGTO_APP_ID=<traditional-web-app-id>
LOGTO_APP_SECRET=<traditional-web-app-secret>
LOGTO_COOKIE_SECRET=<random-value-at-least-32-characters>
LOGTO_API_RESOURCE=https://api.mulandance.ca
LOGTO_SESSION_ASSERTION_SECRET=<different-random-value-at-least-32-characters>
NEXT_PUBLIC_APP_URL=https://mulandance.ca
NEXT_PUBLIC_LOGTO_ENDPOINT=https://login.mulandance.ca
```

The backend container must not be exposed directly to browsers. `/api/*` must be
routed to the Next.js frontend so its BFF can attach the Logto access token.

## Initial super administrator

Find the Logto user ID (`sub`) for the existing super administrator and set these
variables for the first deployment only:

```env
LOGTO_BOOTSTRAP_SUPER_ADMIN_EMAIL=admin@example.com
LOGTO_BOOTSTRAP_SUPER_ADMIN_SUB=<logto-user-id>
```

After a successful login, remove both bootstrap variables and redeploy. A different
subject can never overwrite an existing super-admin binding.

## Existing accounts

- Roles and permissions are not migrated or rewritten.
- Existing accounts do not receive an `account_type` automatically.
- A verified teacher with `account_type=teacher` binds automatically by email.
- An existing untyped administrator creates a binding request. The super
  administrator approves it in **System > Account management** and selects Teacher
  or Staff administrator.
- Unknown email addresses are not provisioned in this release.

Back up the SQLite data volume before first deployment. Startup adds the new Logto
columns and binding tables idempotently; it does not rewrite existing role,
permission, faculty, schedule, pricing, or content records.

## Local development without Logto

Local development may use an explicit signed development identity. Configure the
same `DEV_AUTH_EMAIL` and 32+ character `DEV_AUTH_SECRET` in `backend/.env` and
`frontend/.env.local`, with `DEV_AUTH_BYPASS=true`. The backend additionally requires
`ENVIRONMENT=development`, and the frontend requires `NODE_ENV=development`.
Production Docker sets `ENVIRONMENT=production` and `NODE_ENV=production`, so this
identity cannot be accepted by a production build.
