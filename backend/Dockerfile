# Usar a imagem base do Python
FROM python:3.11

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Definir o diretório de trabalho
WORKDIR /app

EXPOSE 5002

# Copiar todos os arquivos da aplicação Python
COPY . .

# Instalar dependências, se houver
RUN pip install -r requirements.txt

# Comando para executar a aplicação
CMD ["python3", "main.py"]
