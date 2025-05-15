#!/bin/bash

# Bu script tüm Kubernetes kaynaklarını deploy eder

# Minikube durumunu kontrol et
echo "🔍 Checking Minikube status..."
minikube status

if [ $? -ne 0 ]; then
  echo "❌ Error: Minikube is not running!"
  echo "Please start minikube with: minikube start"
  exit 1
fi

# Gerekli dizinlerin var olduğundan emin ol
if [ ! -d "./k8s-manifests" ]; then
  echo "❌ Error: k8s-manifests directory not found!"
  exit 1
fi

# Namespace oluştur (eğer yoksa)
echo "🔧 Creating 'campus-caution' namespace if it doesn't exist..."
kubectl create namespace campus-caution --dry-run=client -o yaml | kubectl apply -f -

# Minikube için Ingress eklentisini etkinleştir
echo "🔧 Enabling Ingress addon for Minikube..."
minikube addons enable ingress

# Kustomize ile deploy et
echo "🚀 Deploying all services using Kustomize..."
kubectl apply -k ./k8s-manifests -n campus-caution

# User service'in ölçeklendiğini doğrula
echo "⏳ Waiting for user-service deployment to be ready..."
kubectl rollout status deployment/user-service -n campus-caution

echo "📊 Checking user-service replicas:"
kubectl get pods -l app=user-service -n campus-caution

echo "🌐 API Gateway service details:"
kubectl get service api-gateway -n campus-caution

# Minikube Tunnel ile LoadBalancer servisini dışa aç (arka planda çalıştır)
echo "🚇 Starting Minikube tunnel for LoadBalancer access (in a separate terminal):"
echo "Run: minikube tunnel"

echo "🎉 Deployment completed successfully!"
echo ""
echo "To access the application via Ingress:"
echo "1. Add to your /etc/hosts file: $(minikube ip) campus-caution.local"
echo "2. Access the application at http://campus-caution.local"
echo ""
echo "To port-forward API Gateway service directly:"
echo "kubectl port-forward svc/api-gateway 3000:3000 -n campus-caution"
echo ""
echo "To access the application via the LoadBalancer:"
echo "1. Run 'minikube tunnel' in a separate terminal"
echo "2. Access the application at http://EXTERNAL-IP:3000 (get the IP with 'kubectl get svc api-gateway -n campus-caution')" 