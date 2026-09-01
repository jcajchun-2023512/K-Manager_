# K-Manager — Sistema de Autenticación y Autorización JWT

K-Manager es una solución robusta y moderna diseñada bajo principios de arquitectura limpia (*Clean Architecture*) y separación de responsabilidades, implementando un sistema completo de autenticación y autorización basado en JSON Web Tokens (JWT). El sistema consta de un **Backend en Node.js con Express y TypeScript** y un **Frontend en Angular** con componentes independientes (*standalone*), interceptores HTTP y control de acceso basado en roles (*RBAC*).

---

## 1. Arquitectura y Diseño del Sistema

La aplicación está diseñada para ser escalable, mantenible y desacoplada tanto en el servidor como en el cliente.

### A. Backend (Node.js / Express / TypeScript)
El servidor sigue una arquitectura en capas estrictamente separadas:
- **`config/`**: Configuración centralizada de variables de entorno (`env.ts`) y conexiones (`database.ts`).
- **`models/`**: Definiciones de entidades de dominio e interfaces de datos (ej. `user.model.ts`).
- **`repositories/`**: Capa de abstracción de datos mediante el patrón Repositorio (`user.repository.ts`). Actualmente implementa un repositorio en memoria para desarrollo rápido y pruebas, desacoplando la lógica de negocio de la persistencia física.
- **`services/`**: Lógica de negocio pura (`auth.service.ts`), encargada de la autenticación, generación de tokens y validación de credenciales.
- **`controllers/`**: Manejadores de peticiones HTTP (`auth.controller.ts`), conectan las rutas con los servicios y gestionan los códigos de estado HTTP.
- **`middlewares/`**: Funciones transversales de seguridad (`auth.middleware.ts`), incluyendo autenticación por token Bearer y autorización por roles requeridos (`requireRole`).
- **`routes/`**: Definición de endpoints de la API REST (`auth.routes.ts`).
- **`utils/`**: Utilidades criptográficas y de gestión de tokens JWT (`jwt.util.ts`).

### B. Frontend (Angular / TypeScript)
El cliente está desarrollado utilizando la arquitectura moderna de Angular con componentes *standalone*:
- **Módulo de Autenticación (`auth/`)**:
  - **`login/`**: Componente de inicio de sesión reactivo con validación de formularios.
  - **`services/auth.service.ts`**: Servicio centralizado de sesión, gestión de tokens en almacenamiento local y comunicación con la API.
  - **`guards/auth.guard.ts`**: Protección de rutas privadas y diferenciación por roles (Admin/User).
  - **`interceptors/jwt.interceptor.ts`**: Interceptor HTTP que inyecta automáticamente el token de autorización en las cabeceras de las solicitudes salientes.
- **Gestión de Recursos Visuales (Assets)**:
  - El diseño visual del login incluye soporte para logotipo (`logo-kmanager.png`) e imagen de fondo corporativa (`hero-kmanager.jpg`).
  - *Mecanismo de Respaldo (Fallback)*: Si los archivos físicos no están presentes en `public/assets/`, la aplicación opera de forma fluida mostrando tipografía corporativa y un degradado estilizado, evitando dependencias externas frágiles o enlaces temporales.

---

## 2. Estructura del Proyecto

```text
kmanager/
├── backend/
│   ├── src/
│   │   ├── config/          # Variables de entorno y configuración de BD
│   │   ├── models/          # Modelos e interfaces de dominio
│   │   ├── repositories/    # Capa de acceso a datos (Patrón Repositorio)
│   │   ├── services/        # Lógica de negocio
│   │   ├── controllers/     # Controladores HTTP
│   │   ├── middlewares/     # Autenticación y control de roles
│   │   ├── routes/          # Rutas de la API REST
│   │   ├── utils/           # Utilidades JWT y criptografía
│   │   ├── app.ts           # Configuración de Express
│   │   └── server.ts        # Punto de entrada del servidor
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    └── kmanager-frontend/
        ├── public/
        │   └── assets/      # Recursos visuales (logo, hero, favicon)
        └── src/
            ├── app/
            │   ├── admin/   # Vista protegida para administradores
            │   ├── auth/    # Módulo de autenticación (Login, Guards, Interceptors)
            │   ├── dashboard/ # Panel principal de usuario autenticado
            │   ├── app.config.ts  # Configuración global e interceptores
            │   └── app.routes.ts  # Enrutamiento y protección de accesos
            └── environments/
                ├── environment.ts
                └── environment.prod.ts
```

