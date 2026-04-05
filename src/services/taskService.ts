import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * TASK SERVICE
 * Handles all Firestore operations for StudyFlow tasks.
 */

// 1. ADD TASK: Saves a new task to the "tasks" collection
export const addTaskToFirestore = async (taskData: any, userId: string) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      uid: userId,
      completed: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

// 2. FETCH TASKS: Sets up a real-time listener for the user's tasks
export const subscribeToTasks = (userId: string, callback: (tasks: any[]) => void) => {
  const q = query(collection(db, 'tasks'), where('uid', '==', userId));
  
  // onSnapshot is better than a one-time "get" because it updates the UI instantly
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(tasks);
  }, (error) => {
    console.error("Error fetching tasks:", error);
  });
};

// 3. UPDATE TASK: Marks a task as completed/pending in Firestore
export const updateTaskStatus = async (taskId: string, isCompleted: boolean) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed: isCompleted,
      completedAt: isCompleted ? serverTimestamp() : null
    });
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// 4. DELETE TASK: Removes a task from Firestore
export const deleteTaskFromFirestore = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};
