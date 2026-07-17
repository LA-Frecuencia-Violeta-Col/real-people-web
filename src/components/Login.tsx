import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Loader2, AlertCircle } from 'lucide-react';
import { login } from '../services/configService';

interface LoginProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const Login = ({ onClose, onSuccess }: LoginProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-dark/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-dark border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold/10 blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
            <Lock className="text-gold" size={28} />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-archivo font-black tracking-tighter italic uppercase text-white">ADMIN LOGIN</h2>
            <p className="text-white/40 text-xs tracking-widest font-archivo">SOLO PARA PERSONAL AUTORIZADO</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] tracking-[0.2em] font-archivo font-black text-white/30 ml-4 uppercase text-left block">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-sans font-light"
                  required
                  autoFocus
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center space-x-3 text-red-500 text-xs text-left"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gold rounded-full text-white font-archivo font-black text-[10px] tracking-[0.4em] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center mt-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'ENTRAR AL SISTEMA'
              )}
            </button>
          </form>

          <button
            onClick={onClose}
            className="text-[10px] tracking-[0.2em] font-archivo font-black text-white/20 hover:text-white transition-colors uppercase pt-4"
          >
            VOLVER AL SITIO
          </button>
        </div>
      </motion.div>
    </div>
  );
};
