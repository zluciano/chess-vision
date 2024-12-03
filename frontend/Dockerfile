# Usar a imagem base do Node.js
FROM node:18

# Definir o diretório de trabalho
WORKDIR /app

EXPOSE 3001

# Copiar todos os arquivos da aplicação Node.js
COPY . .

# Instalar dependências
RUN npm install

# Comando para iniciar a aplicação
CMD ["npm", "start"]
