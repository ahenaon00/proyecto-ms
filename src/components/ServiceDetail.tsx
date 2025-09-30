import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from 'react-toastify'
import api from "@/lib/api"

interface Precio {
  source: string
  parsedValue: number
}

interface RequisitoEspecial {
  id: number
  requisito: string
}

interface Clasificacion {
  tipo: string
  id: number
  lugarInicio: string
  precio: Precio
  fechaDisponibilidadInicio: string
  fechaDisponibilidadFin: string
  capacidadMaxima: number
  requisitosEspeciales: RequisitoEspecial[]
  fechaCheckin: string
  fechaCheckout: string
  tipoInmueble: string
  numeroBanos: number
  numeroHabitaciones: number
  lat: number
  lng: number
}

interface Item {
  id: number
  clasificacion: Clasificacion
  titulo: string
  descripcion: string
  fechaPublicacion: string
  stock: number
  visualizaciones: number
  calificacionPromedio: number
}

interface ServiceDetailData {
  item: Item
  clasificacionData: Clasificacion
}

function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [service, setService] = useState<ServiceDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        setLoading(true)
        console.log('Fetching service detail for ID:', id)
        const response = await api.get(`/marketplace-ms/items/${id}`)
        console.log('Service detail response:', response.data)
        setService(response.data)
      } catch (err) {
        console.error('Error fetching service detail:', err)
        setError('Error al cargar los detalles del servicio')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchServiceDetail()
    }
  }, [id])

  const getCategoryIcon = (clasificacionTipo: string) => {
    const categoryMap: { [key: string]: string } = {
      'Alojamiento': '🏨',
      'Alimentacion': '🍽️',
      'Transporte': '🚗',
      'PaseosEcologicos': '🌿'
    }
    return categoryMap[clasificacionTipo] || '📋'
  }

  const addToCart = async () => {
    if (!service || !id) {
      console.log('Missing required data:', { service: !!service, id })
      return
    }

    try {
      setAddingToCart(true)
      console.log('Adding to cart - Item ID:', id, 'Quantity:', quantity, 'Price:', service.item.clasificacion.precio.parsedValue, '(User ID from JWT)')

      const cartData = {
        cantidad: quantity,
        precioUnitario: service.item.clasificacion.precio.parsedValue
      }

      console.log('Sending POST request to:', `/marketplace-ms/items/${id}/add-to-cart`, 'with data:', cartData)
      const response = await api.post(`/marketplace-ms/items/${id}/add-to-cart`, cartData)
      console.log('Add to cart response:', response.data)

      toast.success('¡Producto agregado al carrito exitosamente!')
    } catch (err: any) {
      console.error('Error adding to cart:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      toast.error('Error al agregar el producto al carrito')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando detalles...</span>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Servicio no encontrado'}</p>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Button onClick={() => navigate('/')} variant="outline">
              ← Volver
            </Button>
            <Button onClick={() => navigate('/cart')} variant="outline">
              🛒 Carrito
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Hero Image */}
          <div className="h-96 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-9xl">{getCategoryIcon(service.item.clasificacion.tipo)}</span>
          </div>

          <div className="p-8">
            {/* Title and Category */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {service.item.titulo}
                </h1>
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                  {service.item.clasificacion.tipo}
                </span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${service.item.clasificacion.precio.parsedValue}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">por persona</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Descripción</h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                {service.item.descripcion}
              </p>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ubicación</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  📍 {service.item.clasificacion.lugarInicio}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Capacidad</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  👥 {service.item.clasificacion.capacidadMaxima} personas
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Calificación</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ⭐ {(service.item.calificacionPromedio / 10).toFixed(1)} / 5.0
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Visualizaciones</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  👁️ {service.item.visualizaciones}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stock Disponible</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  📦 {service.item.stock}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Publicación</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  📅 {new Date(service.item.fechaPublicacion).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Accommodation Details (if applicable) */}
            {service.item.clasificacion.tipo === 'Alojamiento' && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Detalles del Alojamiento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tipo de Inmueble</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      🏠 {service.item.clasificacion.tipoInmueble}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Habitaciones</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      🛏️ {service.item.clasificacion.numeroHabitaciones}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Baños</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      🚿 {service.item.clasificacion.numeroBanos}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Check-in / Check-out</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      📆 {new Date(service.item.clasificacion.fechaCheckin).toLocaleDateString()} - {new Date(service.item.clasificacion.fechaCheckout).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Disponibilidad</h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  Desde: <span className="font-semibold">{new Date(service.item.clasificacion.fechaDisponibilidadInicio).toLocaleDateString()}</span>
                  {' '} hasta: <span className="font-semibold">{new Date(service.item.clasificacion.fechaDisponibilidadFin).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* Special Requirements */}
            {service.item.clasificacion.requisitosEspeciales && service.item.clasificacion.requisitosEspeciales.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Requisitos Especiales
                </h2>
                <ul className="space-y-2">
                  {service.item.clasificacion.requisitosEspeciales.map((req) => (
                    <li key={req.id} className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{req.requisito}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Location Map Placeholder */}
            {service.item.clasificacion.lat && service.item.clasificacion.lng && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Ubicación</h2>
                <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg flex items-center justify-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    📍 Coordenadas: {service.item.clasificacion.lat}, {service.item.clasificacion.lng}
                  </p>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Cantidad</h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <Button
                size="lg"
                className="flex-1"
                onClick={addToCart}
                disabled={addingToCart}
              >
                {addingToCart ? 'Agregando...' : 'Agregar al Carrito'}
              </Button>
              <Button size="lg" variant="outline" className="flex-1">
                Contactar Proveedor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetail