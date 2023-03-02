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

Step 3. Install `kind`, `kubectl`, `helm`, and `yq`

```sh
RUN brew install kind &&
RUN brew install kubectl &&
RUN brew install helm &&
RUN brew install yq
```

> Installation docs (just in case you can't or don't want to use `homebrew`):
> * [kind](https://kind.sigs.k8s.io/docs/user/quick-start#installation)
> * [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
> * [helm](https://helm.sh/docs/intro/install/)
> * [yq](https://github.com/mikefarah/yq/#install)

Step 4. Install [`nvm`](https://github.com/nvm-sh/nvm) and [`node`](https://nodejs.org/en/) 19

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

```sh
VERSION=19 &&
nvm install $VERSION && 
nvm use $VERSION && 
nvm alias default $VERSION
```

Step 5. Install [`pnpm`](https://pnpm.io/installation)

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

## Developing Locally

Step 1. Create cluster (development)

```sh
pnpm dev:kind:create
```

Step 2. Run `rabbitmq` in a separate terminal

```sh
pnpm start:rabbitmq
```

Step 3. Run `astro` in a separate terminal (development)

```sh
pnpm dev:astro
```

Step 4. Run `workers` in a separate terminal (development) (you may need to wait till `rabbitmq` is ready)

> Note: you'll need a `.env` in `./packages/astro/.env` with `PUBLIC_SUPABASE_API_KEY=your_api_key`

```sh
pnpm start:workers
```

To test out if the `workers` are working, properly go to the Astro website at [`localhost:3000`](http://localhost:3000) and login.

Once logged in, go to this URL [`localhost:3000/api/labs/deployments/1`](http://localhost:3000/api/labs/deployments/1) and you should see a message with a port number, if the response takes longer than 1 minute then the `workers` are not working properly, you need to kill all the development processes, you'll then have to restart the development process from Step 2 onward.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                                  | Action                                                                                                                                 |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                           | Installs dependencies                                                                                                                  |
| `pnpm dev:astro`                         | Starts local [Astro](https://astro.build/) dev server at `localhost:3000` for the frontend of the SKF website                          |
| `pnpm build:astro`                       | Build the production site to `./packages/astro/dist/`                                                                                  |
| `pnpm start:astro`                       | Preview the site locally, before deploying                                                                                             |
| `pnpm --filter=astro astro ...`          | Run CLI commands like `astro add`, `astro check`                                                                                       |
| `pnpm --filter=astro astro --help`       | Get help using the Astro CLI                                                                                                           |
| `pnpm --filter=astro format`             | Formats code for the Astro frontend                                                                                                    |
| `pnpm --filter=astro fix:lint`           | Lints & Fixes code for the Astro frontend                                                                                              |
| `pnpm docker`                            | Builds the docker container for `astro` & `workers`                                                                                    |
| `pnpm docker:astro`                      | Builds the docker container for only `astro`                                                                                           |
| `pnpm docker:workers`                    | Builds the docker container for only `workers`                                                                                         |
| `pnpm kind:create`                       | Create's `kind` cluster for production and sets up the kubernetes config file (`./k8s/kubeconf`) the `workers` docker container needs  |
| `pnpm dev:kind:create`                   | Create's `kind` cluster for development and sets up the kubernetes config file (`./k8s/kubeconf`) the `workers` docker container needs |
| `pnpm start`                             | Start the `astro`, `workers`, and `rabbitmq` docker containers in kubernetes                                                           |
| `pnpm --filter=workers exec -- deno ...`      | Run CLI commands like `deno run -A ./hello.ts`, `deno lint`, etc..                                                                     |
| `pnpm --filter=workers exec -- deno --help`   | Get help using Deno                                                                                                                    |
| `pnpm --filter=workers exec -- deno fmt`      | Formats code for the Deno workers                                                                                                      |
| `pnpm --filter=workers exec -- deno lint`       | Lints code for the Deno workers                                                                                                        |
| `pnpm --filter=workers exec -- deno task hello` | Runs the `hello` task script in the [./packages/workers/deno.jsonc](./packages/workers/deno.jsonc)                                     |

## FAQ
### Kind

> `kind` is a tool for running local Kubernetes clusters using Docker container “nodes”.

We use `kind` to create a local Kubernetes cluster for development and production.

https://kind.sigs.k8s.io/docs/user/quick-start

```sh
kind delete cluster &&
kind create cluster --wait 5m &&
kind get clusters &&
kubectl cluster-info --context kind-kind 
```
> The full kind script is located at [`./scripts/create-cluster-sh.sh`](./scripts/create-cluster-sh.sh).
> 
> We use this script to create a local Kubernetes cluster, 
> and to setup the kubenetes configuration required to make `kind` work properly.

### RabbitMQ

We use RabbitMQ to manage the queueing of jobs for the `workers` to process.
e.g. deploy skf labs, delete skf labs, etc...

The solution for deploying labs ended up being somewhat complex, 
due to needing to deploy each lab as a docker container on `kubernetes`

https://www.rabbitmq.com/download.html

```sh
pnpm start:rabbitmq
```

OR

```sh
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.11-management
```

https://registry.hub.docker.com/_/rabbitmq/#:~:text=and%20password%20of-,guest%20/%20guest,-%2C%20you%20can%20do
> RabbitMQ has a management console you can use to work with RabbitMQ, you can access it on http://localhost:15672 
> 
> The login is 
> * username: **guest** 
> * password: **guest**

### Workers

The workers are responsible for processing the jobs that are queued by RabbitMQ. 

They're `typescript` files written in `deno`; we chose `deno` because it's very self contained, 
and pleasent to use.

To start the deno workers run:

```sh
pnpm start:workers
```

### Database Migration

We needed to migrate an old database before if we ever wanted to 
migrate other databases https://stackoverflow.com/a/34726143 is a great resource for this.

For the migration from the old `sqlite3` database to `postgres` on [supabase](https://supabase.com/) 
we used [`Sequel`](https://sequel.jeremyevans.net/).

[`Sequel`](https://sequel.jeremyevans.net/) is a Ruby gem that allows you to migrate databases from one type to another.

> ^ You will need to install the `sqlite3` & `postgres` gems (yes, Ruby gems)


```sh
gem install sqlite3 &&
gem install postgres &&
gem install sequel
```

> I used https://stackoverflow.com/a/46723784 for debugging the `Sequel::AdapterNotFound: LoadError: cannot load such file -- sqlite3` 
> error if you run into any other errors it's a good place to start.
>

<!-- ## Ingress / Sub-domain / Port Deploy

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
``` -->


<!-- ## Convert from docker-compose to kubernetes

Install `kompose` ([docs](https://kubernetes.io/docs/tasks/configure-pod-container/translate-compose-kubernetes/#install-kompose))

```sh
brew install kompose
```

To convert a `docker-compose.yml` file you simply run `pnpm kompose` -->
