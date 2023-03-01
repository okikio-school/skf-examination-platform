#!/usr/bin/env bash

# Setup, rabbitmq first as it takes time
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/deploy-rabbitmq.yaml
sleep 20
kubectl apply -f k8s/deploy-astro.yaml
kubectl apply -f k8s/deploy-workers.yaml
#kubectl apply -f k8s/ingress.yaml


# helm repo add jetstack https://charts.jetstack.io
# helm repo update
# kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.crds.yaml

# helm install \
#   cert-manager jetstack/cert-manager \
#   --namespace cert-manager \
#   --create-namespace \
#   --version v1.11.0 \
#   # --set installCRDs=true

sleep 20

kubectl port-forward service/astro 3000:3000
kubectl port-forward service/rabbitmq 15672:15672

# helm repo add nginx-stable https://helm.nginx.com/stable
# helm repo update
# helm install nginx-ingress nginx-stable/nginx-ingress  \
#     --set controller.image.repository=quay.io/kubernetes-ingress-controller/nginx-ingress-controller-arm \
#     --set controller.image.tag=0.32.0 \
#     --set defaultBackend.enabled=false \
#     --set controller.publishService.enabled=true \
#     --set controller.service.externalTrafficPolicy=Local 
