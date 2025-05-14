#!/bin/bash

# Minikube'un Docker daemon'ını kullanmak için
eval $(minikube docker-env)

# Docker Hub veya başka bir registry kullanıcı adınızı ayarlayın
DOCKER_REGISTRY="campus-caution"

# Mikroservislerin listesi
SERVICES=(
  "gateway-service:api-gateway"
  "user-service2:user-service" 
  "IssueService:issue-service"
  "department-service:department-service"
  "notification-service:notification-service"
)

# Her servis için Docker image oluştur (minikube için push etme)
for service in "${SERVICES[@]}"; do
  # Servis dizini ve image adını ayır
  IFS=':' read -r directory image_name <<< "$service"
  
  echo "⚙️ Building $image_name from directory $directory..."
  
  # Docker image oluştur
  docker build -t "$DOCKER_REGISTRY/$image_name:latest" "./$directory"
  
  echo "✅ Done with $image_name"
  echo ""
done

echo "🎉 All images built successfully for minikube!" 