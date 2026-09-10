import { createContext, useContext } from 'react'

export const TransitionContext = createContext(null)

/** { go(to), leaving, scrollTo(target) } */
export const usePageTransition = () => useContext(TransitionContext)
