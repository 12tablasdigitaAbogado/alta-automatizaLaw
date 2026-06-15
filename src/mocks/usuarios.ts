import type { Usuario } from '@/types'

export const MOCK_USUARIOS: Usuario[] = [
  {
    id: 'user-001',
    email: 'garcia@estudiojuridico.com',
    rol: 'cliente',
    nombre: 'Dra. María García',
    estudioId: 'estudio-001',
  },
  {
    id: 'user-002',
    email: 'rodriguez@rlabogados.com',
    rol: 'cliente',
    nombre: 'Dr. Carlos Rodríguez',
    estudioId: 'estudio-002',
  },
  {
    id: 'user-003',
    email: 'fernandez@fernandezasociados.com',
    rol: 'cliente',
    nombre: 'Dra. Laura Fernández',
    estudioId: 'estudio-003',
  },
  {
    id: 'admin-001',
    email: 'operador@cowork.ai',
    rol: 'admin',
    nombre: 'Operador Demo',
    estudioId: '',
  },
]

export const MOCK_USUARIO_CLIENTE = MOCK_USUARIOS[0]
export const MOCK_USUARIO_ADMIN = MOCK_USUARIOS[3]
