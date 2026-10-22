import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../LoginPage";
import RegisterPage from "../RegisterPage";
import { authApi } from "@/services/auth";

vi.mock("@/services/auth", () => ({
  authApi: {
    login: vi.fn(),
    signup: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Auth Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LoginPage", () => {
    it("renders branding, form fields, and link to register", () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Rakamin Talent Intelligence/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Interview Platform/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Perusahaan \/ Assessor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Kata Sandi/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Masuk ke Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Daftar akun baru/i })).toBeInTheDocument();
    });

    it("submits login form and navigates to /assessments on success", async () => {
      (authApi.login as any).mockResolvedValue({
        data: { token: "mock-jwt-token" },
      });

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Perusahaan \/ Assessor/i), {
        target: { value: "assessor@rakamin.com" },
      });
      fireEvent.change(screen.getByLabelText(/Kata Sandi/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Masuk ke Dashboard/i }));

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: "assessor@rakamin.com",
          password: "password123",
        });
        expect(mockNavigate).toHaveBeenCalledWith("/assessments");
      });
    });

    it("displays error message when login fails", async () => {
      (authApi.login as any).mockRejectedValue({
        response: {
          data: {
            errors: [{ message: "Invalid email or password." }],
          },
        },
      });

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Perusahaan \/ Assessor/i), {
        target: { value: "wrong@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Kata Sandi/i), {
        target: { value: "wrongpass" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Masuk ke Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password\./i)).toBeInTheDocument();
      });
    });
  });

  describe("RegisterPage", () => {
    it("renders register form fields, role selection, and link to login", () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Daftar Akun Assessor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Profesional \/ Perusahaan/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Peran Penilai/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Kata Sandi$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Konfirmasi Kata Sandi/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Buat Akun Baru/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Masuk di sini/i })).toBeInTheDocument();
    });

    it("shows error when passwords do not match", async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Profesional \/ Perusahaan/i), {
        target: { value: "newuser@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^Kata Sandi$/i), {
        target: { value: "secret123" },
      });
      fireEvent.change(screen.getByLabelText(/Konfirmasi Kata Sandi/i), {
        target: { value: "mismatch321" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Buat Akun Baru/i }));

      await waitFor(() => {
        expect(screen.getByText(/Konfirmasi kata sandi tidak cocok\./i)).toBeInTheDocument();
      });
    });

    it("successfully registers user and displays success state", async () => {
      (authApi.signup as any).mockResolvedValue({
        data: {
          token: "new-user-jwt",
          message: "User registered successfully",
        },
      });

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Profesional \/ Perusahaan/i), {
        target: { value: "newuser@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^Kata Sandi$/i), {
        target: { value: "secret123" },
      });
      fireEvent.change(screen.getByLabelText(/Konfirmasi Kata Sandi/i), {
        target: { value: "secret123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Buat Akun Baru/i }));

      await waitFor(() => {
        expect(authApi.signup).toHaveBeenCalledWith({
          email: "newuser@example.com",
          password: "secret123",
          password_confirmation: "secret123",
          role: "admin",
        });
        expect(screen.getByText(/Pendaftaran Berhasil!/i)).toBeInTheDocument();
      });
    });
  });
});
