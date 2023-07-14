import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  Peer,
  formatBytes,
  formatExpiresAt,
  formatLatestHandshake,
} from "~/routes";

export default component$(() => {
  const loc = useLocation();
  const peer = useSignal<Peer>();
  useVisibleTask$(() => {
    setInterval(async () => {
      const res = await fetch(
        import.meta.env.DEV
          ? "http://my.stats:5051/api/peers/" + loc.params.name
          : "/api/peers/" + loc.params.name
      );
      peer.value = await res.json();
      console.log(peer.value);
    }, 1000);
  });
  return (
    <div class="min-h-[100vh] bg-neutral-950 font-bold text-neutral-50">
      <nav class="sticky left-0 top-0 z-10 flex h-16 w-full items-center justify-between border-b-2 border-neutral-900 bg-neutral-950 bg-opacity-90 px-4 backdrop-blur-sm backdrop-filter">
        <div class="text-2xl max-md:text-xl">Wireguard Stats</div>
      </nav>
      <main class="p-4">
        <div class="mb-2">{peer.value?.name}</div>
        <div class="mb-2 flex items-center">
          <div>&#8595; {formatBytes(peer.value?.currentRx || 0)}/S</div>
          <div class="mx-2 h-1 w-1 rounded-full bg-neutral-700" />
          <div>{formatBytes(peer.value?.totalRx || 0)}</div>
        </div>
        <div class="mb-2 flex items-center">
          <div>&#8593; {formatBytes(peer.value?.currentTx || 0)}/S</div>
          <div class="mx-2 h-1 w-1 rounded-full bg-neutral-700" />
          <div>{formatBytes(peer.value?.totalTx || 0)}</div>
        </div>
        <div class="mb-2 max-md:truncate max-md:text-xs max-md:tracking-tighter">
          <span>Latest Handshake</span>
          <span class="mx-1">:</span>
          <span>{formatLatestHandshake(peer.value?.latestHandshake || 0)}</span>
        </div>
        <div class="max-md:truncate max-md:text-xs max-md:tracking-tighter">
          <span>Expiry</span>
          <span class="mx-1">:</span>
          <span
            class={
              (peer.value?.expiresAt || 0) - Date.now() / 1000 <= 0
                ? "text-red-500"
                : "text-blue-500"
            }
          >
            {formatExpiresAt(peer.value?.expiresAt || 0)}
          </span>
        </div>
      </main>
    </div>
  );
});
