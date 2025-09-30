import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import api from "@/lib/api"

interface Precio {
  source: string
  parsedValue: number
}

interface RequisitoEspecial {
  id: number
  requisito: string
}

interface ClasificacionSimple {
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
  clasificacion: {
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
  titulo: string
  descripcion: string
  fechaPublicacion: string
  stock: number
  visualizaciones: number
  calificacionPromedio: number
}

interface Service {
  item: Item
  clasificacionData: ClasificacionSimple
}

const categories = [
  { id: 'todos', name: 'Todos', icon: '📋' },
  { id: 'alojamiento', name: 'Alojamiento', icon: '🏨' },
  { id: 'alimentacion', name: 'Alimentación', icon: '🍽️' },
  { id: 'transporte', name: 'Transporte', icon: '🚗' },
  { id: 'paseos-ecologicos', name: 'Paseos Ecológicos', icon: '🌿' }
]

function Home() {
  const navigate = useNavigate()
  const { user, logout, hasRole, hasAnyRole } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        console.log('Loading all services via REST')
        const response = await api.get('/marketplace-ms/items')

        // Convert object response to array
        const servicesArray = Object.values(response.data) as Service[]
        setServices(servicesArray)
        setFilteredServices(servicesArray)
      } catch (err) {
        console.error('Error loading services:', err)
        setError('Error al cargar los servicios')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])


  // Filter services by category
  useEffect(() => {
    const loadFilteredServices = async () => {
      if (selectedCategory === 'todos') {
        console.log('Showing all services (no filtering)')
        setFilteredServices(services)
      } else {
        // Map frontend category IDs to backend clasificacion types
        const categoryTypeMap: { [key: string]: string } = {
          'alojamiento': 'Alojamiento',
          'alimentacion': 'Alimentacion',
          'transporte': 'Transporte',
          'paseos-ecologicos': 'PaseosEcologicos'
        }

        const targetCategoryType = categoryTypeMap[selectedCategory]
        if (targetCategoryType) {
          try {
            setLoading(true)
            setError('')
            const query = `query { itemsPorClasificacion(clasificacion: "${targetCategoryType}") { id titulo descripcion lugarInicio precio calificacionPromedio visualizaciones capacidadMaxima clasificacion { tipo lugarInicio precio capacidadMaxima } } }`
            console.log('Making GraphQL request for category:', targetCategoryType, 'with query:', query)
            const response = await api.post('/marketplace-ms/graphql', { query })
            console.log('GraphQL response:', response.data)
            const items = response.data.data.itemsPorClasificacion

            // Map to Service[] structure
            const mappedServices: Service[] = items.map((item: any) => ({
              item: {
                id: item.id,
                titulo: item.titulo,
                descripcion: item.descripcion,
                fechaPublicacion: '', // Not in query, set default
                stock: 0, // Not in query, set default
                visualizaciones: item.visualizaciones,
                calificacionPromedio: item.calificacionPromedio,
                clasificacion: {
                  tipo: item.clasificacion.tipo,
                  id: 0, // Not in query, set default
                  lugarInicio: item.clasificacion.lugarInicio,
                  precio: { source: '', parsedValue: item.clasificacion.precio },
                  fechaDisponibilidadInicio: '', // Not in query
                  fechaDisponibilidadFin: '', // Not in query
                  capacidadMaxima: item.clasificacion.capacidadMaxima,
                  requisitosEspeciales: [], // Not in query
                  fechaCheckin: '', // Not in query
                  fechaCheckout: '', // Not in query
                  tipoInmueble: '', // Not in query
                  numeroBanos: 0, // Not in query
                  numeroHabitaciones: 0, // Not in query
                  lat: 0, // Not in query
                  lng: 0 // Not in query
                }
              },
              clasificacionData: {
                tipo: item.clasificacion.tipo,
                id: 0, // Not in query
                lugarInicio: item.clasificacion.lugarInicio,
                precio: { source: '', parsedValue: item.clasificacion.precio },
                fechaDisponibilidadInicio: '', // Not in query
                fechaDisponibilidadFin: '', // Not in query
                capacidadMaxima: item.clasificacion.capacidadMaxima,
                requisitosEspeciales: [], // Not in query
                fechaCheckin: '', // Not in query
                fechaCheckout: '', // Not in query
                tipoInmueble: '', // Not in query
                numeroBanos: 0, // Not in query
                numeroHabitaciones: 0, // Not in query
                lat: 0, // Not in query
                lng: 0 // Not in query
              }
            }))

            console.log('Mapped services:', mappedServices.length, 'items')
            setFilteredServices(mappedServices)
          } catch (err) {
            console.error('Error filtering services:', err)
            setError('Error al filtrar servicios')
          } finally {
            setLoading(false)
          }
        } else {
          setFilteredServices(services)
        }
      }
    }

    loadFilteredServices()
  }, [selectedCategory])

  const getCategoryIcon = (clasificacionTipo: string) => {
    const categoryMap: { [key: string]: string } = {
      'Alojamiento': '🏨',
      'Alimentacion': '🍽️',
      'Transporte': '🚗',
      'PaseosEcologicos': '🌿'
    }
    return categoryMap[clasificacionTipo] || '📋'
  }

  const getCategoryName = (clasificacionTipo: string) => {
    return clasificacionTipo
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, reload all services
      const loadServices = async () => {
        try {
          setLoading(true)
          const response = await api.get('http://localhost:8080/marketplace-ms/items')
          const servicesArray = Object.values(response.data) as Service[]
          setServices(servicesArray)
          setFilteredServices(servicesArray)
        } catch (err) {
          console.error('Error loading services:', err)
          setError('Error al cargar los servicios')
        } finally {
          setLoading(false)
        }
      }
      loadServices()
      return
    }

    try {
      setLoading(true)
      setError('')
      console.log('Searching services with query:', searchQuery.trim())
      const response = await api.get(`http://localhost:8080/marketplace-ms/items/search?query=${encodeURIComponent(searchQuery.trim())}`)

      // Convert object response to array
      const searchResults = Object.values(response.data) as Service[]
      setServices(searchResults)
      setFilteredServices(searchResults)
      setSelectedCategory('todos') // Reset category filter when searching
    } catch (err) {
      console.error('Error searching services:', err)
      setError('Error al buscar servicios')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Galería de Servicios
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Bienvenido, {user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => navigate('/cart')} variant="outline">
                🛒 Carrito
              </Button>
              <Button onClick={logout} variant="outline">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based content */}
        {hasRole('cliente') && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Panel de Cliente</h2>
            <p className="text-sm text-blue-600 dark:text-blue-300">Explora y reserva servicios turísticos</p>
          </div>
        )}

        {hasRole('proveedor') && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h2 className="text-green-800 dark:text-green-200 font-semibold mb-2">Panel de Proveedor</h2>
            <p className="text-sm text-green-600 dark:text-green-300">Gestiona tus servicios y ofertas</p>
          </div>
        )}

        {/* Search and Category Filters */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Buscar y Filtrar
          </h2>

          {/* Search Input */}
          <div className="flex gap-3 mb-4">
            <Input
              type="text"
              placeholder="Ingrese una categoría"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="max-w-xs"
            />
            <Button onClick={handleSearch} variant="outline">
              Buscar
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Services Gallery */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Servicios Disponibles
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando servicios...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No se encontraron servicios en esta categoría
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                  {/* Service Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-4xl">{getCategoryIcon(service.item.clasificacion.tipo)}</span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {service.item.titulo}
                      </h3>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                        {getCategoryName(service.item.clasificacion.tipo)}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {service.item.descripcion}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        📍 {service.item.clasificacion.lugarInicio}
                      </span>
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        ⭐ {(service.item.calificacionPromedio / 10).toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        👁️ {service.item.visualizaciones} visualizaciones
                      </span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        🏠 {service.item.clasificacion.capacidadMaxima} personas
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${service.item.clasificacion.precio.parsedValue}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/service/${service.item.id}`)}
                      >
                        {hasRole('cliente') ? 'Reservar' : 'Ver Detalles'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared features */}
        {hasAnyRole(['cliente', 'proveedor']) && (
          <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h3 className="text-purple-800 dark:text-purple-200 font-semibold mb-2">
              Funciones Compartidas
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-300 mb-4">
              Herramientas disponibles para todos los usuarios
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">Buscar Servicios</Button>
              <Button variant="outline" size="sm">Mis Favoritos</Button>
              <Button variant="outline" size="sm">Ayuda</Button>
              {hasRole('proveedor') && (
                <Button variant="outline" size="sm">Agregar Servicio</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home