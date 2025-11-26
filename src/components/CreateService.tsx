import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from 'react-toastify'
import { itemsAPI, servicesAPI } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Service type definitions
const SERVICE_TYPES = [
  { id: 1, name: 'Alojamiento', value: 'Alojamiento' },
  { id: 2, name: 'Alimentación', value: 'Alimentacion' },
  { id: 3, name: 'Transporte', value: 'Transporte' },
  { id: 4, name: 'Paseos Ecológicos', value: 'PaseosEcologicos' }
]

// Base service data interface
interface BaseServiceData {
  tipo: string
  lugarInicio: string
  precio: number
  fechaDisponibilidadInicio: string
  fechaDisponibilidadFin: string
  capacidadMaxima: number
  usuarioId: string
  paisDestino: string
}

// Alimentacion specific fields
interface AlimentacionData extends BaseServiceData {
  horaInicio: string
  horaFinal: string
  tipoComida: string
  menuIncluido: string
  latitud: number
  longitud: number
  requisitosEspeciales: Array<{ nombre: string; descripcion: string }>
  restriccionesDieteticas: Array<{ nombre: string; descripcion: string }>
}

// Alojamiento specific fields
interface AlojamientoData extends BaseServiceData {
  fechaCheckin: string
  fechaCheckout: string
  tipoInmueble: string
  numeroBanos: number
  numeroHabitaciones: number
  lat: number
  lng: number
  direccion: string
}

type ServiceData = AlimentacionData | AlojamientoData

