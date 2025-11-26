import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Tipos para la nueva API
export interface ItemResponse {
  id: number
  titulo: string
  descripcion: string
  clasificacionId: number
  // Campos copiados automáticamente de la clasificación:
  lugarInicio: string
  precio: number
  fechaDisponibilidadInicio: string
  fechaDisponibilidadFin: string
  capacidadMaxima: number
  usuarioId: string
  fechaPublicacion: string
  stock: number
  visualizaciones: number
  calificacionPromedio: number
}

export interface CreateItemRequest {
  titulo: string
  descripcion: string
  clasificacionId: number // Solo el ID de la clasificación
}

export interface PreguntaFrecuente {
  id: number
  pregunta: string
  itemId: number
}

export interface Review {
  id: number
  puntuacion: number
  titulo: string
  comentario: string
  fechaCreacion: string
  usuarioId: string
  replies?: Reply[]
}

export interface Reply {
  id: number
  cuerpo: string
  fechaCreacion: string
  usuarioId: string
}

// API functions para items
export const itemsAPI = {
  // Obtener todos los items con filtros opcionales
  getItems: (filters?: {
    lugarInicio?: string
    tipo?: string
    precioMin?: number
    precioMax?: number
  }) => {
    const params = new URLSearchParams()
    if (filters?.lugarInicio) params.append('lugarInicio', filters.lugarInicio)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.precioMin) params.append('precioMin', filters.precioMin.toString())
    if (filters?.precioMax) params.append('precioMax', filters.precioMax.toString())
    
    const queryString = params.toString()
    return api.get<ItemResponse[]>(`/marketplace-ms/items${queryString ? `?${queryString}` : ''}`)
  },

  // Obtener un item específico
  getItem: (id: number) => api.get<ItemResponse>(`/marketplace-ms/items/${id}`),

  // Crear nuevo item (requiere JWT PROVEEDOR)
  createItem: (item: CreateItemRequest) => api.post<ItemResponse>('/marketplace-ms/items', item),

  // Crear nuevo item con datos detallados (requiere JWT PROVEEDOR)
  createDetailedItem: (itemData: any) => api.post<ItemResponse>('/marketplace-ms/items/detailed', itemData),

  // Actualizar item (requiere JWT PROVEEDOR)
  updateItem: (id: number, item: CreateItemRequest) => api.put<ItemResponse>(`/marketplace-ms/items/${id}`, item),

  // Eliminar item (requiere JWT PROVEEDOR)
  deleteItem: (id: number) => api.delete(`/marketplace-ms/items/${id}`),

  // Agregar al carrito (sin cambios)
  addToCart: (id: number, data: any) => api.post(`/marketplace-ms/items/${id}/add-to-cart`, data),

  // Buscar items
  searchItems: (query: string) => api.get<ItemResponse[]>(`/marketplace-ms/items/search?query=${encodeURIComponent(query)}`),

  // Crear item completo con id
  createFullItem: (itemData: any) => api.post<ItemResponse>('/marketplace-ms/items', itemData)
}

// API functions para preguntas frecuentes
export const preguntasAPI = {
  // Obtener preguntas de un item
  getPreguntas: (itemId: number) => api.get<PreguntaFrecuente[]>(`/marketplace-ms/items/${itemId}/preguntas`),

  // Crear nueva pregunta (requiere JWT PROVEEDOR)
  createPregunta: (itemId: number, pregunta: { pregunta: string }) =>
    api.post<PreguntaFrecuente>(`/marketplace-ms/items/${itemId}/preguntas`, pregunta),

  // Eliminar pregunta (requiere JWT PROVEEDOR)
  deletePregunta: (itemId: number, preguntaId: number) =>
    api.delete(`/marketplace-ms/items/${itemId}/preguntas/${preguntaId}`)
}

// API functions para reseñas
export const reviewsAPI = {
  // Obtener reseñas de un item
  getReviews: (itemId: number) => api.get<Review[]>(`/marketplace-ms/items/${itemId}/reviews`),

  // Crear nueva reseña
  createReview: (itemId: number, review: { puntuacion: number; titulo: string; comentario: string }) =>
    api.post<Review>(`/marketplace-ms/items/${itemId}/reviews`, review),

  // Responder a una reseña
  createReply: (itemId: number, reviewId: number, reply: { cuerpo: string }) =>
    api.post<Reply>(`/marketplace-ms/items/${itemId}/reviews/${reviewId}/replies`, reply)
}

// API functions para creación de servicios específicos
export const servicesAPI = {
  // Crear servicio de alojamiento
  createAlojamiento: (data: any) => api.post('/marketplace-ms/alojamiento', data),

  // Crear servicio de alimentación
  createAlimentacion: (data: any) => api.post('/marketplace-ms/alimentacion', data),

  // Crear servicio de transporte
  createTransporte: (data: any) => api.post('/marketplace-ms/transporte', data),

  // Crear servicio de paseos ecológicos
  createPaseosEcologico: (data: any) => api.post('/marketplace-ms/paseos-ecologico', data)
}

export default api