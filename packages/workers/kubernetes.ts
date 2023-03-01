import { Reflector, KubeConfigRestClient, ClientProviderChain, KubectlRawRestClient } from 'https://deno.land/x/kubernetes_client/mod.ts';
import type { RestClient } from 'https://deno.land/x/kubernetes_client/mod.ts';
import {
  CoreV1Api,
  fromService, toService,
  fromServicePort, toServicePort,
  fromNamespace, toNamespace,
} from "https://deno.land/x/kubernetes_apis/builtin/core@v1/mod.ts";
import { fromObjectMeta, toObjectMeta } from "https://deno.land/x/kubernetes_apis@v0.4.0/builtin/meta@v1/structs.ts";
import {
  NetworkingV1Api,
  fromIngressSpec, toIngressSpec,
  fromIngress, toIngress,
  fromIngressRule, toIngressRule,
  fromHTTPIngressRuleValue, toHTTPIngressRuleValue,
  fromHTTPIngressPath, toHTTPIngressPath,
  fromIngressBackend, toIngressBackend,
  fromIngressServiceBackend, toIngressServiceBackend,
  fromServiceBackendPort, toServiceBackendPort
} from "https://deno.land/x/kubernetes_apis/builtin/networking.k8s.io@v1/mod.ts";
import {
  fromPodSpec, toPodSpec,
  fromPodTemplateSpec, toPodTemplateSpec,
  fromContainer, toContainer,
  fromContainerPort, toContainerPort,
  type Service
} from 'https://deno.land/x/kubernetes_apis/builtin/core@v1/structs.ts';
import {
  type Deployment,
  AppsV1Api,
  fromDeploymentSpec, toDeploymentSpec,
  fromDeployment, toDeployment
} from 'https://deno.land/x/kubernetes_apis/builtin/apps@v1/mod.ts';
import { load as dotenv } from "https://deno.land/std/dotenv/mod.ts";

import { config } from '@skf/shared/config.ts';

// @deno-types="npm:@types/rascal"
import rascal from 'rascal';
const { createBrokerAsPromised } = rascal;

const env = await dotenv();

function getEnv(name: string) { 
  return env[name] ?? Deno.env.get(name);
}
console.log({ host: getEnv("KUBERNETES_HOST"), HOME: getEnv("HOME"), envlist: Deno.env.toObject() })

export const DefaultClientProvider
  = new ClientProviderChain([
    ['KubeConfig', () => KubeConfigRestClient.readKubeConfig(getEnv("KUBECONFIG"))], // 
    ['InCluster', () => KubeConfigRestClient.forInCluster()],
    ['KubectlProxy', () => KubeConfigRestClient.forKubectlProxy()],
    ['KubectlRaw', async () => new KubectlRawRestClient()],
  ]);

/**
 * Trial-and-error approach for automatically deciding how to talk to Kubernetes.
 * You'll still need to set the correct permissions for where you are running.
 * You can probably be more specific and secure with app-specific Deno.args flags.
 */
export async function autoDetectClient(): Promise<RestClient> {
  return DefaultClientProvider.getClient();
}

const kubernetes = await autoDetectClient();
console.log({
  kubernetes
})

const coreApi = new CoreV1Api(kubernetes);
const appsApi = new AppsV1Api(kubernetes);
const networkApi = new NetworkingV1Api(kubernetes);


const namespaces = await coreApi.getNamespaceList();
console.log({ namespaces })



let labs_protocol: string | undefined;
let labs_domain = getEnv("SKF_LABS_DOMAIN") ?? "";

const subdomain_deploy = getEnv("SKF_LABS_DEPLOY_MODE") === "subdomain";
if (subdomain_deploy) {
  const match = /(.*:\/\/)?(.*)/.exec(labs_domain);
  if (match) {
    [, labs_protocol, labs_domain] = match;
  }
  
  if (!labs_protocol) {
    labs_protocol = "http://";
  }
  console.log(`Subdomain deploy using ${labs_protocol}<lab>.${labs_domain},`);
} else {
  console.log(`Port deploy using ${labs_domain}:<port>`);
}

