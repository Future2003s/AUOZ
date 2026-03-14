export type User = {
  id: string;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "ADMIN" | "CUSTOMER" | "SELLER" | "EMPLOYEE";
  status: "ACTIVE" | "DISABLED";
  loginAttempts?: number;
};
