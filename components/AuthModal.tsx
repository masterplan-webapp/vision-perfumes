
import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { updateUserProfile } from '../services/userService';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'login' | 'register' | 'forgot' | 'forgot-sent';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        addToast('Login realizado com sucesso!', 'success');
        onClose();
      } else if (view === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        await updateUserProfile(userCredential.user.uid, {
          email: email,
          name: name || '',
          displayName: name || '',
          createdAt: new Date().toISOString()
        });
        await userCredential.user.reload(); // Reload to pick up the new displayName
        addToast('Conta criada com sucesso! Bem-vindo.', 'success');
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Ocorreu um erro. Tente novamente.";
      
      if (err.code === 'auth/invalid-credential') {
        msg = "Email ou senha incorretos. Se for seu primeiro acesso, cadastre-se.";
      } else if (err.code === 'auth/user-not-found') {
         msg = "Usuário não encontrado. Crie uma conta.";
      } else if (err.code === 'auth/wrong-password') {
        msg = "Senha incorreta.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "Este email já está sendo usado.";
      } else if (err.code === 'auth/weak-password') {
        msg = "A senha deve ter pelo menos 6 caracteres.";
      }
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('Digite seu email para recuperar a senha.', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setView('forgot-sent');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        addToast('Nenhuma conta encontrada com este email.', 'error');
      } else if (err.code === 'auth/invalid-email') {
        addToast('Email inválido. Verifique e tente novamente.', 'error');
      } else {
        addToast('Erro ao enviar email de recuperação. Tente novamente.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'login': return 'Bem-vindo de volta';
      case 'register': return 'Criar Conta';
      case 'forgot': return 'Recuperar Senha';
      case 'forgot-sent': return 'Email Enviado!';
    }
  };

  const getSubtitle = () => {
    switch (view) {
      case 'login': return 'Acesse sua conta para gerenciar pedidos';
      case 'register': return 'Junte-se ao mundo Vision Perfumes';
      case 'forgot': return 'Informe seu email para receber as instruções';
      case 'forgot-sent': return `Enviamos um link de recuperação para ${email}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {(view === 'forgot' || view === 'forgot-sent') && (
              <button 
                onClick={() => { setView('login'); resetForm(); }}
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
                aria-label="Voltar ao login"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {view === 'forgot-sent' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            )}

            <h2 className="font-serif text-3xl font-bold text-primary mb-2">
              {getTitle()}
            </h2>
            <p className="text-gray-500 text-sm">
              {getSubtitle()}
            </p>
          </div>

          {/* Login Form */}
          {view === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Seu Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold outline-none transition-all text-gray-900"
                  required
                  id="auth-email"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Sua Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold outline-none transition-all text-gray-900"
                  required
                  minLength={6}
                  id="auth-password"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-xs text-gray-500 hover:text-accent-gold transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-accent-gold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {view === 'register' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Seu Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold outline-none transition-all text-gray-900"
                  required
                  id="auth-name"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Seu Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold outline-none transition-all text-gray-900"
                  required
                  id="auth-register-email"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Crie uma Senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold outline-none transition-all text-gray-900"
                  required
                  minLength={6}
                  id="auth-register-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-accent-gold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Cadastrar'}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Digite seu email cadastrado"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold outline-none transition-all text-gray-900"
                  required
                  autoFocus
                  id="auth-forgot-email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-accent-gold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar Link de Recuperação'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-2">
                Enviaremos um email com um link seguro para você criar uma nova senha.
              </p>
            </form>
          )}

          {/* Forgot Sent Confirmation */}
          {view === 'forgot-sent' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800">
                <p className="font-medium mb-1">Verifique sua caixa de entrada!</p>
                <p className="text-green-700 text-xs">
                  Se uma conta com o email <strong>{email}</strong> existir, você receberá um link para redefinir sua senha. Verifique também a pasta de spam.
                </p>
              </div>

              <button
                onClick={() => { setView('login'); resetForm(); }}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-accent-gold transition-colors"
              >
                Voltar ao Login
              </button>

              <button
                onClick={() => setView('forgot')}
                className="w-full text-sm text-gray-500 hover:text-accent-gold transition-colors"
              >
                Não recebeu? Enviar novamente
              </button>
            </div>
          )}

          {/* Toggle Login / Register */}
          {(view === 'login' || view === 'register') && (
            <div className="mt-6 text-center">
              <button
                onClick={() => { setView(view === 'login' ? 'register' : 'login'); resetForm(); }}
                className="text-sm text-gray-600 hover:text-accent-gold font-medium transition-colors"
              >
                {view === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;