/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  BookOpen,
  Sun,
  CloudSun,
  Moon,
  LogIn,
  Sparkles,
  Zap,
  AlertCircle
} from 'lucide-react';

// Firebase Imports
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Priority, 
  NavItem, 
  TimeSlot, 
  Task, 
  Session, 
  AppState 
} from './types';
import { updateTaskStatus, deleteTaskFromFirestore, addTaskToFirestore } from './services/taskService';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';
import { GoogleGenAI } from "@google/genai";

// --- Components ---

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number | string, icon: any, color: string }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-slate-200 dark:shadow-none`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">{title}</span>
    </div>
    <div className="text-3xl font-black text-slate-900 dark:text-white font-display">{value}</div>
  </div>
);

const LandingView = ({ onGetStarted }: { onGetStarted: () => void }) => (
  <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
    <nav className="h-20 flex items-center justify-between px-8 md:px-20 border-b border-slate-100 dark:border-slate-900">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-xl">
          <LayoutDashboard className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-black text-slate-900 dark:text-white font-display">StudyFlow</span>
      </div>
      <button 
        onClick={onGetStarted}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
      >
        Sign In
      </button>
    </nav>

    <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-8">
          <Sparkles className="w-4 h-4" />
          The Ultimate Student Companion
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 font-display leading-tight">
          Master Your Studies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">StudyFlow</span>
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Organize tasks, plan your schedule, and track your academic progress in one beautiful, real-time dashboard.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button 
            onClick={onGetStarted}
            className="w-full md:w-auto bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
          >
            Get Started Free <ChevronRight className="w-5 h-5" />
          </button>
          <button className="w-full md:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-[2rem] font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            View Demo
          </button>
        </div>
      </motion.div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {[
          { icon: CheckCircle2, title: 'Task Management', desc: 'Stay on top of assignments with real-time tracking.' },
          { icon: Clock, title: 'Daily Planner', desc: 'Organize your day into morning, afternoon, and evening slots.' },
          { icon: BarChart3, title: 'Progress Analytics', desc: 'Visualize your academic growth with dynamic charts.' }
        ].map((feature, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-left">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl w-fit mb-6">
              <feature.icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 font-display">{feature.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  </div>
);

const AuthView = ({ 
  mode, 
  setMode, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  error, 
  loading, 
  onEmailAuth, 
  onGoogleAuth,
  onBackToLanding
}: any) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 w-full max-w-md relative"
    >
      <button 
        onClick={onBackToLanding}
        className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
      >
        <LayoutDashboard className="w-6 h-6" />
      </button>

      <div className="text-center mb-10">
        <div className="bg-indigo-600 p-3 rounded-2xl w-fit mx-auto mb-6 shadow-lg shadow-indigo-200 dark:shadow-none">
          <LayoutDashboard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          {mode === 'login' ? 'Sign in to continue your journey' : 'Start your academic success today'}
        </p>
      </div>

      <form onSubmit={onEmailAuth} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 font-display">Email Address</label>
          <input 
            required
            type="email" 
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all dark:text-slate-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 font-display">Password</label>
          <input 
            required
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all dark:text-slate-200"
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Zap className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
        </div>
      </div>

      <button 
        onClick={onGoogleAuth}
        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Google Account
      </button>

      <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
        <button 
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
        >
          {mode === 'login' ? 'Sign Up' : 'Log In'}
        </button>
      </p>
    </motion.div>
  </div>
);

const Sidebar = ({ active, setActive, isOpen, setIsOpen, onLogout }: { active: NavItem, setActive: (item: NavItem) => void, isOpen: boolean, setIsOpen: (open: boolean) => void, onLogout: () => void }) => {
  const items: { id: NavItem, label: string, icon: any }[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task Manager', icon: CheckCircle2 },
    { id: 'planner', label: 'Time Planner', icon: Clock },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50 transition-all duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 font-display">
              StudyFlow
            </span>
            <button onClick={() => setIsOpen(false)} className="lg:hidden ml-auto p-2 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  active === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ onMenuClick, user, searchQuery, setSearchQuery, isDarkMode, toggleDarkMode }: { onMenuClick: () => void, user: FirebaseUser | null, searchQuery: string, setSearchQuery: (q: string) => void, isDarkMode: boolean, toggleDarkMode: () => void }) => (
  <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 px-6 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
        <Menu className="w-6 h-6" />
      </button>
      <div className="relative hidden md:block">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Search for tasks, subjects..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm w-80 focus:ring-2 focus:ring-indigo-500 transition-all dark:text-slate-200"
        />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button 
        onClick={toggleDarkMode}
        className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl relative">
        <Bell className="w-5 h-5" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
      </button>
      <div className="h-1 w-px bg-slate-200 dark:bg-slate-800 mx-1 self-stretch my-6" />
      {user?.photoURL ? (
        <img src={user.photoURL} alt="User" className="h-10 w-10 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none border-2 border-white dark:border-slate-800" referrerPolicy="no-referrer" />
      ) : (
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100 dark:shadow-none">
          {user?.displayName?.charAt(0) || 'U'}
        </div>
      )}
    </div>
  </header>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<NavItem>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Task Form State
  const [newTask, setNewTask] = useState({ name: '', deadline: '', priority: 'Medium' as Priority, subject: '' });

  // Planner State
  const [plannerSlots, setPlannerSlots] = useState(() => {
    const saved = localStorage.getItem('plannerSlots');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map icons back because JSON doesn't store functions/components
        return parsed.map((slot: any) => ({
          ...slot,
          icon: slot.id === 'Morning' ? Sun : slot.id === 'Afternoon' ? CloudSun : Moon
        }));
      } catch (e) {
        console.error("Error parsing plannerSlots from localStorage", e);
      }
    }
    return [
      { id: 'Morning', label: 'Morning', time: '08:00 - 12:00', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
      { id: 'Afternoon', label: 'Afternoon', time: '13:00 - 17:00', icon: CloudSun, color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { id: 'Evening', label: 'Evening', time: '18:00 - 22:00', icon: Moon, color: 'text-violet-500', bg: 'bg-violet-50' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('plannerSlots', JSON.stringify(plannerSlots));
  }, [plannerSlots]);

  const [isAddingSession, setIsAddingSession] = useState<TimeSlot | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        setActiveTab('home');
      } else {
        setActiveTab('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync: Tasks
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(collection(db, 'tasks'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        taskList.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(taskList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore Sync: Sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    const q = query(collection(db, 'sessions'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList: Session[] = [];
      snapshot.forEach((doc) => {
        sessionList.push({ id: doc.id, ...doc.data() } as Session);
      });
      setSessions(sessionList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sessions');
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const dueToday = tasks.filter(t => t.deadline === today && !t.completed).length;
    const overdue = tasks.filter(t => t.deadline < today && !t.completed).length;

    // Calculate Weekly Insight Dynamically
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const completedByDay: { [key: string]: number } = {};
    
    tasks.forEach(task => {
      // @ts-ignore - completedAt is added in taskService
      if (task.completed && task.completedAt) {
        // @ts-ignore
        const date = task.completedAt.toDate();
        const dayName = dayNames[date.getDay()];
        completedByDay[dayName] = (completedByDay[dayName] || 0) + 1;
      }
    });

    let mostProductiveDay = 'N/A';
    let maxCompleted = 0;
    Object.entries(completedByDay).forEach(([day, count]) => {
      if (count > maxCompleted) {
        maxCompleted = count;
        mostProductiveDay = day;
      }
    });

    return { total, completed, pending, progress, dueToday, overdue, mostProductiveDay, maxCompleted };
  }, [tasks]);

  const suggestion = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const pendingTasks = tasks.filter(t => !t.completed);
    const highPriority = pendingTasks.filter(t => t.priority === 'High');
    const dueTomorrow = pendingTasks.filter(t => t.deadline === tomorrowStr);

    if (tasks.length === 0) {
      return {
        message: "Time to plan your week! Add your first task to get started.",
        icon: Sparkles,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
      };
    }

    if (dueTomorrow.length > 0) {
      return {
        message: `You have ${dueTomorrow.length} deadline${dueTomorrow.length > 1 ? 's' : ''} tomorrow. Focus on high priority tasks first.`,
        icon: AlertCircle,
        color: 'text-rose-600',
        bg: 'bg-rose-50'
      };
    }

    if (highPriority.length >= 3) {
      return {
        message: "You have several high-priority tasks. Consider breaking them into smaller steps.",
        icon: Zap,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      };
    }

    return {
      message: "You're doing great! Keep up the steady progress.",
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    return tasks.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleGoogleLogin = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.name || !newTask.deadline) return;
    
    try {
      await addTaskToFirestore(newTask, user.uid);
      setNewTask({ name: '', deadline: '', priority: 'Medium', subject: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      await updateTaskStatus(id, !currentStatus);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteTaskFromFirestore(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const addSession = (slot: TimeSlot) => {
    setIsAddingSession(slot);
    setSessionTitle('');
  };

  const handleSubmitSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isAddingSession || !sessionTitle) return;

    try {
      await addDoc(collection(db, 'sessions'), {
        slot: isAddingSession,
        title: sessionTitle,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setIsAddingSession(null);
      setSessionTitle('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sessions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sessions/${id}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (activeTab === 'landing' && !user) {
    return <LandingView onGetStarted={() => setActiveTab('login' as any)} />;
  }

  if (!user) {
    return (
      <AuthView 
        mode={authMode}
        setMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={authError}
        loading={isAuthLoading}
        onEmailAuth={handleEmailAuth}
        onGoogleAuth={handleGoogleLogin}
        onBackToLanding={() => setActiveTab('landing')}
      />
    );
  }

  const renderHome = () => (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display">Hello, {user?.displayName?.split(' ')[0] || 'Student'}! 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your studies today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-200 dark:shadow-none">Daily</button>
          <button className="px-4 py-2 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-all">Weekly</button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all ${suggestion.bg} dark:bg-opacity-10`}
      >
        <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm`}>
          <suggestion.icon className={`w-6 h-6 ${suggestion.color}`} />
        </div>
        <p className={`text-sm font-bold ${suggestion.color} dark:text-opacity-90`}>
          {suggestion.message}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Due Today" value={stats.dueToday} icon={Calendar} color="bg-indigo-600" />
        <StatCard title="Overdue" value={stats.overdue} icon={X} color="bg-rose-500" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Recent Tasks</h3>
            <button onClick={() => setActiveTab('tasks')} className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {tasks.slice(0, 4).map(task => (
              <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                <button 
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.name}</h4>
                  <p className="text-xs text-slate-500">{task.subject} • {task.deadline}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 
                  task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Study Progress</h3>
            <p className="text-indigo-100 text-sm">You've completed {stats.progress}% of your tasks this week!</p>
          </div>
          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-4xl font-black">{stats.progress}%</span>
              <span className="text-indigo-200 text-sm font-medium">Keep it up!</span>
            </div>
            <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display">Task Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Add and organize your academic assignments.</p>
        </div>
        <button 
          onClick={() => {
            const form = document.getElementById('task-form');
            form?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-5 h-5" /> New Task
        </button>
      </div>

      <div id="task-form" className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 font-display">Task Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Math Homework"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all dark:text-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 font-display">Deadline</label>
            <input 
              required
              type="date" 
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all dark:text-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 font-display">Priority</label>
            <select 
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all dark:text-slate-200"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 font-display">Subject</label>
            <div className="flex gap-2">
              <input 
                required
                type="text" 
                placeholder="e.g. Physics"
                value={newTask.subject}
                onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                className="flex-1 px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all dark:text-slate-200"
              />
              <button type="submit" className="bg-indigo-600 text-white p-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Task</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Subject</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Deadline</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Priority</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleTask(task.id, task.completed)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <span className={`font-bold text-sm ${task.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-slate-200'}`}>{task.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">{task.subject}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      {task.deadline}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      task.priority === 'High' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' :
                      task.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h4 className="text-slate-900 dark:text-slate-200 font-bold">No tasks found</h4>
              <p className="text-slate-500 dark:text-slate-500 text-sm">Add a new task to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account and app preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Profile Information
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-3xl border-4 border-slate-50 dark:border-slate-800 shadow-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{user?.displayName || 'Student'}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 font-display">Display Name</label>
                  <input 
                    type="text" 
                    disabled
                    value={user?.displayName || ''}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 font-display">Email Address</label>
                  <input 
                    type="email" 
                    disabled
                    value={user?.email || ''}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Planner Configuration
            </h3>
            <div className="space-y-4">
              {plannerSlots.map((slot, idx) => (
                <div key={slot.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slot Name</label>
                    <input 
                      type="text"
                      value={slot.label}
                      onChange={(e) => {
                        const newSlots = [...plannerSlots];
                        newSlots[idx].label = e.target.value;
                        setPlannerSlots(newSlots);
                      }}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 dark:text-white focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Range</label>
                    <input 
                      type="text"
                      value={slot.time}
                      onChange={(e) => {
                        const newSlots = [...plannerSlots];
                        newSlots[idx].time = e.target.value;
                        setPlannerSlots(newSlots);
                      }}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 dark:text-white focus:ring-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Dark Mode</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark themes.</p>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-14 h-8 rounded-full transition-all relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: isDarkMode ? 24 : 4 }}
                    className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none">
            <h3 className="text-xl font-black mb-4 font-display">Account Security</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Your account is protected by Firebase Authentication. You can sign out anytime.
            </p>
            <button 
              onClick={handleLogout}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlanner = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display">Time Planner</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Organize your daily study schedule.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plannerSlots.map((slotInfo, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${slotInfo.bg} dark:bg-opacity-10`}>
                <slotInfo.icon className={`w-8 h-8 ${slotInfo.color}`} />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">{slotInfo.label}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] font-display">{slotInfo.time}</p>
              </div>
            </div>
            <div className="space-y-3">
              {sessions.filter(s => s.slot === slotInfo.id).map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{session.title}</span>
                  <button 
                    onClick={() => deleteSession(session.id)}
                    className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {isAddingSession === slotInfo.id ? (
                <form onSubmit={handleSubmitSession} className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Session title..."
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-indigo-600 dark:text-indigo-400 placeholder:text-indigo-300 focus:ring-0 mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsAddingSession(null)}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest"
                    >
                      Add
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  <button 
                    onClick={() => addSession(slotInfo.id as TimeSlot)}
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1 mx-auto uppercase tracking-widest font-display"
                  >
                    <Plus className="w-4 h-4" /> Add Session
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display">Academic Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your performance and achievements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-64 h-64 mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="24"
                fill="transparent"
                className="text-slate-100 dark:text-slate-800"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="24"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 110}
                initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 110) * (1 - stats.progress / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-indigo-600"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-slate-900 dark:text-white font-display">{stats.progress}%</span>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Completed</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-display">Great Work!</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs">You're making steady progress toward your academic goals.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 font-display">Subject Breakdown</h3>
            <div className="space-y-6">
              {Array.from(new Set(tasks.map(t => t.subject))).slice(0, 4).map((subject, i) => {
                const subjectTasks = tasks.filter(t => t.subject === subject);
                const completed = subjectTasks.filter(t => t.completed).length;
                const percent = subjectTasks.length === 0 ? 0 : Math.round((completed / subjectTasks.length) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">{subject}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className="h-full bg-indigo-600 rounded-full" 
                      />
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-sm italic">No data available yet.</p>}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black font-display">Weekly Insight</h3>
            </div>
            <p className="text-indigo-100 leading-relaxed text-sm">
              {stats.mostProductiveDay !== 'N/A' ? (
                <>Your most productive day this week was <span className="font-bold text-white">{stats.mostProductiveDay}</span>. You completed {stats.maxCompleted} task{stats.maxCompleted > 1 ? 's' : ''}!</>
              ) : (
                "Start completing tasks to see your weekly productivity insights here!"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 flex transition-colors duration-300">
      <Sidebar 
        active={activeTab} 
        setActive={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onLogout={handleLogout}
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'home' && renderHome()}
              {activeTab === 'tasks' && renderTasks()}
              {activeTab === 'planner' && renderPlanner()}
              {activeTab === 'progress' && renderProgress()}
              {activeTab === 'settings' && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          © 2026 StudyFlow Dashboard • Designed for Academic Excellence
        </footer>
      </div>
    </div>
  );
}
