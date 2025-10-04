import { isPathProtected, isPathAdmin } from '@/app/path';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface User {
    role?: 'admin' | 'viewer';
  }
}

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      async authorize({ email, password }) {
        // Admin login
        if (
          process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email &&
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password
        ) {
          const user: User = { email, name: 'Admin User', role: 'admin' };
          return user;
        }
        // Viewer login
        else if (
          process.env.VIEWER_EMAIL && process.env.VIEWER_EMAIL === email &&
          process.env.VIEWER_PASSWORD === password
        ) {
          const user: User = { email, name: 'Viewer User', role: 'viewer' };
          return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as 'admin' | 'viewer' | undefined;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isUrlProtected = isPathProtected(pathname);
      const isAdminPath = isPathAdmin(pathname);
      const user = auth?.user;

      // Admin paths require admin role
      if (isAdminPath) {
        return user?.role === 'admin';
      }

      // Protected paths require at least viewer role
      if (isUrlProtected) {
        return user?.role === 'admin' || user?.role === 'viewer';
      }

      // Public paths allow anyone
      return true;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});

export const runAuthenticatedAdminServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user?.role === 'admin') {
    return callback();
  } else {
    throw new Error('Unauthorized admin action request');
  }
};

export const runAuthenticatedViewerServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user?.role === 'admin' || session?.user?.role === 'viewer') {
    return callback();
  } else {
    throw new Error('Unauthorized viewer action request');
  }
};
