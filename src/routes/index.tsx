import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { DocumentHead, useNavigate } from "@builder.io/qwik-city";

interface Peer {
  name: string;
  totalRx: number;
  totalTx: number;
  latestHandshake: number;
  allowedIps: string;
  expiresAt: number;
  currentRx: number;
  currentTx: number;
  presharedKey: string;
  publicKey: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatLatestHandshake(totalSeconds: number) {
  if (!totalSeconds) return "unknown";
  totalSeconds = Math.trunc(Date.now() / 1000 - totalSeconds);
  const totalMinutes = Math.trunc(totalSeconds / 60);
  const totalHours = Math.trunc(totalMinutes / 60);
  const seconds = totalSeconds % 60;
  const minutes = totalMinutes % 60;
  const hours = totalHours % 24;
  const days = Math.trunc(totalHours / 24);
  let t = "";
  if (days) t += `${days} day${days > 1 ? "s" : ""}`;
  if (hours) t += `${days ? ", " : ""}${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes)
    t += `${hours ? ", " : ""}${minutes} minute${minutes > 1 ? "s" : ""}`;
  if (seconds)
    t += `${hours || minutes ? ", " : ""}${seconds} second${
      seconds > 1 ? "s" : ""
    }`;
  t += " ago";
  return t;
}

function formatExpiresAt(totalSeconds: number) {
  if (!totalSeconds) return "unknown";
  let t = "";
  totalSeconds = Math.trunc(totalSeconds - Date.now() / 1000);
  if (totalSeconds <= 0) t = "- ";
  totalSeconds = Math.abs(totalSeconds);
  const totalMinutes = Math.trunc(totalSeconds / 60);
  const totalHours = Math.trunc(totalMinutes / 60);
  const seconds = totalSeconds % 60;
  const minutes = totalMinutes % 60;
  const hours = totalHours % 24;
  const days = Math.trunc(totalHours / 24);
  if (days) t += `${days} day${days > 1 ? "s" : ""}`;
  if (hours) t += `${days ? ", " : ""}${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes)
    t += `${days || hours ? ", " : ""}${minutes} minute${
      minutes > 1 ? "s" : ""
    }`;
  if (seconds)
    t += `${days || hours || minutes ? ", " : ""} ${seconds} second${
      seconds > 1 ? "s" : ""
    }`;
  return t;
}

function formatBytes(totalBytes: number) {
  if (!totalBytes) return "00.00 KB";
  const totalKilos = totalBytes / 1024;
  const totalMegas = totalKilos / 1000;
  const totalGigas = totalMegas / 1000;
  const totalTeras = totalGigas / 1000;
  if (totalKilos < 100)
    return `${totalKilos < 10 ? "0" : ""}${totalKilos.toFixed(2)} KB`;
  if (totalMegas < 100)
    return `${totalMegas < 10 ? "0" : ""}${totalMegas.toFixed(2)} MB`;
  if (totalGigas < 100)
    return `${totalGigas < 10 ? "0" : ""}${totalGigas.toFixed(2)} GB`;
  return `${totalTeras < 10 ? "0" : ""}${totalTeras.toFixed(2)} TB`;
}

export default component$(() => {
  const self = useSignal("");
  const search = useSignal("");
  const peers = useSignal<Peer[]>([]);
  const groups = useSignal<{ [key: string]: Peer[] }>({});
  const totalRx = useSignal(0);
  const totalTx = useSignal(0);
  const currentRx = useSignal(0);
  const currentTx = useSignal(0);
  const isAdmin = useSignal(false);
  const sortBy = useSignal("expiry"); // expiry, traffic, bandwidth

  const nav = useNavigate();

  useVisibleTask$(() => {
    setInterval(async () => {
      const res = await fetch(
        import.meta.env.DEV ? "http://my.stats:5051/api/stats" : "/api"
      );
      const data = await res.json();
      Object.keys(groups.value).forEach((gn) => (groups.value[gn].length = 0));
      const tempPeers: Peer[] = Object.values(data.peers);
      for (let i = 0; i < tempPeers.length; i++) {
        const groupName = tempPeers[i].name.split("-")[0];
        if (groups.value[groupName]) groups.value[groupName].push(tempPeers[i]);
        else groups.value[groupName] = [tempPeers[i]];
      }
      self.value = data.name;
      peers.value = tempPeers;
      isAdmin.value = data.isAdmin;
      totalRx.value = data.totalRx;
      totalTx.value = data.totalTx;
      const rxSteps = (data.currentRx - currentRx.value) / 100;
      const txSteps = (data.currentTx - currentTx.value) / 100;
      for (let i = 10; i-- > 0; ) {
        if (currentRx.value + rxSteps < 0 || currentTx.value + txSteps < 0)
          break;
        currentRx.value += rxSteps;
        currentTx.value += txSteps;
        await sleep(100);
      }
    }, 1000);
  });

  return peers.value.length ? (
    <div class="min-h-[100vh] bg-neutral-950 font-bold text-neutral-50">
      <nav class="sticky left-0 top-0 z-10 flex h-16 w-full items-center justify-between border-b-2 border-neutral-900 bg-neutral-950 bg-opacity-90 px-4 backdrop-blur-sm backdrop-filter">
        <div class="text-2xl">Wireguard Stats</div>
        <div class="flex items-center">
          <div class="text-lg">{self.value}</div>
        </div>
      </nav>
      <main class="p-4">
        {isAdmin.value && (
          <div class="mb-6 flex items-center justify-between rounded-lg bg-neutral-900 px-4 py-2">
            <div>
              <div class="flex items-center">
                <div>{formatBytes(currentRx.value)}/S</div>
                <div class="mx-3 h-1.5 w-1.5 rounded-full bg-neutral-700" />
                <div>&#8595; {formatBytes(totalRx.value)}</div>
              </div>
              <div class="flex items-center">
                <div>{formatBytes(currentTx.value)}/S</div>
                <div class="mx-3 h-1.5 w-1.5 rounded-full bg-neutral-700" />
                <div>&#8593; {formatBytes(totalTx.value)}</div>
              </div>
            </div>
            <input
              placeholder="Search Peers"
              bind:value={search}
              type="text"
              class="h-8 w-64 rounded px-2 py-1 text-neutral-950"
            />
            <div class="flex items-center">
              <div>{Object.keys(groups.value).length} Groups</div>
              <div class="mx-3 h-1.5 w-1.5 rounded-full bg-neutral-700" />
              <div>{peers.value.length} Peers</div>
            </div>
          </div>
        )}
        {peers.value
          .filter((p) =>
            p.name.toLowerCase().includes(search.value.toLocaleLowerCase())
          )
          .sort((a, b) => {
            if (sortBy.value === "expiry")
              return a.expiresAt < b.expiresAt ? -1 : 1;
            if (sortBy.value === "traffic")
              return a.totalRx >= b.totalRx ? -1 : 1;
            return a.currentRx >= b.currentRx ? -1 : 1;
          })
          .map((p, i) => (
            <div
              key={i}
              class="my-2 rounded border-2 border-neutral-800 bg-neutral-900 px-4 py-2"
            >
              <div class="mb-2 flex items-center justify-between border-b-[1px] border-neutral-800 pb-2">
                <div class="text-lg">{p.name}</div>
                {isAdmin.value && (
                  <a
                    href={`/peer/${p.name}`}
                    class="rounded bg-orange-600 px-2 py-1 tracking-wider hover:bg-orange-500"
                  >
                    EDIT
                  </a>
                )}
              </div>
              <div class="mb-2 flex items-center">
                <div>&#8595; {formatBytes(p.currentRx)}/S</div>
                <div class="mx-2 h-1 w-1 rounded-full bg-neutral-700" />
                <div>{formatBytes(p.totalRx)}</div>
              </div>
              <div class="mb-2 flex items-center">
                <div>&#8593; {formatBytes(p.currentTx)}/S</div>
                <div class="mx-2 h-1 w-1 rounded-full bg-neutral-700" />
                <div>{formatBytes(p.totalTx)}</div>
              </div>
              <div class="mb-2 max-md:truncate max-md:text-xs max-md:tracking-tighter">
                <span>Latest Handshake</span>
                <span class="mx-1">:</span>
                <span>{formatLatestHandshake(p.latestHandshake)}</span>
              </div>
              <div class="max-md:truncate max-md:text-xs max-md:tracking-tighter">
                <span>Expiry</span>
                <span class="mx-1">:</span>
                <span
                  class={
                    p.expiresAt - Date.now() / 1000 <= 0
                      ? "text-red-500"
                      : "text-blue-500"
                  }
                >
                  {formatExpiresAt(p.expiresAt)}
                </span>
              </div>
            </div>
          ))}
      </main>
    </div>
  ) : (
    <div class="flex h-[100vh] items-center justify-center">Loading...</div>
  );
});

export const head: DocumentHead = {
  title: "Wireguard Stats",
  meta: [
    {
      name: "description",
      content: "Wireguard Stats",
    },
  ],
};
