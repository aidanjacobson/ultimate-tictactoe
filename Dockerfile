# frontend stage
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend .
RUN npm run build

# backend stage
FROM python:3.12

WORKDIR /app

ADD ./backend/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

ADD ./backend /app

COPY --from=frontend-build /frontend/dist /app/www

EXPOSE 8080

CMD ["python", "main.py"]