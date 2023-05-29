import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { DocumentHead, useLocation } from "@builder.io/qwik-city";
import Peer from "~/components/peer/peer";

interface Peer {
  name: string;
  totalRx: number;
  totalTx: number;
  latestHandshake: number;
  allowedIps: string;
  expiresAt: number;
  currentRx: number;
  currentTx: number;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default component$(() => {
  const search = useSignal("");
  const peers = useSignal<Peer[]>([]);
  const groups = useSignal<{ [key: string]: Peer[] }>({});
  const totalRx = useSignal(0);
  const totalTx = useSignal(0);
  const currentRx = useSignal(0);
  const currentTx = useSignal(0);
  const isAdmin = useSignal(false);
  const showGroupView = useSignal(false);
  const sortByUsage = useSignal(true);

  const location = useLocation();

  useVisibleTask$(() => {
    setInterval(async () => {
      const res = await fetch(
        `${location.url.protocol}//api.${location.url.hostname}/api`
      );
      const data = await res.json();
      Object.keys(groups.value).forEach((gn) => (groups.value[gn].length = 0));
      const tempPeers: Peer[] = Object.values(data.peers);
      for (let i = 0; i < tempPeers.length; i++) {
        const groupName = tempPeers[i].name.split("-")[0];
        if (groups.value[groupName]) groups.value[groupName].push(tempPeers[i]);
        else groups.value[groupName] = [tempPeers[i]];
      }
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
    <>
      {isAdmin.value && (
        <div class="mx-2 my-4 pb-4 px-2 border-b-2 border-slate-900">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <img
                onClick$={() => (showGroupView.value = !showGroupView.value)}
                class="h-6 w-6 md:h-8 md:w-8 invert rounded-full hover:cursor-pointer"
                src={showGroupView.value ? "ungroup.png" : "group.png"}
                alt="group icon"
              />
              {!showGroupView.value && (
                <>
                  <div class="h-4 md:h-8 bg-slate-900 w-0.5 ml-1 mr-1.5" />
                  <img
                    onClick$={() => (sortByUsage.value = !sortByUsage.value)}
                    class="h-6 w-6 md:h-8 md:w-8 invert rounded-full hover:cursor-pointer"
                    src="sort.png"
                    alt="sort icon"
                  />
                </>
              )}
            </div>
            <div class="hidden md:flex items-center text-green-500">
              <div class="flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-4 w-4 md:h-6 md:w-6 pr-0.5"
                />
                {(currentRx.value / 1000000).toFixed(2)} MiB
              </div>
              <div class="flex items-center border-l-2 border-slate-900 pl-1 ml-1.5">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-4 w-4 md:h-6 md:w-6 pr-0.5"
                />
                {(currentTx.value / 1000000).toFixed(2)} MiB
              </div>
            </div>
            <div class="hidden md:flex items-center text-green-500">
              <div class="flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-4 w-4 md:h-6 md:w-6 pr-0.5"
                />
                {(totalRx.value / 1000000000).toFixed(2)} GiB
              </div>
              <div class="flex items-center border-l-2 border-slate-900 pl-1 ml-1.5">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(totalTx.value / 1000000000).toFixed(2)} GiB
              </div>
            </div>
            {showGroupView.value ? (
              <span>
                <span class="text-orange-500">
                  {Object.keys(groups.value).length}
                </span>{" "}
                User Groups
              </span>
            ) : (
              <span>
                <span class="text-orange-500">{peers.value.length}</span> Peers
              </span>
            )}
          </div>
          <div class="flex md:hidden justify-between mt-4">
            <div class="flex items-center text-green-500">
              <div class="flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(currentRx.value / 1000000).toFixed(2)} MiB
              </div>
              <div class="flex items-center border-l-2 border-slate-900 pl-1 ml-1.5">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(currentTx.value / 1000000).toFixed(2)} MiB
              </div>
            </div>
            <div class="flex items-center text-green-500">
              <div class="flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(totalRx.value / 1000000000).toFixed(2)} GiB
              </div>
              <div class="flex items-center border-l-2 border-slate-900 pl-1 ml-1.5">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(totalTx.value / 1000000000).toFixed(2)} GiB
              </div>
            </div>
          </div>
        </div>
      )}
      <div class="max-w-[768px] flex flex-col justify-center mx-4 md:mx-auto">
        {isAdmin.value && !showGroupView.value && (
          <input
            bind:value={search}
            type="text"
            class="px-2 py-1 rounded text-slate-950 mb-2 bg-slate-200"
          />
        )}
        {showGroupView.value
          ? Object.values(groups.value)
              .sort((a, b) => {
                return a.reduce((sum, p) => sum + p.totalRx, 0) >=
                  b.reduce((sum, p) => sum + p.totalRx, 0)
                  ? -1
                  : 1;
              })
              .map((g, j) => (
                <div
                  key={g[0].name}
                  class="border-2 border-slate-900 rounded my-4 p-2"
                >
                  <span class="text-orange-500">
                    {j + 1}. {g[0].name.split("-")[0]}
                  </span>
                  <div class="flex items-center justify-between py-2 mb-4 border-b-2 border-slate-900">
                    <span>Total Usage:</span>
                    <div class="flex my-2 text-green-500">
                      <div class="flex items-center">
                        <img
                          src="download.png"
                          alt="download icon"
                          class="invert w-6 h-6"
                        />
                        {(
                          g.reduce((sum, p) => sum + p.totalRx, 0) / 1000000000
                        ).toFixed(2)}{" "}
                        GiB
                      </div>
                      <div class="border-l-2 pl-0.5 ml-1 border-slate-800 flex items-center">
                        <img
                          src="upload.png"
                          alt="upload icon"
                          class="invert w-6 h-6"
                        />
                        {(
                          g.reduce((sum, p) => sum + p.totalTx, 0) / 1000000000
                        ).toFixed(2)}{" "}
                        GiB
                      </div>
                    </div>
                  </div>
                  {g
                    .sort((a, b) => (a.totalRx >= b.totalRx ? -1 : 1))
                    .map((p, i) => (
                      <Peer
                        r={currentRx.value} // to force render
                        {...p}
                        index={i}
                        isAdmin={isAdmin.value}
                        key={i}
                      />
                    ))}
                </div>
              ))
          : peers.value
              .filter((p) =>
                p.name.toLowerCase().includes(search.value.toLocaleLowerCase())
              )
              .sort((a, b) => {
                if (sortByUsage.value) return a.totalRx >= b.totalRx ? -1 : 1;
                return a.currentRx >= b.currentRx ? -1 : 1;
              })
              .map((p, i) => (
                <Peer
                  r={currentRx.value} // to force render
                  {...p}
                  index={i}
                  isAdmin={isAdmin.value}
                  key={i}
                />
              ))}
      </div>
    </>
  ) : (
    <div class="flex items-center justify-center h-[100vh]">Loading...</div>
  );
});

export const head: DocumentHead = {
  title: "Wireguard Stats",
  meta: [
    {
      name: "Wireguard Stats",
      content: "Wireguard Stats",
    },
  ],
};
