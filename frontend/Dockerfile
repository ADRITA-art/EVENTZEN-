FROM node:20 AS build
WORKDIR /app
COPY . .
ENV REACT_APP_API_URL=http://localhost:8080
RUN npm install
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]