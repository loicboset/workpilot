import { request } from './client'

export interface Health {
  status: string
  version: string
}

export const getHealth = () => request<Health>('GET', '/health')
