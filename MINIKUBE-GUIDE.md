# Minikube ile Campus Caution Mikroservislerini Çalıştırma Rehberi

Bu rehber, Campus Caution mikroservis projesini Minikube üzerinde çalıştırmak için gerekli adımları içerir.

## Ön Gereksinimler

- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

## 1. Minikube'u Başlatma

```bash
# Minikube'u başlat (daha fazla memory ve cpu ile)
minikube start --memory=4096 --cpus=2

# Minikube durumunu kontrol et
minikube status
```

## 2. Docker İmajlarını Oluşturma

```bash
# Minikube Docker daemon'ına bağlan
eval $(minikube docker-env)

# Build scriptine çalıştırma izni ver
chmod +x ./scripts/build-and-push.sh

# Docker imajlarını oluştur
./scripts/build-and-push.sh
```

## 3. Kubernetes'e Deploy Etme

```bash
# Deploy scriptini çalıştırılabilir yap
chmod +x ./scripts/deploy-to-k8s.sh

# Kubernetes'e deploy et
./scripts/deploy-to-k8s.sh
```

## 4. İngress Kurulumu

```bash
# Minikube'da Ingress eklentisini etkinleştir (deploy scripti bunu otomatik yapar)
minikube addons enable ingress

# Minikube IP adresini al
MINIKUBE_IP=$(minikube ip)

# Hosts dosyasına ekle (bu komutu yönetici olarak çalıştırmanız gerekebilir)
echo "$MINIKUBE_IP campus-caution.local" | sudo tee -a /etc/hosts
```

## 5. Uygulamaya Erişim

### Ingress ile Erişim (Önerilen)

Hosts dosyanızı düzenledikten sonra, tarayıcınızda şu adrese gidebilirsiniz:
```
http://campus-caution.local
```

### Port Forwarding ile Erişim

```bash
# API Gateway'e doğrudan port yönlendirme yapın
kubectl port-forward svc/api-gateway 3000:3000 -n campus-caution
```

Sonra tarayıcınızda şu adrese gidin:
```
http://localhost:3000
```

### LoadBalancer ile Erişim 

```bash
# Ayrı bir terminal penceresinde minikube tunnel başlatın
minikube tunnel
```

Başka bir pencerede API Gateway'in External-IP adresini alın:
```bash
kubectl get svc api-gateway -n campus-caution
```

Tarayıcınızda EXTERNAL-IP adresini kullanarak erişin:
```
http://EXTERNAL-IP:3000
```

## 6. Ölçeklendirmeyi Doğrulama

User Service'in 3 replika ile çalıştığını doğrulayın:

```bash
kubectl get pods -l app=user-service -n campus-caution
```

Replica sayısını manuel olarak değiştirmek için:

```bash
kubectl scale deployment/user-service --replicas=5 -n campus-caution
```

## 7. Servisleri İzleme

Pod'ların durumunu kontrol etmek için:

```bash
kubectl get pods -n campus-caution
```

Bir pod'un log'larını görmek için:

```bash
kubectl logs -f pod/POD_ADI -n campus-caution
```

## 8. Temizlik

İşiniz bittiğinde, kaynakları temizlemek için:

```bash
# Tüm kaynakları sil
kubectl delete namespace campus-caution

# Minikube'u durdur
minikube stop
``` 