---

## 3. Instalación y Puesta en Marcha

El proyecto utiliza **pnpm** como gestor de paquetes eficiente para entornos monorepo o multitrayecto.

### Requisitos Previos
- Node.js (versión 18+ recomendada)
- pnpm (`npm install -g pnpm`)

### A. Backend

1. Navegar al directorio del backend:
   ```bash
   cd backend
   ```
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Configurar las variables de entorno:
   Copiar `.env.example` a `.env` y configurar `PORT`, `JWT_SECRET` y `JWT_REFRESH_SECRET`:
   ```bash
   cp .env.example .env
   ```
4. Iniciar el servidor en modo desarrollo (con recarga en caliente mediante `tsx`):
   ```bash
   pnpm dev
   ```
   *Para producción:*
   ```bash
   pnpm build && pnpm start
   ```
   El servidor quedará activo en `http://localhost:3000`.

### B. Frontend

1. Navegar al directorio del frontend:
   ```bash
   cd frontend/kmanager-frontend
   ```
2. Instalar dependencias (incluyendo decodificadores JWT):
   ```bash
   pnpm install
   ```
3. (Opcional) Colocar los recursos visuales en `public/assets/`:
   - `logo-kmanager.png`
   - `hero-kmanager.jpg`
   *(Si se omiten, la interfaz aplicará automáticamente estilos alternativos por defecto).*
4. Iniciar el servidor de desarrollo de Angular:
   ```bash
   pnpm start
   ```
   La aplicación web estará disponible en `http://localhost:4200`.

---

## 4. Credenciales de Prueba (Mock)

Para pruebas inmediatas del sistema de roles, se encuentran preconfigurados los siguientes usuarios en memoria:

| Usuario | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin123!` | `Admin` | Acceso total al panel de administración y dashboard |
| `user` | `User123!` | `User` | Acceso estándar al dashboard de usuario |

---

## 5. Endpoints de la API REST

| Método | Ruta | Descripción | Autenticación Requerida |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autentica credenciales y devuelve tokens JWT y datos de usuario | No |
| `GET` | `/api/auth/me` | Retorna el perfil y los claims del token actual | Sí (`Bearer Token`) |
| `GET` | `/health` | Healthcheck del estado del servidor | No |

---

## 6. Estrategia de Migración a PostgreSQL (Siguiente Sprint)

La arquitectura del backend está diseñada mediante inversión de dependencias para garantizar una transición transparente hacia una base de datos relacional (PostgreSQL):

1. **Configuración de Conexión (`config/database.ts`)**: Activación del pool de conexiones utilizando `pg` o `PrismaClient` con las credenciales definidas en `.env`.
2. **Repositorio de Producción (`repositories/user.repository.ts`)**: Creación de una clase `PostgresUserRepository implements IUserRepository` que reemplace el almacenamiento en memoria por consultas SQL parametrizadas u ORM.
3. **Desacoplamiento Total**: Los servicios (`auth.service.ts`), controladores y rutas permanecerán intactos al depender exclusivamente de la interfaz `IUserRepository`.

---

## 7. Consideraciones de Seguridad para Producción

- **Claves Secretas**: Asegúrese de utilizar cadenas aleatorias robustas y extensas (32+ bytes) para `JWT_SECRET` y `JWT_REFRESH_SECRET`.
- **Almacenamiento de Tokens**: Evaluar el almacenamiento de `accessToken` en cookies seguras `httpOnly` en lugar de `localStorage` si se requiere mitigación avanzada contra ataques XSS.
- **Limitación de Tasa**: Incorporar middlewares como `express-rate-limit` en el endpoint de autenticación para prevenir ataques de fuerza bruta.
