# Task Manager

> 🌐 [English version](./README.md)

Aplicación fullstack de gestión de tareas donde cada usuario tiene su propio espacio de trabajo privado para crear, organizar y hacer seguimiento de tareas. Desarrollada como prueba técnica para demostrar decisiones a nivel productivo en todo el stack — desde el diseño de la API hasta el deploy en la nube.

---

## Tabla de contenidos

- [Cómo funciona (perspectiva del usuario)](#cómo-funciona-perspectiva-del-usuario)
- [Stack tecnológico](#stack-tecnológico)
- [Visión general de la arquitectura](#visión-general-de-la-arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecutar localmente](#ejecutar-localmente)
- [Referencia de la API](#referencia-de-la-api)
- [Deploy en AWS](#deploy-en-aws)

---

## Cómo funciona (perspectiva del usuario)

Al abrir la aplicación se llega a la pantalla de login. No hay flujo de registro — las cuentas están pre-cargadas (ver credenciales de demo más abajo). Se ingresa el email y la contraseña, se hace clic en **Iniciar sesión** y listo.

Una vez autenticado se ve la lista personal de tareas. Desde ahí se puede:

- **Crear una tarea** haciendo clic en el botón **Nueva tarea** en la esquina superior derecha. Se abre un modal donde se completa el título (requerido), una descripción opcional, el estado, la prioridad y una fecha de vencimiento opcional.
- **Editar una tarea** haciendo clic en **Editar** en cualquier fila. El mismo modal se abre con los valores actuales de la tarea.
- **Eliminar una tarea** haciendo clic en **Eliminar**. Una confirmación evita eliminaciones accidentales.
- **Filtrar tareas** usando los botones debajo del encabezado — se puede acotar la lista a tareas *Pendientes*, *En progreso* o *Completadas*. El cambio de filtro es instantáneo; la lista se actualiza sin recargar la página.
- **Cambiar el idioma** usando el selector EN / ES en el encabezado. La aplicación está completamente traducida al inglés y al español, y la preferencia se guarda entre sesiones.

Los datos de cada usuario están completamente aislados — solo se pueden ver y gestionar las tareas que pertenecen a la propia cuenta.

### Vista de administrador

La cuenta `admin` tiene una vista de solo lectura de todas las tareas del sistema. Cuando un administrador inicia sesión ve una lista **Todas las tareas** con una columna **Propietario** extra que muestra a quién pertenece cada tarea. El administrador dispone de dos filas de filtros: el filtro estándar por estado y una segunda fila para filtrar por prioridad (*Baja*, *Media*, *Alta*). Las acciones de crear, editar y eliminar no están disponibles para los administradores — su rol es estrictamente de observación.

---

## Stack tecnológico

| Capa        | Tecnología                                                         |
|-------------|--------------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite 5, Tailwind CSS v3, React Query v5     |
| Backend     | NestJS, TypeScript, TypeORM, Passport JWT                          |
| Base de datos | SQLite 3 mediante `better-sqlite3`                               |
| Autenticación | JWT (HS256), hash de contraseñas con bcrypt                     |
| Testing     | Vitest, React Testing Library                                      |
| Cloud       | AWS Elastic Beanstalk (API), S3 + CloudFront (frontend)            |

---

## Visión general de la arquitectura

### Backend

La API sigue una arquitectura en capas — los controladores manejan las preocupaciones HTTP, los servicios tienen la lógica de negocio y los repositorios de TypeORM manejan la persistencia. Nada se filtra entre capas.

La autenticación es sin estado: al hacer login el servidor devuelve un JWT firmado (HS256, vencimiento en 7 días) que el cliente guarda en `localStorage` y adjunta a cada solicitud posterior mediante un encabezado `Authorization: Bearer`. La estrategia JWT de NestJS valida el token e inyecta el payload del usuario en el contexto de la solicitud.

Los cambios de esquema pasan por archivos de migración TypeORM versionados — `synchronize: false` está configurado en TypeORM para que el esquema de la base de datos nunca se modifique automáticamente en tiempo de ejecución.

Cada consulta de tareas incluye una cláusula `WHERE owner_id = :userId` aplicada en la capa de servicio, por lo que no hay posibilidad de filtración de datos entre usuarios aunque un cliente envíe un ID de tarea falsificado. Los usuarios administradores omiten esta cláusula — el servicio detecta `role === 'admin'` y hace un `LEFT JOIN` con la tabla de usuarios para adjuntar el nombre del propietario a cada tarea.

### Frontend

El estado está dividido por responsabilidad:

- `AuthContext` gestiona el estado de autenticación (usuario actual, login, logout). Lee el token y el usuario de `localStorage` al arrancar, por lo que las sesiones sobreviven a recargas de página.
- React Query gestiona todo el estado del servidor — lista de tareas, mutaciones (crear, actualizar, eliminar), caché y refetch en segundo plano. El caché tiene un stale time de 30 segundos y hace refetch cuando la ventana recupera el foco.
- `LangContext` gestiona el idioma de la interfaz. Lee el locale guardado en `localStorage` y expone una función `t()` tipada que los componentes usan para obtener cadenas traducidas. Sin librería i18n externa — el diccionario es un objeto tipado plano.

Las páginas son coordinadores delgados. Conectan contextos y hooks entre sí pero no contienen lógica de negocio propia.

### Cloud (AWS)

```
                    ┌──────────────────────────┐
                    │         Route 53          │
                    │   (dominio personalizado) │
                    └───────────┬───────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
   ┌──────────▼──────────┐           ┌────────────▼────────────┐
   │     CloudFront      │           │   Elastic Beanstalk     │
   │  (CDN + HTTPS/SSL)  │           │   (NestJS API, Node 20) │
   └──────────┬──────────┘           └────────────┬────────────┘
              │  comportamiento /api/*             │
              │  proxied al origen EB             │
   ┌──────────▼──────────┐           ┌────────────▼────────────┐
   │     S3 Bucket       │           │      instancia EC2      │
   │  (dist React SPA)   │           │  /var/app/current/data  │
   └─────────────────────┘           │    tasks.db (SQLite)    │
                                     └─────────────────────────┘
```

CloudFront sirve el frontend estático y hace proxy de las solicitudes `/api/*` al origen de Elastic Beanstalk. Esto significa que el navegador siempre habla con un único dominio HTTPS — sin problemas de contenido mixto, sin necesidad de configurar CORS en producción.

> **Nota sobre SQLite**: funciona bien para deployments de instancia única. Si se necesita escalar horizontalmente, se puede reemplazar por RDS PostgreSQL — solo el driver de TypeORM y el connection string necesitan cambiar.

---

## Estructura del proyecto

```
task-manager/
├── backend/
│   ├── src/
│   │   ├── auth/          # Estrategia JWT, endpoint de login
│   │   ├── tasks/         # CRUD de tareas, DTOs, entidad
│   │   ├── users/         # Entidad y servicio de usuarios
│   │   └── database/      # Migraciones y script de seed
│   ├── .ebextensions/     # Configuración de Elastic Beanstalk
│   ├── .platform/         # Hooks post-deploy (migrate + seed)
│   └── Procfile
└── frontend/
    ├── src/
    │   ├── api/           # Cliente Axios y módulos por recurso
    │   ├── components/ui/ # Button, Badge, Input, Select, Modal, Spinner
    │   ├── context/       # AuthContext, LangContext
    │   ├── hooks/         # useTasks — queries y mutaciones
    │   ├── i18n/          # Diccionario de traducciones (EN / ES)
    │   ├── pages/         # LoginPage, TaskListPage, TaskForm
    │   ├── test/          # Tests con Vitest + React Testing Library
    │   ├── types/         # Tipos TypeScript compartidos
    │   └── utils/         # Helpers, mapas de estilos, wrapper de localStorage
    └── vite.config.ts
```

---

## Ejecutar localmente

### Requisitos previos

- Node.js >= 18
- npm >= 9

### Backend

```bash
cd backend
cp .env.example .env      # configurar JWT_SECRET con una cadena larga aleatoria
npm install
npm run migration:run     # crea las tablas de usuarios y tareas
npm run seed              # crea 3 usuarios de demo
npm run start:dev         # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

El servidor de desarrollo de Vite hace proxy de todas las solicitudes `/api` a `http://localhost:3000`, por lo que no se necesita configuración de CORS durante el desarrollo.

### Credenciales de demo

| Nombre | Email                   | Contraseña  | Rol   |
|--------|-------------------------|-------------|-------|
| Mario  | mario@taskmanager.dev   | Mario123!   | user  |
| Luigi  | luigi@taskmanager.dev   | Luigi123!   | user  |
| Bowser | bowser@taskmanager.dev  | Bowser123!  | user  |
| Admin  | admin@taskmanager.dev   | Admin123!   | admin |

### Ejecutar tests

```bash
cd frontend
npm test               # ejecutar una vez
npm run test:watch     # modo watch (re-ejecuta al guardar)
npm run test:coverage  # con reporte de cobertura
```

---

## Referencia de la API

Todos los endpoints de tareas requieren `Authorization: Bearer <token>`.

| Método | Ruta                  | Descripción                                                       |
|--------|-----------------------|-------------------------------------------------------------------|
| POST   | `/api/auth/login`     | Login — devuelve `access_token`                                   |
| GET    | `/api/tasks`          | Listar tareas (opcionales `?status=` y/o `?priority=`)            |
| POST   | `/api/tasks`          | Crear una tarea                                                   |
| PUT    | `/api/tasks/:id`      | Actualizar una tarea                                              |
| DELETE | `/api/tasks/:id`      | Eliminar una tarea                                                |

> Los administradores que llaman a `GET /api/tasks` reciben todas las tareas sin importar el propietario. Los usuarios regulares siempre reciben solo sus propias tareas.

**Respuesta de login:**
```json
{
  "access_token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Mario",
    "email": "mario@taskmanager.dev",
    "role": "user | admin"
  }
}
```

**Objeto tarea:**
```json
{
  "id": "uuid",
  "title": "Mi tarea",
  "description": "Detalles opcionales",
  "status": "pending | in_progress | completed",
  "priority": "low | medium | high",
  "due_date": "2026-04-30T00:00:00.000Z | null",
  "owner_id": "uuid",
  "owner": { "id": "uuid", "name": "Mario", "email": "mario@taskmanager.dev" },
  "created_at": "...",
  "updated_at": "..."
}
```

> `owner` solo se incluye en las respuestas de administrador. Las respuestas de usuarios regulares no lo incluyen.

---

## Deploy en AWS

### Requisitos previos

```bash
# AWS CLI v2
brew install awscli
aws configure   # Access Key ID, Secret, región (us-east-1), output: json

# EB CLI
pip install awsebcli

# Verificar
aws sts get-caller-identity
eb --version
```

---

### Backend — Elastic Beanstalk

#### 1. Build

```bash
cd backend && npm ci && npm run build
```

#### 2. Inicializar la aplicación EB (solo la primera vez)

```bash
eb init task-manager --platform "Node.js 20" --region us-east-1
```

Esto crea `.elasticbeanstalk/config.yml` localmente — está en el gitignore, no commitear.

#### 3. Crear el entorno

```bash
eb create task-manager-prod \
  --instance-type t3.micro \
  --single
```

#### 4. Configurar variables de entorno

```bash
eb setenv \
  JWT_SECRET="reemplazar-con-un-secreto-largo-aleatorio-min-32-chars" \
  NODE_ENV="production" \
  PORT="8080"
```

#### 5. Deploy

```bash
eb deploy task-manager-prod
# o mediante el script unificado:
./scripts/deploy.sh backend
```

#### 6. Verificar

```bash
eb status
eb logs

curl -s -X POST https://<tu-url-eb>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mario@taskmanager.dev","password":"Mario123!"}'
```

#### Cómo funcionan `.ebextensions` y `.platform`

| Archivo/Dir | Propósito |
|-------------|-----------|
| `.ebextensions/01_node.config` | Fija Node.js en v20, configura `NODE_ENV` y `PORT` |
| `.ebextensions/02_sqlite.config` | Crea el directorio de datos y configura permisos de escritura para el archivo SQLite |
| `.platform/hooks/postdeploy/01_migrate_and_seed.sh` | Ejecuta migraciones y seed después de cada deploy — usar un hook post-deploy garantiza que el bundle de la app esté completamente en su lugar antes de que corra el script |

---

### Frontend — S3 + CloudFront

#### 1. Crear el bucket S3

```bash
aws s3 mb s3://task-manager-frontend-prod --region us-east-1

aws s3api put-public-access-block \
  --bucket task-manager-frontend-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### 2. Crear la distribución CloudFront

Ir a **AWS Console → CloudFront → Create distribution**:

| Configuración | Valor |
|---------------|-------|
| Origin domain | `task-manager-frontend-prod.s3.us-east-1.amazonaws.com` |
| Origin access | Origin Access Control (OAC) |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Default root object | `index.html` |
| Custom error response | 403 → `/index.html` con status 200 (requerido para routing client-side de la SPA) |

Agregar un segundo comportamiento para `/api/*` apuntando al origen de Elastic Beanstalk con:
- Cache policy: CachingDisabled
- Origin request policy: AllViewerExceptHostHeader (reenvía el encabezado `Authorization`)

#### 3. Configurar la URL de la API para producción

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://<tu-dominio-cloudfront>
```

#### 4. Deploy

```bash
S3_BUCKET=task-manager-frontend-prod \
CF_DISTRIBUTION_ID=EXXXXXXXXX \
./scripts/deploy-frontend.sh
```

El script buildea la app, sincroniza `dist/` a S3 (`Cache-Control: immutable` en assets con hash, `no-cache` en `index.html`) e invalida la distribución de CloudFront.

> También se puede usar el script unificado: `./scripts/deploy.sh frontend`

#### 5. Verificar

```bash
aws cloudfront get-invalidation \
  --distribution-id EXXXXXXXXX \
  --id <invalidation-id>
```

---

### Re-deployar después de cambios

Copiar `.env.deploy.example` a `.env.deploy` una sola vez y completar los valores:

```bash
cp .env.deploy.example .env.deploy
# editar .env.deploy con EB_ENV, S3_BUCKET y CF_DISTRIBUTION_ID
```

Luego deployar con un solo comando:

```bash
./scripts/deploy.sh all        # backend + frontend
./scripts/deploy.sh backend    # solo backend
./scripts/deploy.sh frontend   # solo frontend
```

El script lee la configuración de `.env.deploy`, buildea el o los targets, y maneja el deploy completo — EB para el backend, sincronización S3 + invalidación de CloudFront para el frontend.
