#!/usr/bin/env bash

kind delete cluster
kind create cluster
kind get clusters 
kubectl cluster-info --context kind-kind

#copy kube config file so we can use it inside the workers container
cp /home/node/.kube/config ./k8s/kubeconf

#replace ip+port to https://kubernetes
FILE=./k8s/kubeconf
if [[ -f "$FILE" ]]; then
  yq -i '
    .clusters[0].cluster.server = "https://kubernetes" | 
    .networking.mode = "host-bridge" 
  ' ./k8s/kubeconf
fi

