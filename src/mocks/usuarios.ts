import type { Usuario } from '@/types'

export const MOCK_USUARIOS: Usuario[] = [
  {
    id: 'user-001',
    email: 'garcia@estudiojuridico.com',
    rol: 'cliente',
    estado: 'activo',
    nombre: 'Dra. María García',
    estudioId: 'estudio-001',
  },
  {
    id: 'user-002',
    email: 'rodriguez@rlabogados.com',
    rol: 'cliente',
    estado: 'activo',
    nombre: 'Dr. Carlos Rodríguez',
    estudioId: 'estudio-002',
  },
  {
    id: 'user-003',
    email: 'fernandez@fernandezasociados.com',
    rol: 'cliente',
    estado: 'activo',
    nombre: 'Dra. Laura Fernández',
    estudioId: 'estudio-003',
  },
  {
    id: 'admin-001',
    email: 'operador@cowork.ai',
    rol: 'operador',
    estado: 'activo',
    nombre: 'Operador Demo',
  },
]

export const MOCK_USUARIO_CLIENTE = MOCK_USUARIOS[0]
export const MOCK_USUARIO_ADMIN = MOCK_USUARIOS[3]