function CreateService() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedType, setSelectedType] = useState('')
  const [loading, setLoading] = useState(false)

  // Common fields
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [lugarInicio, setLugarInicio] = useState('')
  const [precio, setPrecio] = useState('')
  const [fechaDisponibilidadInicio, setFechaDisponibilidadInicio] = useState('')
  const [fechaDisponibilidadFin, setFechaDisponibilidadFin] = useState('')
  const [capacidadMaxima, setCapacidadMaxima] = useState('')
  const [paisDestino, setPaisDestino] = useState('Colombia')

  // Item specific fields
  const [stock, setStock] = useState('')
  const [fechaPublicacion, setFechaPublicacion] = useState('')

  // Service creation state
  const [serviceResponse, setServiceResponse] = useState<any>(null)
  const [showItemForm, setShowItemForm] = useState(false)

  // Alimentacion specific fields
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFinal, setHoraFinal] = useState('')
  const [tipoComida, setTipoComida] = useState('')
  const [menuIncluido, setMenuIncluido] = useState('')
  const [latitud, setLatitud] = useState('')
  const [longitud, setLongitud] = useState('')

  // Alojamiento specific fields
  const [fechaCheckin, setFechaCheckin] = useState('')
  const [fechaCheckout, setFechaCheckout] = useState('')
  const [tipoInmueble, setTipoInmueble] = useState('')
  const [numeroBanos, setNumeroBanos] = useState('')
  const [numeroHabitaciones, setNumeroHabitaciones] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [direccion, setDireccion] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType || !titulo || !descripcion || !lugarInicio || !precio) {
      toast.error('Por favor complete todos los campos requeridos')
      return
    }

    // Validate dates
    const validateDate = (dateStr: string, fieldName: string) => {
      if (!dateStr) return true; // Optional fields
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        toast.error(`${fieldName} debe ser una fecha válida`);
        return false;
      }
      return true;
    };

    if (!validateDate(fechaDisponibilidadInicio, 'Fecha Disponibilidad Inicio')) return;
    if (!validateDate(fechaDisponibilidadFin, 'Fecha Disponibilidad Fin')) return;
    if (selectedType === 'Alojamiento') {
      if (!validateDate(fechaCheckin, 'Fecha Check-in')) return;
      if (!validateDate(fechaCheckout, 'Fecha Check-out')) return;
    }

    // Validate item fields
    if (!stock || parseInt(stock) < 0) {
      toast.error('Stock debe ser un número positivo');
      return;
    }
    if (!fechaPublicacion) {
      toast.error('Fecha de publicación es requerida');
      return;
    }

    try {
      setLoading(true)

      let serviceData: ServiceData

      if (selectedType === 'Alimentacion') {
        serviceData = {
          tipo: selectedType,
          lugarInicio,
          precio: parseFloat(precio),
          fechaDisponibilidadInicio: new Date(fechaDisponibilidadInicio + 'T00:00:00').toISOString(),
          fechaDisponibilidadFin: new Date(fechaDisponibilidadFin + 'T00:00:00').toISOString(),
          capacidadMaxima: parseInt(capacidadMaxima),
          usuarioId: user?.id || "proveedor123",
          paisDestino,
          horaInicio,
          horaFinal,
          tipoComida,
          menuIncluido,
          latitud: parseFloat(latitud),
          longitud: parseFloat(longitud),
          requisitosEspeciales: [],
          restriccionesDieteticas: []
        } as AlimentacionData
      } else if (selectedType === 'Alojamiento') {
        serviceData = {
          tipo: selectedType,
          lugarInicio,
          precio: parseFloat(precio),
          fechaDisponibilidadInicio: new Date(fechaDisponibilidadInicio + 'T00:00:00').toISOString(),
          fechaDisponibilidadFin: new Date(fechaDisponibilidadFin + 'T00:00:00').toISOString(),
          capacidadMaxima: parseInt(capacidadMaxima),
          usuarioId: user?.id || "proveedor123",
          paisDestino,
          fechaCheckin: new Date(fechaCheckin + 'T00:00:00').toISOString(),
          fechaCheckout: new Date(fechaCheckout + 'T00:00:00').toISOString(),
          tipoInmueble,
          numeroBanos: parseInt(numeroBanos),
          numeroHabitaciones: parseInt(numeroHabitaciones),
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          direccion
        } as AlojamientoData
      } else {
        throw new Error('Tipo de servicio no soportado')
      }

      console.log('Creating service with data:', serviceData)

      // Send to specific service endpoint based on type
      let serviceResponse;
      if (selectedType === 'Alojamiento') {
        serviceResponse = await servicesAPI.createAlojamiento(serviceData)
      } else if (selectedType === 'Alimentacion') {
        serviceResponse = await servicesAPI.createAlimentacion(serviceData)
      } else if (selectedType === 'Transporte') {
        serviceResponse = await servicesAPI.createTransporte(serviceData)
      } else if (selectedType === 'PaseosEcologicos') {
        serviceResponse = await servicesAPI.createPaseosEcologico(serviceData)
      } else {
        throw new Error('Tipo de servicio no soportado')
      }

      const serviceId = serviceResponse.data.id;
      console.log('Service created with id:', serviceId)

      // Now create the item
      const clasificacionId = SERVICE_TYPES.find(t => t.value === selectedType)?.id || 1;
      const itemData = {
        id: serviceId,
        clasificacionId,
        titulo,
        descripcion,
        stock: parseInt(stock),
        fechaPublicacion
      };

      console.log('Creating item with data:', itemData);
      await itemsAPI.createFullItem(itemData);
      console.log('Item created successfully');

      toast.success('Servicio creado exitosamente!')
      navigate('/')

    } catch (error) {
      console.error('Error creating service:', error)
      toast.error('Error al crear el servicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crear Nuevo Servicio
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Complete el formulario para crear un nuevo servicio
              </p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              ← Volver
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Servicio *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Seleccione un tipo</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type.id} value={type.value}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <Input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Nombre del servicio"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lugar de Inicio *
                </label>
                <Input
                  type="text"
                  value={lugarInicio}
                  onChange={(e) => setLugarInicio(e.target.value)}
                  placeholder="Ciudad de origen"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción *
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descripción detallada del servicio"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacidad Máxima
                </label>
                <Input
                  type="number"
                  value={capacidadMaxima}
                  onChange={(e) => setCapacidadMaxima(e.target.value)}
                  placeholder="Número de personas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  País Destino
                </label>
                <Input
                  type="text"
                  value={paisDestino}
                  onChange={(e) => setPaisDestino(e.target.value)}
                  placeholder="País"
                />
              </div>
            </div>

            {/* Item specific fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Inicial
                </label>
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Cantidad disponible"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Publicación
                </label>
                <Input
                  type="date"
                  value={fechaPublicacion}
                  onChange={(e) => setFechaPublicacion(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Disponibilidad Inicio
                </label>
                <Input
                  type="date"
                  value={fechaDisponibilidadInicio}
                  onChange={(e) => setFechaDisponibilidadInicio(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Disponibilidad Fin
                </label>
                <Input
                  type="date"
                  value={fechaDisponibilidadFin}
                  onChange={(e) => setFechaDisponibilidadFin(e.target.value)}
                />
              </div>
            </div>

            {/* Alimentacion Specific Fields */}
            {selectedType === 'Alimentacion' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Detalles de Alimentación
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora Inicio
                    </label>
                    <Input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora Final
                    </label>
                    <Input
                      type="time"
                      value={horaFinal}
                      onChange={(e) => setHoraFinal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Comida
                    </label>
                    <select
                      value={tipoComida}
                      onChange={(e) => setTipoComida(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccione tipo</option>
                      <option value="Desayuno">Desayuno</option>
                      <option value="Almuerzo">Almuerzo</option>
                      <option value="Cena">Cena</option>
                      <option value="Merienda">Merienda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Menú Incluido
                    </label>
                    <Input
                      type="text"
                      value={menuIncluido}
                      onChange={(e) => setMenuIncluido(e.target.value)}
                      placeholder="Café, jugo, frutas, pan..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitud
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={latitud}
                      onChange={(e) => setLatitud(e.target.value)}
                      placeholder="4.7110"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitud
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={longitud}
                      onChange={(e) => setLongitud(e.target.value)}
                      placeholder="-74.0721"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Alojamiento Specific Fields */}
            {selectedType === 'Alojamiento' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Detalles de Alojamiento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Check-in
                    </label>
                    <Input
                      type="date"
                      value={fechaCheckin}
                      onChange={(e) => setFechaCheckin(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Check-out
                    </label>
                    <Input
                      type="date"
                      value={fechaCheckout}
                      onChange={(e) => setFechaCheckout(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Inmueble
                    </label>
                    <select
                      value={tipoInmueble}
                      onChange={(e) => setTipoInmueble(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccione tipo</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Hostal">Hostal</option>
                      <option value="Cabaña">Cabaña</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Baños
                    </label>
                    <Input
                      type="number"
                      value={numeroBanos}
                      onChange={(e) => setNumeroBanos(e.target.value)}
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Habitaciones
                    </label>
                    <Input
                      type="number"
                      value={numeroHabitaciones}
                      onChange={(e) => setNumeroHabitaciones(e.target.value)}
                      placeholder="2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección Completa
                  </label>
                  <Input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Carrera 7 #23-45, Chapinero, Bogotá"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitud
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="4.7110"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitud
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="-74.0721"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedType}
              >
                {loading ? 'Creando...' : 'Crear Servicio'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateService