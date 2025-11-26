import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { itemsAPI, type ItemResponse } from "@/lib/api"

// La nueva API devuelve directamente ItemResponse[], simplificando la estructura

const categories = [
  { id: 'todos', name: 'Todos', icon: '📋', clasificacionId: null },
  { id: 'alojamiento', name: 'Alojamiento', icon: '🏨', clasificacionId: 1 },
  { id: 'alimentacion', name: 'Alimentación', icon: '🍽️', clasificacionId: 2 },
  { id: 'transporte', name: 'Transporte', icon: '🚗', clasificacionId: 3 },
  { id: 'paseos-ecologicos', name: 'Paseos Ecológicos', icon: '🌿', clasificacionId: 4 }
]

function Home() {
  const navigate = useNavigate()
  const { user, logout, hasRole, hasAnyRole } = useAuth()
  const [items, setItems] = useState<ItemResponse[]>([])
  const [filteredItems, setFilteredItems] = useState<ItemResponse[]>([])
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load items from new API
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        console.log('Loading all items via new API')
        const response = await itemsAPI.getItems()
        const rawData = response.data
        console.log('Raw data received:', rawData, 'Type:', typeof rawData, 'IsArray:', Array.isArray(rawData))
        
        // Extraer items de la estructura legacy (backend devuelve {item: {...}, clasificacionData: {...}})
        const itemsArray = Array.isArray(rawData) ? rawData.map((serviceData: any) => {
          if (serviceData.item) {
            // Estructura legacy - extraer item
            return {
              ...serviceData.item,
              // Agregar campos de clasificacionData si no están en item
              lugarInicio: serviceData.item.lugarInicio || serviceData.clasificacionData?.lugarInicio,
              precio: serviceData.item.precio || serviceData.clasificacionData?.precio,
              capacidadMaxima: serviceData.item.capacidadMaxima || serviceData.clasificacionData?.capacidadMaxima,
              fechaDisponibilidadInicio: serviceData.item.fechaDisponibilidadInicio || serviceData.clasificacionData?.fechaDisponibilidadInicio,
              fechaDisponibilidadFin: serviceData.item.fechaDisponibilidadFin || serviceData.clasificacionData?.fechaDisponibilidadFin
            }
          } else {
            // Nueva estructura plana
            return serviceData
          }
        }) : []
        
        console.log('Processed items:', itemsArray)
        setItems(itemsArray)
        setFilteredItems(itemsArray)
      } catch (err) {
        console.error('Error loading items:', err)
        setError('Error al cargar los servicios')
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [])


  // Filter items by category using local filtering
  useEffect(() => {
    if (selectedCategory === 'todos') {
      console.log('Showing all items (no filtering)')
      setFilteredItems(items)
    } else {
      const selectedCat = categories.find(cat => cat.id === selectedCategory)
      if (selectedCat?.clasificacionId) {
        const filtered = items.filter(item => item.clasificacionId === selectedCat.clasificacionId)
        console.log(`Filtering by classification ID ${selectedCat.clasificacionId}:`, filtered.length, 'items found')
        setFilteredItems(filtered)
      } else {
        setFilteredItems(items)
      }
    }
  }, [selectedCategory, items])

  const getCategoryIcon = (clasificacionId: number) => {
    const categoryMap: { [key: number]: string } = {
      1: '🏨', // Alojamiento
      2: '🍽️', // Alimentación
      3: '🚗', // Transporte
      4: '🌿'  // Paseos Ecológicos
    }
    return categoryMap[clasificacionId] || '📋'
  }

  const getCategoryName = (clasificacionId: number) => {
    const categoryMap: { [key: number]: string } = {
      1: 'Alojamiento',
      2: 'Alimentación', 
      3: 'Transporte',
      4: 'Paseos Ecológicos'
    }
    return categoryMap[clasificacionId] || 'Desconocido'
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, reload all items
      try {
        setLoading(true)
        const response = await itemsAPI.getItems()
        const rawData = response.data
        
        // Extraer items de la estructura legacy
        const itemsArray = Array.isArray(rawData) ? rawData.map((serviceData: any) => {
          if (serviceData.item) {
            return {
              ...serviceData.item,
              lugarInicio: serviceData.item.lugarInicio || serviceData.clasificacionData?.lugarInicio,
              precio: serviceData.item.precio || serviceData.clasificacionData?.precio,
              capacidadMaxima: serviceData.item.capacidadMaxima || serviceData.clasificacionData?.capacidadMaxima,
              fechaDisponibilidadInicio: serviceData.item.fechaDisponibilidadInicio || serviceData.clasificacionData?.fechaDisponibilidadInicio,
              fechaDisponibilidadFin: serviceData.item.fechaDisponibilidadFin || serviceData.clasificacionData?.fechaDisponibilidadFin
            }
          } else {
            return serviceData
          }
        }) : []
        
        setItems(itemsArray)
        setFilteredItems(itemsArray)
      } catch (err) {
        console.error('Error loading items:', err)
        setError('Error al cargar los servicios')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      setError('')
      console.log('Searching items with query:', searchQuery.trim())
      const response = await itemsAPI.searchItems(searchQuery.trim())
      const rawData = response.data
      
      // Extraer items de la estructura legacy
      const itemsArray = Array.isArray(rawData) ? rawData.map((serviceData: any) => {
        if (serviceData.item) {
          return {
            ...serviceData.item,
            lugarInicio: serviceData.item.lugarInicio || serviceData.clasificacionData?.lugarInicio,
            precio: serviceData.item.precio || serviceData.clasificacionData?.precio,
            capacidadMaxima: serviceData.item.capacidadMaxima || serviceData.clasificacionData?.capacidadMaxima,
            fechaDisponibilidadInicio: serviceData.item.fechaDisponibilidadInicio || serviceData.clasificacionData?.fechaDisponibilidadInicio,
            fechaDisponibilidadFin: serviceData.item.fechaDisponibilidadFin || serviceData.clasificacionData?.fechaDisponibilidadFin
          }
        } else {
          return serviceData
        }
      }) : []
      
      console.log('Search results processed:', itemsArray)
      setItems(itemsArray)
      setFilteredItems(itemsArray)
      setSelectedCategory('todos') // Reset category filter when searching
    } catch (err) {
      console.error('Error searching items:', err)
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
        {hasRole('CLIENTE') && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Panel de Cliente</h2>
            <p className="text-sm text-blue-600 dark:text-blue-300">Explora y reserva servicios turísticos</p>
          </div>
        )}

        {hasRole('PROVEEDOR') && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-green-800 dark:text-green-200 font-semibold mb-2">Panel de Proveedor</h2>
                <p className="text-sm text-green-600 dark:text-green-300">Gestiona tus servicios y ofertas</p>
              </div>
              <Button onClick={() => navigate('/create-service')} className="bg-green-600 hover:bg-green-700">
                + Crear Servicio
              </Button>
            </div>
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
                key={`category-${category.id}`}
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
              {filteredItems.length} servicio{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
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
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No se encontraron servicios en esta categoría
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.filter(item => item && item.id).map((item) => (
                <div
                  key={`item-${item.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                  {/* Service Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-4xl">{getCategoryIcon(item.clasificacionId)}</span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.titulo}
                      </h3>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                        {getCategoryName(item.clasificacionId)}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {item.descripcion}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        📍 {item.lugarInicio}
                      </span>
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        ⭐ {(item.calificacionPromedio / 10).toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        👁️ {item.visualizaciones} visualizaciones
                      </span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        🏠 {item.capacidadMaxima} personas
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${item.precio}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/service/${item.id}`)}
                      >
                        {hasRole('CLIENTE') ? 'Reservar' : 'Ver Detalles'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared features */}
        {hasAnyRole(['CLIENTE', 'PROVEEDOR']) && (
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
              {hasRole('PROVEEDOR') && (
                <Button variant="outline" size="sm" onClick={() => navigate('/create-service')}>
                  Gestionar Servicios
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
