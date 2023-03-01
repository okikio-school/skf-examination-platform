import { Reflector, KubeConfigRestClient, ClientProviderChain, KubectlRawRestClient, RequestOptions, JSONValue } from 'https://deno.land/x/kubernetes_client/mod.ts';
import type { RestClient } from 'https://deno.land/x/kubernetes_client/mod.ts';
import type { Service } from 'https://deno.land/x/kubernetes_apis/builtin/core@v1/structs.ts';
import { CoreV1Api } from "https://deno.land/x/kubernetes_apis/builtin/core@v1/mod.ts";
import { load as dotenv } from "https://deno.land/std/dotenv/mod.ts";

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
  
  import { fetch as socketFetch } from "https://deno.land/x/socket_fetch@v0.1/mod.ts";

  // const resp = await fetchUsing(dialer, "https://1.1.1.1/");
  // console.log(await resp.text());

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
const namespaces = await coreApi.getNamespaceList();
console.log({ namespaces })

// import { fetchUsing, TlsDialer } from "https://deno.land/x/socket_fetch@v0.1/mod.ts";

// const dialer = new TlsDialer({ hostname: "one.one.one.one" });
// const resp = await fetchUsing(dialer, "https://1.1.1.1/");
// console.log(await resp.text());


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

async function performRequest(opts: RequestOptions): Promise<any> {
  let path = opts.path || '/';
  if (opts.querystring) {
    path += `?${opts.querystring}`;
  }

  // if (isVerbose && path !== '/api?healthcheck') {
  //   console.error(opts.method, path);
  // }

  const headers: Record<string, string> = {
  };

  // @ts-ignore
  const ctx = kubernetes.ctx;
  console.log({ kubernetes })
  if (!ctx.cluster.server) throw new Error(`No server URL found in KubeConfig`);
  const authHeader = await ctx.getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const accept = opts.accept ?? (opts.expectJson ? 'application/json' : undefined);
  if (accept) headers['Accept'] = accept;

  const contentType = opts.contentType ?? (opts.bodyJson ? 'application/json' : undefined);
  if (contentType) headers['Content-Type'] = contentType;

  let userCert = atob(ctx.user["client-certificate-data"] ?? '') || null;
  let userKey = atob(ctx.user["client-key-data"] ?? '') || null;

  if ((userKey && !userCert) || (!userKey && userCert)) throw new Error(
    `Within the KubeConfig, client key and certificate must both be provided if either is provided.`);

  let serverCert = atob(ctx.cluster["certificate-authority-data"] ?? '') || null;
  let httpClient = (Deno as any).createHttpClient({
    caCerts: serverCert ? [serverCert] : [],
    certChain: userCert,
    privateKey: userKey,
    // proxy: { url: "http://localhost:8001" }
  });

  const url = new URL(path, ctx.cluster.server);
  console.log({
    url
  })
  url.protocol = url.protocol.replace("http", "ws")
  const resp = await fetch(url, {
    method: opts.method,
    body: opts.bodyStream ?? opts.bodyRaw ?? JSON.stringify(opts.bodyJson),
    redirect: 'error',
    signal: opts.abortSignal,
    client: httpClient,
    headers: {
      ...headers,
      'X-Stream-Protocol-Version': 'portforward.k8s.io',
      "User-Agent": "kubectl/v1.26.1 (linux/amd64) kubernetes/8f94681"
    },
  } as RequestInit);

  type HttpError = Error & {
    httpCode?: number;
    status?: JSONValue;
  }
  
  // If we got a fixed-length JSON body with an HTTP 4xx/5xx, we can assume it's an error
  if (!resp.ok && resp.headers.get('content-type') == 'application/json' && resp.headers.get('content-length')) {
    const bodyJson = await resp.json();
    const error: HttpError = new Error(`Kubernetes returned HTTP ${resp.status} ${bodyJson.reason}: ${bodyJson.message}`);
    error.httpCode = resp.status;
    error.status = bodyJson;
    throw error;
  }

  // if (opts.expectStream) {
  //   if (!resp.body) return new ReadableStream();
  //   if (opts.expectJson) {
  //     return resp.body
  //       .pipeThrough(new TextDecoderStream('utf-8'))
  //       .pipeThrough(new TextLineStream())
  //       .pipeThrough(new JsonParsingTransformer());
  //   } else {
  //     return resp.body;
  //   }

  // } else
  if (opts.expectJson) {
    return resp.json();

  } else {
    return new Uint8Array(await resp.arrayBuffer());
  }
}


async function connectPostPodPortforward(namespace: string, name: string, opts: {
  ports?: number;
  abortSignal?: AbortSignal;
} = {}) {
  const query = new URLSearchParams;
  if (opts["ports"] != null) query.append("ports", String(opts["ports"]));
  const resp = await performRequest({
    method: "POST",
    path: `/api/v1/namespaces/${namespace}/pods/${name}/portforward`,
    expectJson: true,
    querystring: query,
    abortSignal: opts.abortSignal,
  });
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
        
        return await connectPostPodPortforward(user_id, resource_name, {
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

try {
  const rpc_body = "lfi:okikioluwaojo-0aac415c-74be-4487-a112-6dc7337ce8cc";
  const [deployment, user_id] = split(rpc_body);
  const response = await getServiceExposedIP(deployment, user_id)
  const targetPorts = await getHostPortFromResponse("target-port", response)
  await portForward(deployment, user_id, Number(targetPorts))
} catch (err) {
  console.error(err);
}
