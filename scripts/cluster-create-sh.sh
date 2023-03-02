#!/usr/bin/env bash

kind delete cluster
kind create cluster --wait 5m 
kind get clusters 
kubectl cluster-info --context kind-kind

#copy kube config file so we can use it inside the workers container
cp /home/node/.kube/config ./k8s/kubeconf

#replace ip+port to https://kubernetes
yq -i '
  .clusters[0].cluster.server = "https://kubernetes" | 
  .networking.mode = "host-bridge" 
' ./k8s/kubeconf

