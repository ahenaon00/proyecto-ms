import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from 'react-toastify'
import { reviewsAPI, type Review, type Reply } from "@/lib/api"

interface ReviewsProps {
  itemId: number
}

function Reviews({ itemId }: ReviewsProps) {
  const { hasRole, user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [addingReview, setAddingReview] = useState(false)

  // New review form
  const [rating, setRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')

  // Reply form
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [addingReply, setAddingReply] = useState(false)

  // Cargar reseñas
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const response = await reviewsAPI.getReviews(itemId)
        setReviews(response.data)
      } catch (err) {
        console.error('Error fetching reviews:', err)
        setReviews([])
      } finally {
        setLoading(false)
      }
    }

    if (itemId) {
      fetchReviews()
    }
  }, [itemId])

  const addReview = async () => {
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      toast.error('Por favor complete título y comentario')
      return
    }

    try {
      setAddingReview(true)
      const response = await reviewsAPI.createReview(itemId, {
        puntuacion: rating,
        titulo: reviewTitle.trim(),
        comentario: reviewComment.trim()
      })
      setReviews(prev => [...prev, response.data])
      setRating(5)
      setReviewTitle('')
      setReviewComment('')
      toast.success('Reseña agregada exitosamente')
    } catch (err) {
      console.error('Error adding review:', err)
      toast.error('Error al agregar la reseña')
    } finally {
      setAddingReview(false)
    }
  }

  const addReply = async (reviewId: number) => {
    if (!replyText.trim()) return

    try {
      setAddingReply(true)
      const response = await reviewsAPI.createReply(itemId, reviewId, {
        cuerpo: replyText.trim()
      })

      // Update the review with the new reply
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, replies: [...(review.replies || []), response.data] }
          : review
      ))

      setReplyText('')
      setReplyingTo(null)
      toast.success('Respuesta agregada exitosamente')
    } catch (err) {
      console.error('Error adding reply:', err)
      toast.error('Error al agregar la respuesta')
    } finally {
      setAddingReply(false)
    }
  }

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating)
  }

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Reseñas
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
        Reseñas
      </h2>

      {/* Lista de reseñas existentes */}
      {reviews.length > 0 && (
        <div className="mb-4">
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{renderStars(review.puntuacion)}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {review.titulo}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {review.comentario}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.fechaCreacion).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-4 ml-6 space-y-2">
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="bg-white dark:bg-gray-600 p-3 rounded border-l-4 border-blue-500">
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {reply.cuerpo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(reply.fechaCreacion).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form for providers */}
                {hasRole('PROVEEDOR') && replyingTo !== review.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyingTo(review.id)}
                    className="mt-2"
                  >
                    Responder
                  </Button>
                )}

                {replyingTo === review.id && (
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !addingReply) {
                            addReply(review.id)
                          }
                        }}
                      />
                      <Button
                        onClick={() => addReply(review.id)}
                        disabled={!replyText.trim() || addingReply}
                        size="sm"
                      >
                        {addingReply ? 'Enviando...' : 'Enviar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText('')
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No hay reseñas disponibles.
        </p>
      )}

      {/* Formulario para agregar nueva reseña (usuarios autenticados) */}
      {user && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Agregar Nueva Reseña
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Puntuación
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>
                    {num} {renderStars(num)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título
              </label>
              <Input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Título de la reseña..."
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comentario
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Escribe tu comentario..."
                maxLength={1000}
              />
            </div>

            <Button
              onClick={addReview}
              disabled={!reviewTitle.trim() || !reviewComment.trim() || addingReview}
            >
              {addingReview ? 'Agregando...' : 'Agregar Reseña'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews