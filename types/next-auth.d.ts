import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      locale: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      image?: string | null;
    };
  }

  interface User {
    locale?: string;
    phone?: string | null;
  }

  interface JWT {
    id?: string;
    locale?: string;
    phone?: string | null;
  }
}
