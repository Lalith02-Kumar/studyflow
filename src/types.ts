import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export type Priority = 'High' | 'Medium' | 'Low';
export type NavItem = 'landing' | 'home' | 'tasks' | 'planner' | 'progress' | 'settings';
export type TimeSlot = 'Morning' | 'Afternoon' | 'Evening';

export interface Task {
  id: string;
  name: string;
  subject: string;
  deadline: string;
  priority: Priority;
  completed: boolean;
  uid: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface Session {
  id: string;
  title: string;
  slot: TimeSlot;
  uid: string;
  createdAt: Timestamp;
}

export interface AppState {
  user: FirebaseUser | null;
  isAuthReady: boolean;
  activeTab: NavItem;
  isSidebarOpen: boolean;
  tasks: Task[];
  sessions: Session[];
  searchQuery: string;
  isDarkMode: boolean;
}
