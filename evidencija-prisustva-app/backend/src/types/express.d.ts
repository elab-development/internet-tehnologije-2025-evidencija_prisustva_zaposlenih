export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "ADMIN" | "EMPLOYEE";
        roleId?: string;
        employeeType?: "PROFESSOR" | "ASSISTANT";
      };
    }
  }
}