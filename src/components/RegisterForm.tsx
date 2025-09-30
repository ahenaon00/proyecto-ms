import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import api from "@/lib/api";
import { toast } from "react-toastify";

interface RegisterFormData {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  confirmPassword: string;
  tipoUsuario: "CLIENTE" | "PROVEEDOR";
  edad?: number;
  descripcion?: string;
  telefono?: string;
  direccion?: string;
  imagen?: FileList;
  
  // ✅ CAMPOS ESPECÍFICOS DE PROVEEDOR (sin calificación)
  paginaWeb?: string;
  redesSociales?: string;
}

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<RegisterFormData>();

  const password = watch("password");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("imagen", { message: "La imagen no puede superar 5MB" });
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("imagen", { message: "Solo se permiten imágenes JPG o PNG" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      // Procesar redes sociales si es PROVEEDOR
      let redesSocialesArray: string[] | undefined;
      if (data.tipoUsuario === "PROVEEDOR" && data.redesSociales) {
        redesSocialesArray = data.redesSociales
          .split(",")
          .map(url => url.trim())
          .filter(url => url.length > 0);
      }

      const registerData = {
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        password: data.password,
        tipoUsuario: data.tipoUsuario,
        
        // Campos opcionales existentes
        ...(data.edad && data.edad > 0 && { edad: data.edad }),
        ...(data.descripcion && data.descripcion.trim() && { descripcion: data.descripcion.trim() }),
        ...(data.telefono && data.telefono.trim() && { telefono: data.telefono.trim() }),
        ...(data.direccion && data.direccion.trim() && { direccion: data.direccion.trim() }),
        
        // ✅ CAMPOS ESPECÍFICOS DE PROVEEDOR (sin calificación)
        ...(data.tipoUsuario === "PROVEEDOR" && {
          ...(data.paginaWeb && { paginaWeb: data.paginaWeb }),
          ...(redesSocialesArray && redesSocialesArray.length > 0 && { redesSociales: redesSocialesArray })
        })
      };

      console.log("📤 Datos a enviar:", registerData);

      const response = await api.post("/auth/register", registerData);
      const userId = response.data.id;

      console.log("✅ Usuario creado:", userId);
      toast.success("Usuario registrado exitosamente");

      // Subir imagen si existe
      if (data.imagen && data.imagen[0]) {
        try {
          console.log("📷 Intentando subir imagen...");
          console.log("📷 Archivo:", {
            name: data.imagen[0].name,
            size: data.imagen[0].size,
            type: data.imagen[0].type,
          });
          console.log("📷 User ID:", userId);

          const formData = new FormData();
          formData.append("file", data.imagen[0]);

          const imageResponse = await api.post(
            `/user-ms/users/${userId}/image`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          if (imageResponse.status >= 200 && imageResponse.status < 300) {
            console.log("✅ Imagen subida exitosamente:", imageResponse.data);
          }
        } catch (imageError) {
          console.error("❌ Error específico al subir imagen:", imageError);

          if (
            imageError &&
            typeof imageError === "object" &&
            "response" in imageError
          ) {
            const axiosImageError = imageError as {
              response?: { status?: number; data?: any; statusText?: string };
            };
            console.error("❌ Status:", axiosImageError.response?.status);
            
            if (axiosImageError.response?.status) {
              toast.error(`Error al subir imagen: ${axiosImageError.response.status}`);
            } else {
              toast.error("Error de red al subir imagen");
            }
          } else if (imageError && typeof imageError === "object" && "message" in imageError) {
            const networkError = imageError as { message: string };
            console.error("❌ Error de red:", networkError.message);
            toast.error("Error de red al subir imagen");
          } else {
            console.error("❌ Error desconocido:", imageError);
            toast.error("Error desconocido al subir imagen");
          }

          // No fallar todo el registro por la imagen
          console.log("⚠️ Continuando sin imagen...");
        }
      } else {
        console.log("ℹ️ No se seleccionó imagen");
      }

      // Redirigir a login
      if (onSwitchToLogin) {
        onSwitchToLogin();
      } else {
        window.location.href = "/login";
      }
    } catch (error: unknown) {
      // Type guard para verificar si es un error de axios
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { validationErrors?: Record<string, string> };
          };
        };
        if (axiosError.response?.status === 400) {
          const validationErrors = axiosError.response.data?.validationErrors;
          if (validationErrors) {
            Object.keys(validationErrors).forEach((field) => {
              setError(field as keyof RegisterFormData, {
                message: validationErrors[field],
              });
            });
          }
        } else if (axiosError.response?.status === 409) {
          setError("correo", { message: "El correo ya está registrado" });
        } else {
          console.error("❌ Error al registrar:", axiosError);
          toast.error("Error al registrar usuario");
        }
      } else {
        console.error("❌ Error desconocido:", error);
        toast.error("Error al registrar usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Registro de Usuario
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre *
            </label>
            <Input
              {...register("nombre", {
                required: "El nombre es obligatorio",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
                maxLength: { value: 100, message: "Máximo 100 caracteres" },
              })}
              placeholder="Ingresa tu nombre"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Apellido *
            </label>
            <Input
              {...register("apellido", {
                required: "El apellido es obligatorio",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
                maxLength: { value: 100, message: "Máximo 100 caracteres" },
              })}
              placeholder="Ingresa tu apellido"
              disabled={loading}
            />
            {errors.apellido && (
              <p className="text-red-500 text-sm">{errors.apellido.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo Electrónico *
            </label>
            <Input
              type="email"
              {...register("correo", {
                required: "El correo es obligatorio",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Formato de email inválido",
                },
              })}
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
            {errors.correo && (
              <p className="text-red-500 text-sm">{errors.correo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña *
            </label>
            <Input
              type="password"
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: { value: 6, message: "Mínimo 6 caracteres" },
                maxLength: { value: 50, message: "Máximo 50 caracteres" },
              })}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmar Contraseña *
            </label>
            <Input
              type="password"
              {...register("confirmPassword", {
                required: "Confirma tu contraseña",
                validate: (value) =>
                  value === password || "Las contraseñas no coinciden",
              })}
              placeholder="Confirma tu contraseña"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Usuario *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CLIENTE"
                  {...register("tipoUsuario", {
                    required: "Selecciona un tipo de usuario",
                  })}
                  className="mr-2"
                  disabled={loading}
                />
                CLIENTE
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="PROVEEDOR"
                  {...register("tipoUsuario", {
                    required: "Selecciona un tipo de usuario",
                  })}
                  className="mr-2"
                  disabled={loading}
                />
                PROVEEDOR
              </label>
            </div>
            {errors.tipoUsuario && (
              <p className="text-red-500 text-sm">
                {errors.tipoUsuario.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Edad
            </label>
            <Input
              type="number"
              {...register("edad", {
                min: { value: 18, message: "Debes tener al menos 18 años" },
                max: { value: 120, message: "Edad máxima 120 años" },
              })}
              placeholder="Edad (opcional)"
              disabled={loading}
            />
            {errors.edad && (
              <p className="text-red-500 text-sm">{errors.edad.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              {...register("descripcion", {
                maxLength: { value: 500, message: "Máximo 500 caracteres" },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Describe tu perfil (opcional)"
              rows={3}
              disabled={loading}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Teléfono
            </label>
            <Input
              type="tel"
              {...register("telefono", {
                pattern: {
                  value: /^\+57\d{10}$/,
                  message: "Formato: +573001234567",
                },
              })}
              placeholder="+573001234567"
              disabled={loading}
            />
            {errors.telefono && (
              <p className="text-red-500 text-sm">{errors.telefono.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección
            </label>
            <Input
              {...register("direccion", {
                maxLength: { value: 255, message: "Máximo 255 caracteres" },
              })}
              placeholder="Dirección (opcional)"
              disabled={loading}
            />
            {errors.direccion && (
              <p className="text-red-500 text-sm">{errors.direccion.message}</p>
            )}
          </div>

          {/* ✅ CAMPOS ESPECÍFICOS DE PROVEEDOR (solo 2 campos) */}
          {watch("tipoUsuario") === "PROVEEDOR" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Página Web
                </label>
                <Input
                  type="url"
                  {...register("paginaWeb", {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: "Debe ser una URL válida (http:// o https://)"
                    }
                  })}
                  placeholder="https://mi-negocio.com"
                  disabled={loading}
                />
                {errors.paginaWeb && (
                  <p className="text-red-500 text-sm">{errors.paginaWeb.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Redes Sociales
                </label>
                <Input
                  type="text"
                  {...register("redesSociales")}
                  placeholder="Facebook, Instagram, Twitter (separados por comas)"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: https://facebook.com/mi-negocio, https://instagram.com/mi-negocio
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Imagen de Perfil
            </label>
            <Input
              type="file"
              accept="image/jpeg,image/png"
              {...register("imagen")}
              onChange={handleImageChange}
              disabled={loading}
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-full"
                />
              </div>
            )}
            {errors.imagen && (
              <p className="text-red-500 text-sm">{errors.imagen.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "Registrar"}
          </Button>
        </form>

        <Button
          onClick={() => {
            if (onSwitchToLogin) {
              onSwitchToLogin();
            } else {
              window.location.href = "/login";
            }
          }}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          ¿Ya tienes cuenta? Inicia Sesión
        </Button>
      </div>
    </div>
  );
}

export default RegisterForm;