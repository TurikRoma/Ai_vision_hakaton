import { createContext, useContext, useMemo, useReducer, useEffect } from 'react'

// Simple app-wide store for image, analysis, and history.
// Storage keys
const LS_HISTORY_KEY = 'aiface_history_v1'

const initialState = {
  imageDataUrl: null,
  analysis: null,
  history: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, imageDataUrl: action.payload }
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload }
    case 'LOAD_HISTORY':
      return { ...state, history: action.payload || [] }
    case 'SAVE_TO_HISTORY': {
      const updated = [action.payload, ...state.history].slice(0, 50)
      return { ...state, history: updated }
    }
    case 'DELETE_HISTORY_ITEM': {
      const updated = state.history.filter((h) => h.id !== action.payload)
      return { ...state, history: updated }
    }
    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_HISTORY_KEY)
      if (raw) {
        dispatch({ type: 'LOAD_HISTORY', payload: JSON.parse(raw) })
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(state.history))
    } catch (e) {
      // ignore
    }
  }, [state.history])

  const value = useMemo(
    () => ({ state, dispatch }),
    [state]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
