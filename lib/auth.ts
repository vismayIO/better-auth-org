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
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  appName: "Better Auth Demo",
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
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
