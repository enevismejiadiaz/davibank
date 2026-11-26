# Portal de Pago DAVIbank — Documentación técnica

**Versión:** 1.0.0  
**Fecha:** 2026-11-25  
**Área:** Desarrollo / Maquetación interna  

---

## 1. Descripción general

Maquetación del portal de pago electrónico PSE de DAVIbank.  
Permite al usuario completar un flujo de 4 pasos para realizar un pago;
esta versión implementa el **Paso 1** (datos del titular) y el **Paso 2** (detalles del pago).

---

## 2. Tecnologías utilizadas

| Tecnología         | Versión  | Rol                                      |
|--------------------|----------|------------------------------------------|
| Node.js            | ≥ 18.x   | Entorno de ejecución                     |
| Express            | ^4.18.2  | Servidor HTTP y enrutamiento             |
| express-handlebars | ^7.1.2   | Motor de plantillas (vistas .hbs)        |
| Tailwind CSS       | CDN 3.x  | Estilos (utility-first CSS)              |
| nodemon            | ^3.0.2   | Recarga automática en desarrollo         |

---

## 3. Estructura del proyecto

```
portal-pago/
├── app.js                  ← Punto de entrada del servidor
├── package.json            ← Dependencias y scripts NPM
├── routes/
│   └── index.js            ← Definición de rutas (GET/POST)
├── views/
│   ├── layouts/
│   │   └── main.hbs        ← Layout HTML base (head, body wrapper)
│   ├── partials/
│   │   ├── header.hbs      ← Cabecera compartida (logo + botón cerrar)
│   │   ├── progreso.hbs    ← Barra de progreso de 4 pasos
│   │   └── seguridad.hbs   ← Aviso de pago seguro PSE
│   ├── paso1.hbs           ← Vista Paso 1: cédula y teléfono
│   ├── paso2.hbs           ← Vista Paso 2: detalles del pago
│   └── confirmacion.hbs    ← Vista final (demo)
├── public/
│   └── logos/
│       ├── 0.svg           ← Icono de categoría (cabecera)
│       └── Logo_310X28.svg ← Logo DAVIbank (cuerpo de las vistas)
└── docs/
    └── README.md           ← Este archivo
```

---

## 4. Instalación y ejecución

### Requisitos previos
- Node.js v18 o superior instalado
- npm v9 o superior

### Pasos

```bash
# 1. Entrar a la carpeta del proyecto
cd portal-pago

# 2. Instalar dependencias
npm install

# 3. Iniciar en modo desarrollo (con recarga automática)
npm run dev

# 4. O iniciar en modo producción
npm start
```

### Acceder en el navegador
```
http://localhost:3000
```

---

## 5. Flujo de navegación

```
GET  /        → Paso 1 (cédula + teléfono)
      ↓ POST /paso1
GET  /paso2   → Paso 2 (nombre, producto, valores, términos)
      ↓ POST /paso2
             → Confirmación (demo)
```

---

## 6. Rutas disponibles

| Método | Ruta      | Descripción                                      |
|--------|-----------|--------------------------------------------------|
| GET    | `/`       | Renderiza el Paso 1                              |
| POST   | `/paso1`  | Valida datos del Paso 1 y redirige al Paso 2     |
| GET    | `/paso2`  | Renderiza el Paso 2                              |
| POST   | `/paso2`  | Valida datos del Paso 2 y renderiza confirmación |

---

## 7. Variables de plantilla por vista

### paso1.hbs
| Variable | Tipo   | Descripción                           |
|----------|--------|---------------------------------------|
| paso     | Number | Número del paso activo (siempre 1)    |
| error    | String | Mensaje de error (opcional)           |

### paso2.hbs
| Variable       | Tipo   | Descripción                                |
|----------------|--------|--------------------------------------------|
| paso           | Number | Número del paso activo (siempre 2)         |
| cedula         | String | Cédula recibida del Paso 1                 |
| error          | String | Mensaje de error (opcional)                |
| nombreCliente  | String | Repoblar campo si hubo error (opcional)    |
| numProducto    | String | Repoblar campo si hubo error (opcional)    |
| valorPagar     | String | Repoblar campo si hubo error (opcional)    |
| otroValor      | String | Repoblar campo si hubo error (opcional)    |

---

## 8. Partials reutilizables

| Partial          | Descripción                                           |
|------------------|-------------------------------------------------------|
| `{{> header}}`   | Cabecera con logo icono y botón cerrar                |
| `{{> progreso}}` | Barra de 4 segmentos — recibe `paso` del contexto     |
| `{{> seguridad}}`| Aviso de pago seguro PSE con icono candado            |

---

## 9. Logos y assets

Los archivos SVG van en `public/logos/` y se sirven como estáticos en `/logos/`.  
Están también incrustados **inline** dentro de las vistas `.hbs` para evitar
peticiones HTTP adicionales y garantizar que se rendericen sin dependencia de red.

| Archivo            | Uso                                    |
|--------------------|----------------------------------------|
| `0.svg`            | Icono 32×32 en la cabecera             |
| `Logo_310X28.svg`  | Logo de marca en el cuerpo de cada paso|

---

## 10. Notas para producción

- **Sesiones:** reemplazar el paso de `cedula` por query param con `express-session`
  o tokens JWT firmados para mantener el estado de forma segura entre pasos.
- **Validación:** usar `express-validator` para validación robusta en el servidor.
- **Base de datos:** conectar a la BD corporativa en `routes/index.js` en los POST.
- **HTTPS:** obligatorio en producción; configurar certificado SSL o usar un proxy
  inverso (nginx/Cloudflare).
- **Variables de entorno:** mover `PORT` y credenciales a un archivo `.env`
  usando el paquete `dotenv`.

---

*Documento generado por el equipo de desarrollo DAVIbank — uso interno.*
