'use client'

import * as React from 'react'
import { QueryClientProvider as TanStackQueryProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <TanStackQueryProvider client={queryClient}>{children}</TanStackQueryProvider>
}
