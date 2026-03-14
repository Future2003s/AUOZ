"use client";

import { AccountsView } from "./components/AccountsView";
import { useUsers } from "./hooks/useUsers";

export default function AccountsPage() {
  const usersHook = useUsers();
  return <AccountsView {...usersHook} />;
}
