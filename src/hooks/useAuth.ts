import { isUnlocked, getName } from '../lib/auth'

export function useAuth() {
  return {
    isUnlocked: isUnlocked(),
    name: getName(),
    loading: false,
  }
}
