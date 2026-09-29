import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

export type Role = 'party_member' | 'game_master' | 'solo_player' | null;

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  type: 'text' | 'image' | 'audio';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuestSubmission {
  id: string;
  quest_id: string;
  content_url: string;
  status: string;
  quests: {
    title: string;
    points_reward: number;
    type: string;
  };
}

export interface RewardItem {
  id: string;
  name: string;
  imageUrl: string;
  unlocked: boolean;
  cost: number;
}

interface AppState {
  role: Role;
  xpPoints: number;
  quests: Quest[];
  rewards: RewardItem[];
  isLoading: boolean;
  quizQuestions: QuizQuestion[];
  submissions: QuestSubmission[];
  session: any | null;
  appTheme: 'cozy' | 'dark' | 'ocean';
  setAppTheme: (theme: 'cozy' | 'dark' | 'ocean') => void;
  setSession: (session: any | null) => void;
  logout: () => Promise<void>;

  // Acciones
  fetchQuests: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  completeQuest: (questId: string) => void;
  setRole: (role: Role) => void;
  addXP: (points: number) => void;
  fetchQuizQuestions: () => Promise<void>;
  unlockReward: (rewardId: string) => void;
  fetchSubmissions: () => Promise<void>;
  // ✨ Modificamos approve para pedir el questId y agregamos reject
  approveSubmission: (submissionId: string, questId: string, xpReward: number) => Promise<void>;
  rejectSubmission: (submissionId: string) => Promise<void>;
}

const mockRewards: RewardItem[] = [
  { id: 'r1', name: 'Oak Desk', imageUrl: 'https://picsum.photos/seed/desk/200', unlocked: true, cost: 0 },
  { id: 'r2', name: 'Cozy Rug', imageUrl: 'https://picsum.photos/seed/rug/200', unlocked: true, cost: 0 },
  { id: 'r3', name: 'F1 Helmet', imageUrl: 'https://picsum.photos/seed/helmet/200', unlocked: false, cost: 300 },
  { id: 'r4', name: 'Potted Plant', imageUrl: 'https://picsum.photos/seed/plant/200', unlocked: false, cost: 150 },
];

export const useAppStore = create<AppState>()(
  persist(
    (set: any, get: any): AppState => ({
      role: 'party_member',
      xpPoints: 120, // Puntos iniciales
      quests: [],
      quizQuestions: [],
      rewards: mockRewards,
      isLoading: false,
      submissions: [],
      appTheme: 'cozy',
      setAppTheme: (appTheme) => set({ appTheme }),
      session: null,
      setSession: (session) => {
        // Leemos el rol directamente desde Supabase. Si no hay, es estudiante por defecto.
        const userRole = session?.user?.user_metadata?.role || 'party_member';
        set({ session, role: userRole });
      },
      logout: async () => {
        await supabase.auth.signOut();
        set({ session: null, role: 'party_member' });
      },

      fetchSubmissions: async () => {
        const { data, error } = await supabase
          .from('quest_submissions')
          .select(`
            id,
            quest_id,
            content_url,
            status,
            quests (
              title,
              points_reward,
              type
            )
          `)
          .eq('status', 'pending');

        if (error) {
          console.error('Error descargando entregas:', error.message);
          return;
        }

        if (data) {
          set({ submissions: data as any });
        }
      },

      approveSubmission: async (submissionId: string, questId: string, xpReward: number) => {
        // 1. Cambiamos el estado a "approved"
        const { error: subError } = await supabase
          .from('quest_submissions')
          .update({ status: 'approved' })
          .eq('id', submissionId);

        if (subError) {
          Alert.alert('Error', subError.message);
          return;
        }

        // 2. ✨ Desactivamos la misión en Supabase para que ya no aparezca
        await supabase
          .from('quests')
          .update({ is_active: false })
          .eq('id', questId);

        // 3. ✨ Sumamos los XP reales a los puntos que ya tiene Susy
        set((state: AppState) => ({ xpPoints: state.xpPoints + xpReward }));

        // 4. Recargamos la lista de entregas y misiones
        get().fetchSubmissions();
        get().fetchQuests();
        Alert.alert('Approved! ✅', `You granted +${xpReward} XP!`);
      },

      rejectSubmission: async (submissionId: string) => {
        // 1. Cambiamos el estado a "rejected"
        const { error } = await supabase
          .from('quest_submissions')
          .update({ status: 'rejected' })
          .eq('id', submissionId);

        if (error) {
          Alert.alert('Error', error.message);
          return;
        }

        // 2. Recargamos solo las entregas (la misión sigue activa para que reintente)
        get().fetchSubmissions();
        Alert.alert('Rejected ❌', 'Submission rejected. Susy can try again.');
      },

      unlockReward: (rewardId) => set((state: AppState) => {
        const item = state.rewards.find(r => r.id === rewardId);
        if (item && !item.unlocked && state.xpPoints >= item.cost) {
          return {
            xpPoints: state.xpPoints - item.cost,
            rewards: state.rewards.map(r =>
              r.id === rewardId ? { ...r, unlocked: true } : r
            )
          };
        }
        return state;
      }),

      fetchQuests: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
          .from('quests')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error descargando misiones:', error.message);
          set({ isLoading: false });
          return;
        }

        if (data) {
          const realQuests: Quest[] = data.map((q) => ({
            id: q.id,
            title: q.title,
            description: q.description || '',
            xpReward: q.points_reward || 0,
            completed: false,
            type: q.type || 'text',
          }));
          set({ quests: realQuests, isLoading: false });
        }
      },

      completeQuest: (questId) => set((state: AppState) => {
        const quest = state.quests.find(q => q.id === questId);
        if (quest && !quest.completed) {
          return {
            quests: state.quests.map(q => q.id === questId ? { ...q, completed: true } : q),
            xpPoints: state.xpPoints + quest.xpReward
          };
        }
        return state;
      }),

      fetchQuizQuestions: async () => {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('Error descargando quiz:', error.message);
          return;
        }

        if (data) {
          const realQuestions: QuizQuestion[] = data.map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer,
          }));
          set({ quizQuestions: realQuestions });
        }
      },

      fetchRewards: async () => {
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error descargando premios:', error.message);
          return;
        }

        if (data) {
          set((state: AppState) => {
            const mergedRewards = data.map(dbReward => {
              const existing = state.rewards.find(r => r.id === dbReward.id);
              return {
                id: dbReward.id,
                name: dbReward.name,
                imageUrl: dbReward.image_url || 'https://picsum.photos/200',
                unlocked: existing ? existing.unlocked : false,
                cost: dbReward.cost
              };
            });
            return { rewards: mergedRewards };
          });
        }
      },

      addXP: (points) => set((state: AppState) => ({ xpPoints: state.xpPoints + points })),
      setRole: (role) => set({ role }),
    }),
    {
      name: 'susy-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        xpPoints: state.xpPoints,
        rewards: state.rewards,
        appTheme: state.appTheme,
      }),
    }
  )
);