import { create } from 'zustand'

export const usePredictionStore = create((set) => ({
  current:  null,
  history:  [],
  loading:  false,
  error:    null,

  setResult:   (r)  => set({ current: r, loading: false, error: null }),
  setLoading:  (v)  => set({ loading: v }),
  setError:    (e)  => set({ error: e, loading: false }),
  setHistory:  (h)  => set({ history: h }),
  clearCurrent:()   => set({ current: null }),
}))
