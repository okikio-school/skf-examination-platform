import { Reflector, ClientProviderChain, KubectlRawRestClient, RequestOptions, JSONValue, JsonParsingTransformer, HttpMethods } from 'https://deno.land/x/kubernetes_client/mod.ts';
import type { RestClient as DefaultRestClient } from 'https://deno.land/x/kubernetes_client/mod.ts';
import type { Service } from 'https://deno.land/x/kubernetes_apis/builtin/core@v1/structs.ts';
import { CoreV1Api } from "https://deno.land/x/kubernetes_apis/builtin/core@v1/mod.ts";

import { load } from "https://deno.land/std/dotenv/mod.ts";
import { ChannelStreams, KubeConfigRestClient } from "./via-kubeconfig.ts";

import { merge } from 'https://deno.land/x/stream_observables@v1.3/combiners/merge.ts';

await load({export:true})

function getEnv(name: string) { 
  return Deno.env.get(name);
}
console.log({ host: getEnv("KUBERNETES_HOST"), HOME: getEnv("HOME"), envlist: Deno.env.toObject() })

export const DefaultClientProvider
  = new ClientProviderChain([
    ['KubeConfig', () => KubeConfigRestClient.readKubeConfig(getEnv("KUBECONFIG"))], // 
    ['InCluster', () => KubeConfigRestClient.forInCluster()],
    ['KubectlProxy', () => KubeConfigRestClient.forKubectlProxy()],
    ['KubectlRaw', async () => new KubectlRawRestClient()],
  ]);
  

// const resp = await fetchUsing(dialer, "https://1.1.1.1/");
// console.log(await resp.text());

/**
 * Trial-and-error approach for automatically deciding how to talk to Kubernetes.
 * You'll still need to set the correct permissions for where you are running.
 * You can probably be more specific and secure with app-specific Deno.args flags.
 */
export async function autoDetectClient(): Promise<DefaultRestClient> {
  return DefaultClientProvider.getClient();
}

const kubernetes = await autoDetectClient() as KubeConfigRestClient;
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


export interface RestClient {
  performRequest(opts: RequestOptions & {expectChannel: string[]}): Promise<ChannelStreams>;
  performRequest(opts: RequestOptions & {expectStream: true; expectJson: true}): Promise<ReadableStream<JSONValue>>;
  performRequest(opts: RequestOptions & {expectStream: true}): Promise<ReadableStream<Uint8Array>>;
  performRequest(opts: RequestOptions & {expectJson: true}): Promise<JSONValue>;
  performRequest(opts: RequestOptions): Promise<Uint8Array>;
  defaultNamespace?: string;
}
  
async function tunnelPodPortforward(client: RestClient, namespace: string, podName: string, opts: {
  ports: number[];
  abortSignal?: AbortSignal;
}) {
  const query = new URLSearchParams;
  for (const port of opts.ports) {
    query.append("ports", String(port));
  }

  const {readable, writable} = await client.performRequest({
    method: "GET",
    path: `/api/v1/namespaces/${namespace}/pods/${podName}/portforward`,
    expectChannel: ['v4.channel.k8s.io'],
    querystring: query,
    abortSignal: opts.abortSignal,
  });
  // const outWriter = writable.getWriter();



  const recvStreams = new Array<ReadableStreamDefaultController<Uint8Array>>();
  const transmitStreams = new Array<ReadableStream<[number, Uint8Array]>>();
  const portStreams = opts.ports.map((port, idx) => {
    const dataIdx = idx*2;
    const errorIdx = idx*2 + 1;
    // const dataWritable = new WritableStream<Uint8Array>({
    //   write: (data) => outWriter.write([dataIdx, data]),
    // });
    const outputTransformer = new TransformStream<Uint8Array, [number, Uint8Array]>({
      transform(data, ctlr) {
        ctlr.enqueue([dataIdx, data]);
      },
    });
    transmitStreams.push(outputTransformer.readable);
    let firstOne = true;
    const dataReadable = new ReadableStream<Uint8Array>({
      start(ctlr) {
        recvStreams[dataIdx] = ctlr;
      },
    });
    const errorReadable = new ReadableStream<Uint8Array>({
      start(ctlr) {
        recvStreams[errorIdx] = ctlr;
      },
    });
    return {
      port,
      dataWritable: outputTransformer.writable,
      dataReadable,
      errorReadable,
    };
  });

  // TODO: await?
  merge(...transmitStreams).pipeTo(writable);

  (async function () {
    const hasPort = new Array<boolean>(opts.ports.length * 2);
    for await (const [channel, data] of readable) {
      const subIdx = channel % 2;
      const portIdx = (channel - subIdx) / 2;
      if (portIdx >= opts.ports.length) throw new Error(
        `Received data for unregged port`);
      if (hasPort[channel]) {
        recvStreams[channel]?.enqueue(data);
      } else {
        hasPort[channel] = true;
        const port = new DataView(data.buffer).getUint16(0, true);
        console.log([opts.ports[portIdx], port]);
        if (data.length > 2) {
          recvStreams[channel]?.enqueue(data.slice(2));
        }
      }
    }
  })().then(() => {
    recvStreams.forEach(x => x.close());
  }, err => {
    recvStreams.forEach(x => x.error(err));
  });

  return portStreams;
}

// const portTunnels = await tunnelPodPortforward(kubernetes, Deno.args[0], Deno.args[1], {ports: [80, 81]});
// console.log({forwards})

// const badPort = portTunnels.find(x => x.port == 81)!;
// for await (const x of badPort.errorReadable) {
//   console.log('bad', new TextDecoder().decode(x));
//   break;
// }
// console.log('done bad');


try {
  const rpc_body = "lfi:okikioluwaojo-0aac415c-74be-4487-a112-6dc7337ce8cc";
  const [deployment, user_id] = split(rpc_body);
  const response = await getServiceExposedIP(deployment, user_id)
  const targetPorts = await getHostPortFromResponse("target-port", response)

const portTunnels = await tunnelPodPortforward(kubernetes, user_id, deployment, {ports: [Number(targetPorts)]});
  // await portForward(deployment, user_id, Number(targetPorts))

const goodPort = portTunnels.find(x => x.port == Number(targetPorts))!;
await goodPort.dataWritable.getWriter().write(new TextEncoder().encode(
`GET / HTTP/1.1
Connection: close
Host: asdf.com\n\n`));
console.log('done good write');
for await (const x of goodPort.dataReadable) {
  console.log('good', new TextDecoder().decode(x));
}
console.log('done good');
} catch (err) {
  console.error(err);
}
