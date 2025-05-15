#!/bin/bash

# Bu script, basit bir nginx deployment'ı oluşturur ve ölçeklendirir

echo "🔧 Creating 'campus-caution' namespace if it doesn't exist..."
kubectl create namespace campus-caution --dry-run=client -o yaml | kubectl apply -f -

echo "🗑️ Cleaning up any existing user-service deployment..."
kubectl delete deployment user-service -n campus-caution --ignore-not-found=true

echo "🚀 Creating user-service deployment with 3 replicas..."
kubectl create deployment user-service --image=nginx:latest --replicas=3 -n campus-caution

echo "🏷️ Adding app=user-service label to deployment..."
kubectl label deployment user-service app=user-service -n campus-caution --overwrite

echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/user-service -n campus-caution

echo "📊 Current user-service replicas:"
kubectl get pods -l app=user-service -n campus-caution

echo "🔄 Scaling deployment to 5 replicas..."
kubectl scale deployment/user-service --replicas=5 -n campus-caution

echo "⏳ Waiting for scaling to complete..."
kubectl rollout status deployment/user-service -n campus-caution

echo "📊 Updated user-service replicas:"
kubectl get pods -l app=user-service -n campus-caution

echo "🎉 Deployment and scaling completed successfully!"
echo ""
echo "🔍 To show deployment details:"
echo "kubectl get deployment user-service -n campus-caution"
echo ""
echo "🔍 To show pods:"
echo "kubectl get pods -l app=user-service -n campus-caution"