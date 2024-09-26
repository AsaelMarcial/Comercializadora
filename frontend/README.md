# Comedores UV


### Requisitos

Antes de comenzar a ejecutar el proyecto, debes asegurarte de tener instalado:

- Node.js (versión 12 o superior)
- npm (viene incluido con Node.js)

### Instalación

- Clona el repositorio en tu computadora
`<git clone https://github.com/DanielGM-code/Comedores-UV.git>`

- Dentro de Visual Studio, instala las dependencias del proyecto usando npm:
`npm install`

- Instala json-server para utilizar los datos de prueba usando npm:
`npm install json-server --dev `

### Ejecución

- Abre una terminal y posiciónate en la carpeta utils usando cd:
`cd src/utils`

- Dentro de la ruta de la carpeta utils ejecuta el siguiente comando para utilizar los datos de prueba:
`json-server --watch mockData.json on --port 3001`

- Abre otra terminal para ejecutar el proyecto de React con:
`npm start`