export async function createServiceForDeployment(deployment: string, user_id: string) {
  const randomPort = Math.round(40000 + (Math.random() * (60000 - 40000)));
  const service = toService(
    fromService({
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: deployment
      },
      spec: {
        type: "NodePort",
        selector: {
          app: deployment
        },
        ports: [
          toServicePort(
            fromServicePort({
              protocol: "TCP",
              port: randomPort,
              targetPort: 5000
            })
          ),
        ]
      }
    })
  );

  const response = coreApi.namespace(user_id);

  try {
    await response.getService(deployment);
  } catch (_e) {
    const newService = await response.createService(service);
    console.log({
      newService
    })
  }

  return randomPort;
}

export async function createUserNamespace(user_id: string) {
  try {
    console.log({
      user_id
    })
    const body = toNamespace(
      fromNamespace({
        metadata: toObjectMeta(
          fromObjectMeta({
            name: user_id
          })
        )
      })
    );

    try {
      await coreApi.getNamespace(user_id);
      return;
    } catch (_e) { /* empty */ }

    console.log({
      namespace: body
    })
    await coreApi.createNamespace(body);
  } catch (e) {
    throw new Error('Failed to deploy, error namespace creation!', {
      cause: e
    })
  }
}


export function createDeploymentObject(deployment: string) {
  try {
    // Configureate Pod template container
    const container = toContainer(
      fromContainer({
        name: deployment,
        image: "blabla1337/owasp-skf-lab:" + deployment,
        ports: [
          toContainerPort(
            fromContainerPort({
              containerPort: 5000
            })
          )
        ],
      })
    );

    // Create and configurate a spec section
    const template = toPodTemplateSpec(
      fromPodTemplateSpec({
        metadata: toObjectMeta(
          fromObjectMeta({
            labels: { "app": deployment }
          })
        ),
        spec: toPodSpec(
          fromPodSpec({
            containers: [container]
          })
        )
      })
    );

    // Create the specification of deployment
    const spec = toDeploymentSpec(
      fromDeploymentSpec({
        replicas: 1,
        template,
        selector: {
          'matchLabels': { 'app': deployment }
        }
      })
    );

    // Instantiate the deployment object
    const deploymentObj = toDeployment(
      fromDeployment({
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: toObjectMeta(
          fromObjectMeta({
            name: deployment
          })
        ),
        spec: spec,
      })
    );

    return deploymentObj;
  } catch (e) {
    throw new Error('Failed to deploy, error creation deployment object!', {
      cause: e
    })
  }
}

export async function createDeployment(deployment: Deployment, user_id: string) {
  try {
    const namespace = appsApi.namespace(user_id);
    const deploymentName = deployment.metadata?.name;
    if (!deploymentName) throw new Error(`Deployment name isn't valid, name: ${deployment.metadata?.name}`);

    try {
      const existingDeployment = await namespace.getDeployment(deploymentName);
      return existingDeployment
    } catch (_e) { /* empty */ }

    const response = await namespace.createDeployment(deployment);
    return response
  } catch (e) {
    throw new Error('Failed to deploy, error K8s API create call!', {
      cause: e
    })
  }
}

export async function getServiceExposedIP(deployment: string, user_id: string) {
  try {
    const response = coreApi.namespace(user_id);

    console.log({
      exposedIp: response
    })
    return await response.getService(deployment);
  } catch (e) {
    throw new Error('Failed to deploy, error service no exposed IP!', {
      cause: e
    })
  }
}

export async function portForward(deployment: string, user_id: string, ports: number) {
  try {
    const response = coreApi.namespace(user_id);
    const podList = await response.getPodList();
    console.log({ metadata: podList.items.map(x => x.metadata) });

    let runLoop = true
    while (runLoop) {
      const test = await waitGetCompletedPodPhase(deployment, user_id)
      if (test === "Running") {
        console.log("Pod has started and is running")
        runLoop = false;
        break
      }
    }

    for (const pod of podList.items) {
      const resource_name = pod.metadata?.name;
      const label = pod.metadata?.labels?.app;
      if (
        typeof label == "string" &&
        typeof resource_name == "string" &&
        label.includes(deployment)
      ) {
        console.log({ resource_name, user_id })
        return await response.connectPostPodPortforward(resource_name, {
          ports
        })
      }
    }
  } catch (e) {
    throw new Error('Failed to deploy, error port forward!', {
      cause: e
    })
  }
}

export async function getHostPortFromResponse(type: "node-port", response: Service): Promise<number>;
export async function getHostPortFromResponse(type: "target-port", response: Service): Promise<number | string>;
// deno-lint-ignore require-await
export async function getHostPortFromResponse(type: "node-port" | "target-port" = "node-port", response: Service) {
  try {
    let port: string | number = -1;
    const servicePorts = response.spec?.ports ?? [];
    console.log({
      servicePorts
    })
    for (const service of servicePorts) {
      switch (type) {
        case "node-port":
          if (service.nodePort)
            port = service.nodePort;
          break;
        case "target-port":
          if (service.targetPort)
            port = service.targetPort;

      }
    }

    // const res = labs_domain + ":" + node_port?.toString();
    return port;
  } catch (e) {
    throw new Error('Failed to deploy, error no host or port!', {
      cause: e
    })
  }
}

export async function createIngress(networking_v1_api: NetworkingV1Api, hostname: string, deployment: string, service_port: number, user_id: string) {
  try {
    const body = toIngress(
      fromIngress({
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: toObjectMeta(
          fromObjectMeta({
            name: `ingress-${deployment}`,
            annotations: {
              "kubernetes.io/ingress.class": "nginx",
            }
          })
        ),
        spec: toIngressSpec(
          fromIngressSpec({
            rules: [
              toIngressRule(
                fromIngressRule({
                  host: hostname,
                  http: toHTTPIngressRuleValue(
                    fromHTTPIngressRuleValue({
                      paths: [
                        toHTTPIngressPath(
                          fromHTTPIngressPath({
                            path: "/",
                            pathType: "Prefix",
                            backend: toIngressBackend(
                              fromIngressBackend({
                                service: toIngressServiceBackend(
                                  fromIngressServiceBackend({
                                    name: deployment,
                                    port: toServiceBackendPort(
                                      fromServiceBackendPort({
                                        number: service_port
                                      })
                                    )
                                  })
                                )
                              })
                            )
                          })
                        )
                      ]
                    })
                  )
                })
              )
            ]
          })
        )
      })
    );

    // Creation of the Deployment in specified namespace
    // (Can replace "default" with a namespace you may have created)
    const response = networking_v1_api.namespace(user_id);
    try {
      const ingressName = body.metadata?.name as `ingress-${string}`;
      await response.getIngress(ingressName);
    } catch (_e) { /* empty */ }

    await response.createIngress(body);
    return null;
  } catch (e) {
    throw new Error('Failed to create ingress!', {
      cause: e
    })
  }
}

export function split(body: string) {
  return body.split(':');
}

export async function waitGetCompletedPodPhase(release: string, user_id: string) {
  const api_instance = coreApi.namespace(user_id);
  const podWatcher = new Reflector(
    opts => api_instance.getPodList(opts),
    opts => api_instance.watchPodList(opts)
  );

  podWatcher.run();

  function getPodPhase() {
    for (const pod of podWatcher.listCached()) {
      const resource_name = pod.metadata.name;
      if (resource_name.includes(release)) {
        const podPhase = pod.status?.phase;

        if (podPhase === "Running") {
          try {
            podWatcher.stop();
          } catch (_e) { /* empty */ }
          return podPhase;
        }
      }
    }
  }

  return await podWatcher.goObserveAll(async iter => {
    console.log('observing...');
    let inSync = false;
    for await (const evt of iter) {
      switch (evt.type) {
        case 'SYNCED': {
          const podPhase = getPodPhase(); // sneak in rising-edge run
          if (podPhase === "Running")
            return podPhase;
          inSync = true; // start allowing falling-edge runs
          break;
        }
        case 'DESYNCED':
          inSync = false; // block runs during resync inconsistencies
          break;
        case 'ADDED':
        case 'MODIFIED':
        case 'DELETED':
          if (inSync) {
            const podPhase = getPodPhase();
            if (podPhase === "Running")
              return podPhase;
          }
          break;
      }
    }
    console.log('observer done');
  });
}

export async function deployContainer(rpc_body: string) {
  console.log({ rpc_body })
  const [deployment, user_id] = split(rpc_body);
  await createUserNamespace(user_id);

  const deployment_object = createDeploymentObject(deployment)
  await createDeployment(deployment_object as Deployment, user_id)

  let service_port = -1;
  try {
    service_port = await createServiceForDeployment(deployment, user_id)
  } catch (_e) {
    const response = await coreApi.namespace(user_id).getServiceList();
    for (const i of response.items) {
      if (i?.metadata?.name == deployment) {
        service_port = await getHostPortFromResponse("node-port", i)
      }
    }
  }

  console.log({
    service_port,
    hostname: `${deployment}-${user_id}.${labs_domain}`
  })

  if (subdomain_deploy) {
    const hostname = `${deployment}-${user_id}.${labs_domain}`

    console.log({ hostname })

    try {
      const ingress_err = await createIngress(networkApi, hostname, deployment, service_port, user_id)

      let runLoop = true
      while (runLoop) {
        const test = await waitGetCompletedPodPhase(deployment, user_id)
        if (test === "Running") {
          console.log("Pod has started and is running")
          runLoop = false;
          break
        }
      }

      if (ingress_err) return ingress_err;
      return labs_protocol + hostname
    } catch (_error) {
      const response_ingress = await networkApi.namespace(user_id).getIngressList();
      for (const i of response_ingress.items) {
        const rules = i?.spec?.rules ?? [];
        for (const item of rules) {
          const host_split = item.host ?? "";
          const host = host_split.split(".")
          const domain_user = deployment + "-" + user_id
          if (domain_user == host[0]) {
            return labs_protocol + hostname
          }
        }
      }
    }
  } else {
    const response = await getServiceExposedIP(deployment, user_id)
    const ports = await getHostPortFromResponse("node-port", response)
    const targetPorts = await getHostPortFromResponse("target-port", response)

    await portForward(deployment, user_id, Number(targetPorts))
    return ports
  }
}

try {
  const broker = await createBrokerAsPromised(config);
  broker.on('error', console.error);
  console.log({ config });

  // Consume a message
  const subscription = await broker.subscribe('deployment_subscription', {
    options: {
      noAck: true
    }
  });
  subscription
    .on('message', async (message, content, ackOrNack) => {
      const props = message.properties;
      const method = message.fields;

      console.log({ message });
      if (method.routingKey === "deploy") {
        const response = await deployContainer(
          ArrayBuffer.isView(content) || content instanceof ArrayBuffer ?
            new TextDecoder().decode(content) :
            content
        );

        console.log({ response });
        console.log([message, content]);
        await broker.publish('deployment_publish', String(response), {
          routingKey: "reply",
          options: {
            correlationId: props.correlationId,
            expiration: 30_000,
          }
        });

        ackOrNack(undefined, [
          {
            strategy: 'republish',
            defer: 1000,
            attempts: 10,
          },
          {
            strategy: 'nack',
          },
        ]);
      }
    })
    .on('error', console.error);
} catch (err) {
  console.error(err);
}
