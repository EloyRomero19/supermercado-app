# --- Etapa 1: compilar con el JDK y Maven (no llega a la imagen final) ---
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
# Primero solo lo que define las dependencias: Docker reutiliza esta capa (y la descarga de
# dependencias) mientras no cambie el pom.xml, aunque cambies el código
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src/ src/
RUN ./mvnw -q -B -DskipTests package && cp target/backend-*.jar app.jar

# --- Etapa 2: solo el JRE y el .jar ---
FROM eclipse-temurin:21-jre-alpine
# Nunca como root: si alguien explotara un fallo de la app, no tendría permisos de administrador
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/app.jar app.jar
USER app
EXPOSE 8080
# MaxRAMPercentage: la JVM ajusta su memoria al límite del contenedor
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
