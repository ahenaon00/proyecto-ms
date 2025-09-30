import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { toast } from 'react-toastify'
import api from "@/lib/api"

interface CartItemAPI {
  id: number
  idItem: number
  cantidad: number
  precioUnitario: number
  fechaAgregado: string
}

interface ItemDetails {
  id: number
  titulo: string
  descripcion: string
  clasificacion: {
    tipo: string
  }
}

interface CartItem {
  cartId: number
  itemId: number
  cantidad: number
  precioUnitario: number
  fechaAgregado: string
  itemDetails?: ItemDetails
  subtotal: number
}

function Cart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true)
        console.log('Fetching cart items (user ID from JWT)')
        const response = await api.post('/transaction-ms/carrito-compra/list-items-carrito/uid', { uid: "uid" })
        console.log('Cart items response:', response.data)

        const cartItemsAPI: CartItemAPI[] = response.data || []

        // Fetch item details for each cart item
        const cartItemsWithDetails: CartItem[] = await Promise.all(
          cartItemsAPI.map(async (cartItem) => {
            try {
              console.log('Fetching item details for ID:', cartItem.idItem)
              const itemResponse = await api.get(`/marketplace-ms/items/${cartItem.idItem}`)
              const itemDetails: ItemDetails = itemResponse.data.item

              return {
                cartId: cartItem.id,
                itemId: cartItem.idItem,
                cantidad: cartItem.cantidad,
                precioUnitario: cartItem.precioUnitario,
                fechaAgregado: cartItem.fechaAgregado,
                itemDetails,
                subtotal: cartItem.cantidad * cartItem.precioUnitario
              }
            } catch (itemErr) {
              console.error('Error fetching item details for ID:', cartItem.idItem, itemErr)
              // Return cart item without details if item fetch fails
              return {
                cartId: cartItem.id,
                itemId: cartItem.idItem,
                cantidad: cartItem.cantidad,
                precioUnitario: cartItem.precioUnitario,
                fechaAgregado: cartItem.fechaAgregado,
                itemDetails: undefined,
                subtotal: cartItem.cantidad * cartItem.precioUnitario
              }
            }
          })
        )

        setCartItems(cartItemsWithDetails)
      } catch (err) {
        console.error('Error fetching cart items:', err)
        setError('Error al cargar los items del carrito')
      } finally {
        setLoading(false)
      }
    }

    fetchCartItems()
  }, [])

  const getCategoryIcon = (clasificacionTipo?: string) => {
    const categoryMap: { [key: string]: string } = {
      'Alojamiento': '🏨',
      'Alimentacion': '🍽️',
      'Transporte': '🚗',
      'PaseosEcologicos': '🌿'
    }
    return categoryMap[clasificacionTipo || ''] || '📋'
  }

  const removeFromCart = async (cartId: number) => {
    // TODO: Implement remove from cart functionality
    toast.info('Funcionalidad de eliminar próximamente')
  }

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      // TODO: Implement update quantity functionality
      toast.info('Funcionalidad de actualizar cantidad próximamente')
    } catch (err) {
      console.error('Error updating quantity:', err)
      toast.error('Error al actualizar la cantidad')
    }
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando carrito...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mi Carrito de Compras
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {cartItems.length} producto{cartItems.length !== 1 ? 's' : ''} en el carrito
              </p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              ← Continuar Comprando
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ¡Agrega algunos productos para comenzar!
            </p>
            <Button onClick={() => navigate('/')}>
              Explorar Servicios
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.cartId}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Product Image/Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{getCategoryIcon(item.itemDetails?.clasificacion?.tipo)}</span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {item.itemDetails?.titulo || `Producto ${item.itemId}`}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                          {item.itemDetails?.descripcion || 'Descripción no disponible'}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Cantidad:</span>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.cartId, item.cantidad - 1)}
                                disabled={item.cantidad <= 1}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.cantidad}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.cartId, item.cantidad + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              ${item.subtotal.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ${item.precioUnitario.toFixed(2)} c/u
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Resumen del Pedido
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal ({cartItems.length} producto{cartItems.length !== 1 ? 's' : ''})
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      ${getTotal().toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Envío</span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      Gratis
                    </span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${getTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mb-3" size="lg">
                  Proceder al Pago
                </Button>

                <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                  Continuar Comprando
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart