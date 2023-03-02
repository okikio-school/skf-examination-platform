#!/usr/bin/env bash

kind delete cluster
kind create cluster --wait 5m 
kind get clusters 
kubectl cluster-info --context kind-kind

#copy kube config file so we can use it inside the workers container
cp /home/node/.kube/config ./k8s/kubeconf
find ./k8s/kubeconf -type f -exec sed -i -e "s,https://127.0.0.1:.*,https://localhost,g" {} \;

#replace ip+port to https://kubernetes
FILE=./k8s/kubeconf
if [[ -f "$FILE" ]]; then
  yq -i '
    .networking.mode = "host-bridge" 
  ' ./k8s/kubeconf
fi

