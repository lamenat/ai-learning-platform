import { getCurrentUser } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <NavbarClient
      user={
        user
          ? { id: user.id, name: user.name, role: user.role }
          : null
      }
    />
  );
}