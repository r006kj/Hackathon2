import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { LoginRequest } from '../types/api';

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: Location })?.from?.pathname ?? '/';

  const [form, setForm] = useState<LoginRequest>({
    teamCode: '',
    email: '',
    password: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch {
      // error ya está en el contexto
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">TropelCare</h1>
          <p className="text-gray-400 text-sm mt-1">Control Room — Acceso operativo</p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-600 text-red-200 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(
            [
              { name: 'teamCode', label: 'Código de equipo', type: 'text' },
              { name: 'email',    label: 'Email',            type: 'email' },
              { name: 'password', label: 'Contraseña',       type: 'password' },
            ] as const
          ).map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm text-gray-300 mb-1">{label}</label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600
                           focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-colors"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white
                       font-semibold py-2 rounded-lg transition-colors mt-2"
          >
            {isLoading ? 'Autenticando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
