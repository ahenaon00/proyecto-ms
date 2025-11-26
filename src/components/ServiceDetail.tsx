import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from 'react-toastify'
import api, { itemsAPI, type ItemResponse } from "@/lib/api"
import FrequentQuestions from "./FrequentQuestions"
import Reviews from "./Reviews"



// La nueva API devuelve directamente el item con todos los campos
// No necesitamos interfaces complejas para clasificacion separada

function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const [item, setItem] = useState<ItemResponse | null>(null)
  const [clasificacionData, setClasificacionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        setLoading(true)
        console.log('Fetching service detail for ID:', id)
        const response = await itemsAPI.getItem(Number(id))
        console.log('Service detail response:', response.data)
        
        // Manejar estructura legacy del backend (temporal mientras el backend se actualiza)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = response.data as any // TODO: Remove when backend returns new structure
        let processedItem: ItemResponse
        
        if (rawData.item) {
          // Estructura legacy - extraer y combinar datos
          processedItem = {
            ...rawData.item,
            // Asegurar que los campos necesarios estén presentes
            lugarInicio: rawData.item.lugarInicio || rawData.clasificacionData?.lugarInicio || '',
            precio: rawData.item.precio || rawData.clasificacionData?.precio || 0,
            capacidadMaxima: rawData.item.capacidadMaxima || rawData.clasificacionData?.capacidadMaxima || 0,
            fechaDisponibilidadInicio: rawData.item.fechaDisponibilidadInicio || rawData.clasificacionData?.fechaDisponibilidadInicio || '',
            fechaDisponibilidadFin: rawData.item.fechaDisponibilidadFin || rawData.clasificacionData?.fechaDisponibilidadFin || ''
          }
          // Store clasificacionData separately
          setClasificacionData(rawData.clasificacionData)
        } else {
          // Nueva estructura plana
          processedItem = rawData as ItemResponse
        }
        
        console.log('Processed item data:', processedItem)
        setItem(processedItem)
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

  const getCategoryIcon = (clasificacionId: number) => {
    // Mapear clasificacionId a íconos
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

  const addToCart = async () => {
    if (!item || !id) {
      console.log('Missing required data:', { item: !!item, id })
      return
    }

    try {
      setAddingToCart(true)
      console.log('Adding to cart - Item ID:', id, 'Quantity:', quantity, 'Price:', item.precio, '(User ID from JWT)')

      const cartData = {
        uid : "uid",
        cantidad: item.stock > 0 ? quantity : 1,
        precioUnitario: item.precio
      }

      console.log('Sending POST request to:', `/marketplace-ms/items/${id}/add-to-cart`, 'with data:', cartData)
      const response = await api.post(`/marketplace-ms/items/${id}/add-to-cart`, cartData)
      console.log('Add to cart response:', response.data)

      toast.success('¡Producto agregado al carrito exitosamente!')
    } catch (err: unknown) {
      console.error('Error adding to cart:', err)
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

  if (error || !item) {
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
            <span className="text-9xl">{getCategoryIcon(item.clasificacionId)}</span>
          </div>

          <div className="p-8">
            {/* Title and Category */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {item.titulo}
                </h1>
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                  {getCategoryName(item.clasificacionId)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${item.precio}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">por persona</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Descripción</h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                {item.descripcion}
              </p>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ubicación</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  📍 {item.lugarInicio}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Capacidad</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  👥 {item.capacidadMaxima} personas
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Calificación</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ⭐ {(item.calificacionPromedio / 10).toFixed(1)} / 5.0
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Visualizaciones</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  👁️ {item.visualizaciones}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stock Disponible</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  📦 {item.stock}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Publicación</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  📅 {new Date(item.fechaPublicacion).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Accommodation Details (if applicable) - Simplified since some fields may not be available in new API */}
            {item.clasificacionId === 1 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Detalles del Alojamiento
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    Los detalles adicionales del alojamiento están disponibles contactando al proveedor.
                  </p>
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Disponibilidad</h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  Desde: <span className="font-semibold">{new Date(item.fechaDisponibilidadInicio).toLocaleDateString()}</span>
                  {' '} hasta: <span className="font-semibold">{new Date(item.fechaDisponibilidadFin).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* Weather Information - Only for Alojamiento */}
            {clasificacionData && item.clasificacionId === 1 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Información del Clima</h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Temperatura Actual</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.temperaturaActual !== null ? `${clasificacionData.temperaturaActual}°C` : 'null'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Viento</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.viento !== null ? `${clasificacionData.viento} km/h` : 'null'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Código del Clima</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.codigoClima !== null ? clasificacionData.codigoClima : 'null'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Lluvia</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.lluvia !== null ? `${clasificacionData.lluvia} mm` : 'null'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Precipitación</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.precipitacion !== null ? `${clasificacionData.precipitacion} mm` : 'null'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Probabilidad de Precipitación</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.probabilidadPrecipitacion !== null ? `${clasificacionData.probabilidadPrecipitacion}%` : 'null'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Country Information */}
            {clasificacionData && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Información del País</h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">País</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.paisDestino ? (
                            <>
                              {clasificacionData.flag && <span className="mr-2">{clasificacionData.flag}</span>}
                              {clasificacionData.paisDestino}
                            </>
                          ) : 'null'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Población</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.population !== null ? clasificacionData.population.toLocaleString() : 'null'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Índice Gini</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.gini !== null ? clasificacionData.gini : 'null'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Código FIFA</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {clasificacionData.fifa || 'null'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Special Requirements - Removed since not available in new API */}

            {/* Frequent Questions - Now handled by separate component */}
            <FrequentQuestions itemId={item.id} />

            {/* Reviews - Now handled by separate component */}
            <Reviews itemId={item.id} />

             {/* Location Map */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Ubicación</h2>
              {clasificacionData?.maps?.googleMaps ? (
                <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(item.lugarInicio)}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación del servicio"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg flex items-center justify-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    📍 {item.lugarInicio}
                  </p>
                </div>
              )}
              {clasificacionData?.maps?.googleMaps && (
                <div className="mt-2">
                  <a
                    href={clasificacionData.maps.googleMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              )}
            </div>

            {/* Quantity Selector - Only for clients */}
            {hasRole('CLIENTE') && item.stock > 0 && (
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
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      const maxQty = item.stock > 0 ? item.stock : Infinity
                      setQuantity(Math.max(1, Math.min(val, maxQty)))
                    }}
                    className="w-20 text-center"
                    min="1"
                    max={item.stock > 0 ? item.stock : undefined}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const maxQty = item.stock > 0 ? item.stock : Infinity
                      setQuantity(Math.min(quantity + 1, maxQty))
                    }}
                    disabled={item.stock > 0 && quantity >= item.stock}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              {hasRole('CLIENTE') && (
                <>
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
                </>
              )}

              {hasRole('PROVEEDOR') && (
                <>
                  <Button size="lg" className="flex-1" variant="outline">
                    Editar Servicio
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1">
                    Ver Estadísticas
                  </Button>
                </>
              )}

              {!hasRole('CLIENTE') && !hasRole('PROVEEDOR') && (
                <Button size="lg" className="w-full">
                  Ver Detalles
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetail