import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Sound settings
      inChatSoundEnabled: true,
      notificationSoundEnabled: true,
      
      // User preferences
      preferences: {
        inChatSoundEnabled: true,
        notificationSoundEnabled: true,
        theme: 'light',
        language: 'en',
      },
      
      // Actions
      setInChatSoundEnabled: (enabled) => {
        set({ inChatSoundEnabled: enabled });
        set(state => ({
          preferences: {
            ...state.preferences,
            inChatSoundEnabled: enabled
          }
        }));
      },
      
      setNotificationSoundEnabled: (enabled) => {
        set({ notificationSoundEnabled: enabled });
        set(state => ({
          preferences: {
            ...state.preferences,
            notificationSoundEnabled: enabled
          }
        }));
      },
      
      updatePreferences: (newPreferences) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            ...newPreferences
          }
        }));
      },
      
      resetToDefaults: () => {
        set({
          inChatSoundEnabled: true,
          notificationSoundEnabled: true,
          preferences: {
            inChatSoundEnabled: true,
            notificationSoundEnabled: true,
            theme: 'light',
            language: 'en',
          }
        });
      },
      
      // Get current settings
      getSettings: () => {
        return get().preferences;
      },
    }),
    {
      name: 'talkora-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
