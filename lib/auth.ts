import { dash } from "@better-auth/dash";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  bearer,
  customSession,
  jwt,
  multiSession,
  oneTap,
  organization,
} from "better-auth/plugins";
import { MysqlDialect } from "kysely";
import { createPool } from "mysql2/promise";

const dialect = (() => {
  if (process.env.USE_MYSQL) {
    if (!process.env.MYSQL_DATABASE_URL) {
      throw new Error(
        "Using MySQL dialect without MYSQL_DATABASE_URL. Please set it in your environment variables.",
      );
    }
    return new MysqlDialect(createPool(process.env.MYSQL_DATABASE_URL || ""));
  } else {
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      return new LibsqlDialect({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    }
  }
  return null;
})();

if (!dialect) {
  throw new Error("No dialect found");
}

export const auth = betterAuth({
  appName: "Better Auth Demo",
  database: {
    dialect,
    type: "sqlite",
  },
  emailVerification: {},
  account: {
    accountLinking: {
      trustedProviders: ["email-password"],
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization(),
    bearer(),
    admin(),
    multiSession(),
    nextCookies(),
    oneTap(),
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL,
      },
    }),
    customSession(async ({ user, session }) => {
      return {
        user: {
          ...user,
          customField: "customField",
        },
        session,
      };
    }),
    dash(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
export type OrganizationRole = ActiveOrganization["members"][number]["role"];
export type Invitation = typeof auth.$Infer.Invitation;
export type DeviceSession = Awaited<
  ReturnType<typeof auth.api.listDeviceSessions>
>[number];

export async function getAllDeviceSessions(
  headers: Headers,
): Promise<unknown[]> {
  return await auth.api.listDeviceSessions({
    headers,
  });
}

export async function getAllUserOrganizations(
  headers: Headers,
): Promise<unknown[]> {
  return await auth.api.listOrganizations({
    headers,
  });
}
