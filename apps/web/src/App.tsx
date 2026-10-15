import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Sparkles, Layers, Terminal, LogOut, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import ProjectListPage from './pages/ProjectListPage.js';
import ProjectChatPage from './pages/ProjectChatPage.js';
import LoginPage from './pages/LoginPage.js';
import SignupPage from './pages/SignupPage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import { useAuth } from './context/AuthContext.js';

export default function App() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isChat = location.pathname.startsWith('/projects/');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-brand-500/30 selection:text-brand-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="flex items-center gap-3 group transition-transform active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-violet-500 p-[1px] shadow-glow flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                  <Sparkles className="w-4 h-4 text-brand-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-brand-300 transition-colors">
                    PlanCraft<span className="text-brand-400">.ai</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    Agent Spec
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:block">
                  Autonomous Project Architecture & Discovery
                </span>
              </div>
            </Link>

            {/* Quick nav */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !isChat
                      ? 'bg-slate-800/80 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Workspaces
                  </span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right Status & Auth Meta */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Engine:</span>
              <span className="font-medium text-slate-200">Gemini 2.0</span>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-200 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign out of your account"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-slate-800 hover:border-rose-500/30 transition flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition flex items-center gap-1.5 border border-slate-800"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition flex items-center gap-1.5 shadow-sm shadow-brand-600/30"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
