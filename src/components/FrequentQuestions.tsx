import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from 'react-toastify'
import { preguntasAPI, type PreguntaFrecuente } from "@/lib/api"

interface FrequentQuestionsProps {
  itemId: number
}

function FrequentQuestions({ itemId }: FrequentQuestionsProps) {
  const { hasRole } = useAuth()
  const [preguntas, setPreguntas] = useState<PreguntaFrecuente[]>([])
  const [loading, setLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState('')
  const [addingQuestion, setAddingQuestion] = useState(false)

  // Cargar preguntas frecuentes
  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
        setLoading(true)
        const response = await preguntasAPI.getPreguntas(itemId)
        setPreguntas(response.data)
      } catch (err) {
        console.error('Error fetching preguntas:', err)
        // Si hay error, solo mostrar array vacío sin toast para no molestar
        setPreguntas([])
      } finally {
        setLoading(false)
      }
    }

    if (itemId) {
      fetchPreguntas()
    }
  }, [itemId])

  const addQuestion = async () => {
    if (!newQuestion.trim()) return

    try {
      setAddingQuestion(true)
      const response = await preguntasAPI.createPregunta(itemId, { pregunta: newQuestion.trim() })
      setPreguntas(prev => [...prev, response.data])
      setNewQuestion('')
      toast.success('Pregunta agregada exitosamente')
    } catch (err) {
      console.error('Error adding question:', err)
      toast.error('Error al agregar la pregunta')
    } finally {
      setAddingQuestion(false)
    }
  }

  const deleteQuestion = async (preguntaId: number) => {
    try {
      await preguntasAPI.deletePregunta(itemId, preguntaId)
      setPreguntas(prev => prev.filter(q => q.id !== preguntaId))
      toast.success('Pregunta eliminada exitosamente')
    } catch (err) {
      console.error('Error deleting question:', err)
      toast.error('Error al eliminar la pregunta')
    }
  }

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Preguntas Frecuentes
        </h2>
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
        Preguntas Frecuentes
      </h2>

      {/* Lista de preguntas existentes */}
      {preguntas.length > 0 && (
        <div className="mb-4">
          <ul className="space-y-2">
            {preguntas.map((pregunta) => (
              <li key={pregunta.id} className="flex items-start justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex-1">
                  <span className="text-gray-700 dark:text-gray-300">{pregunta.pregunta}</span>
                </div>
                {hasRole('proveedor') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteQuestion(pregunta.id)}
                    className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Eliminar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preguntas.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No hay preguntas frecuentes disponibles.
        </p>
      )}

      {/* Formulario para agregar nueva pregunta (solo proveedores) */}
      {hasRole('proveedor') && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Agregar Nueva Pregunta
          </h3>
          <div className="flex gap-2">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Escribe la pregunta frecuente..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !addingQuestion) {
                  addQuestion()
                }
              }}
            />
            <Button 
              onClick={addQuestion} 
              disabled={!newQuestion.trim() || addingQuestion}
            >
              {addingQuestion ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FrequentQuestions