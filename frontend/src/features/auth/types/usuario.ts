export interface Usuario {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: "user" | "admin";
  disabled: boolean;
  created_at: string;
}

export interface Registro {
  username: string;
  full_name: string;
  email: string;
  password: string;
}
