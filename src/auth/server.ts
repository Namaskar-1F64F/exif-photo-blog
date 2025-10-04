import NextAuth, { type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isPathProtected } from "@/app/path";

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth,
} = NextAuth({
	providers: [
		Credentials({
			async authorize({ email, password }) {
				console.log("Attempting to authorize user:", {
					email,
					password,
					adminEmail: process.env.ADMIN_EMAIL,
					adminPassword: process.env.ADMIN_PASSWORD,
				});
				if (
					process.env.ADMIN_EMAIL &&
					process.env.ADMIN_EMAIL === email &&
					process.env.ADMIN_PASSWORD &&
					process.env.ADMIN_PASSWORD === password
				) {
					const user: User = { email, name: "Admin User" };
					return user;
				} else {
					return null;
				}
			},
		}),
	],
	callbacks: {
		authorized({ auth, request }) {
			const { pathname } = request.nextUrl;

			const isUrlProtected = isPathProtected(pathname);
			const isUserLoggedIn = !!auth?.user;
			const isRequestAuthorized = !isUrlProtected || isUserLoggedIn;
			console.log("Attempting to authorize user 2:", {
				isUrlProtected,
				isUserLoggedIn,
				isRequestAuthorized,
			});
			return isRequestAuthorized;
		},
	},
	pages: {
		signIn: "/sign-in",
	},
});

export const runAuthenticatedAdminServerAction = async <T>(
	callback: () => T,
): Promise<T> => {
	const session = await auth();
	if (session?.user) {
		return callback();
	} else {
		throw new Error("Unauthorized server action request");
	}
};
