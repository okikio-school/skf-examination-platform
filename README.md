# SKF DASHBOARD

## Install Locally

Step 1. Install [Deno](https://deno.land/manual@v1.30.3/getting_started/installation)

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh &&
$HOME/.deno/bin/deno completions bash > $HOME/.bashrc &&

echo 'export DENO_INSTALL="/home/gitpod/.deno"' >> $HOME/.bashrc &&
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> $HOME/.bashrc
```

Step 2. Install [Homebrew](https://brew.sh/)

```sh
curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh
```

Step 3. Install `kind`, `kubectl`, `minikube`, `helm`, and `kompose`

```sh
brew install kind &&
brew install kubectl &&
brew install minikube &&
brew install helm
```

> Installation docs (just in case you can't or don't want to use `homebrew`):
> * [kind](https://kind.sigs.k8s.io/docs/user/quick-start#installation)
> * [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
> * [minikube](https://minikube.sigs.k8s.io/docs/start/)
> * [helm](https://helm.sh/docs/intro/install/)

Step 4. Install `nvm` and `node` 19

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

```sh
VERSION=19 &&
nvm install $VERSION && 
nvm use $VERSION && 
nvm alias default $VERSION
```

Step 5. Install `pnpm`

```sh
npm install --global pnpm &&
pnpm install --recursive
```

## Running Locally

Step 1. Create cluster

```sh
pnpm kind:create
```

Step 2. Build `astro` & `workers` Docker container

```sh
pnpm docker
```

Step 3. Start `kubernetes`

```sh
pnpm start
```


## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                 | Action                                           |
| :---------------------- | :----------------------------------------------- |
| `pnpm install`          | Installs dependencies                            |
| `pnpm run dev`          | Starts local dev server at `localhost:3000`      |
| `pnpm run build`        | Build your production site to `./dist/`          |
| `pnpm run preview`      | Preview your build locally, before deploying     |
| `pnpm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `pnpm run astro --help` | Get help using the Astro CLI                     |
| `pnpm run format`       | Formats your code                                |
| `pnpm run lint`         | Lints your code                                  |

## Kind

https://kind.sigs.k8s.io/docs/user/quick-start

```sh
kind delete cluster &&
kind create cluster &&
kind get clusters &&
kubectl cluster-info --context kind-kind 
```

## RabbitMQ

https://www.rabbitmq.com/download.html

```sh
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.11-management
```

OR

```sh
docker compose up
```

https://registry.hub.docker.com/_/rabbitmq/#:~:text=and%20password%20of-,guest%20/%20guest,-%2C%20you%20can%20do
> login is 
> * username: **guest** 
> * password: **guest**

## Deno Kubernetes

```sh
pnpm deno:kubernetes
```

## Database Migration

Database migration is now complete, I used https://stackoverflow.com/a/34726143

> ^ But you will need to install the `sqlite3` & `postgres` gems (yes, Ruby gems)


```sh
gem install sqlite3 &&
gem install postgres &&
gem install sequel
```

> I used https://stackoverflow.com/a/46723784 for debugging the `Sequel::AdapterNotFound: LoadError: cannot load such file -- sqlite3`
>

## Ingress / Sub-domain / Port Deploy

> If you haven't previously added the repo:

```sh
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx &&
helm repo update &&

helm install ingress-nginx ingress-nginx/ingress-nginx \
    --set rbac.create=true \
    --set controller.publishService.enabled=true \
    --set controller.service.externalTrafficPolicy=Local \
    --set controller.setAsDefaultIngress=true \
    --set controller.extraArgs.default-ssl-certificate="default/securityknowledgeframework-labs.org"
```


## Convert from docker-compose to kubernetes

Install `kompose` ([docs](https://kubernetes.io/docs/tasks/configure-pod-container/translate-compose-kubernetes/#install-kompose))

```sh
brew install kompose
```

To convert a `docker-compose.yml` file you simply run `pnpm kompose`
