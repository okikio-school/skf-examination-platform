FROM denoland/deno:alpine-1.30.3 as base

WORKDIR /app

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY packages/workers /app/packages/workers
COPY packages/shared /app/packages/shared
COPY k8s/kubeconf /root/.kube/config

# Prefer not to run as root.
# USER deno

RUN cd /app/packages/workers && \
    deno task hello && \
    deno cache ./kubernetes.ts

FROM base as prod
WORKDIR /app/packages/workers
# ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD ["deno", "task", "kubernetes"]

FROM base as debug
WORKDIR /app/packages/workers
# ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD ["deno", "task", "deployment"]
