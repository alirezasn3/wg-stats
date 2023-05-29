import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

interface Peer {
  Name: string;
  Rx: number;
  Tx: number;
  LatestHandshake: number;
  AllowedIps: string;
  ExpiresAt: number;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatTime(totalSeconds: number) {
  if (!totalSeconds) return "unknown";
  totalSeconds = Math.trunc(Date.now() / 1000 - totalSeconds);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let t = "";
  if (hours) t += hours + " hours";
  if (minutes)
    t += `${hours ? ", " : ""}${minutes} minute${minutes > 1 ? "s" : ""}`;
  if (seconds)
    t += `${hours || minutes ? ", " : ""} ${seconds} second${
      seconds > 1 ? "s" : ""
    }`;
  t += " ago";
  return t;
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
  useVisibleTask$(() => {
    setInterval(async () => {
      const res = await fetch("http://my.stats:5051/api");
      const data = await res.json();
      let tRx = 0;
      let tTx = 0;
      Object.keys(groups.value).forEach((gn) => (groups.value[gn].length = 0));
      let tempPeers: Peer[] = Object.values(data.Peers);
      if (search.value !== "")
        tempPeers = tempPeers.filter((p) =>
          p.Name.toLowerCase().includes(search.value.toLocaleLowerCase())
        );
      tempPeers = tempPeers.sort((a, b) => (a.Rx >= b.Rx ? -1 : 1));
      for (let i = 0; i < tempPeers.length; i++) {
        tRx += tempPeers[i].Rx;
        tTx += tempPeers[i].Tx;
        const groupName = tempPeers[i].Name.split("-")[0];
        if (groups.value[groupName]) groups.value[groupName].push(tempPeers[i]);
        else groups.value[groupName] = [tempPeers[i]];
      }
      totalRx.value = tRx;
      totalTx.value = tTx;
      peers.value = tempPeers;
      isAdmin.value = data.IsAdmin;
      const rxSteps = (data.Rx - currentRx.value) / 50;
      const txSteps = (data.Tx - currentTx.value) / 50;
      for (let i = 20; i-- > 0; ) {
        if (currentRx.value + rxSteps < 0 || currentTx.value + txSteps < 0)
          break;
        currentRx.value += rxSteps;
        currentTx.value += txSteps;
        await sleep(50);
      }
    }, 1000);
  });
  return peers.value.length ? (
    <>
      {isAdmin.value && (
        <div class="mx-2 my-4 pb-2 px-2 border-b-2 border-slate-900">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <img
                onClick$={() => (showGroupView.value = !showGroupView.value)}
                class="w-6 md:w-8 invert rounded-full hover:cursor-pointer"
                src={showGroupView.value ? "ungroup.png" : "group.png"}
                alt="group icon"
              />
            </div>
            <div class="hidden md:flex items-center text-green-500">
              <div class="flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(currentRx.value / 8000000).toFixed(2)} MiB
              </div>
              <div class="flex items-center border-l-2 border-slate-900 pl-1 ml-1.5">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(currentTx.value / 8000000).toFixed(2)} MiB
              </div>
            </div>
            <div class="hidden md:flex items-center text-green-500">
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
          <div class="flex md:hidden justify-between mt-4 text-xs">
            <div class="flex items-center text-green-500">
              <div class="flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(currentRx.value / 8000000).toFixed(2)} MiB
              </div>
              <div class="flex items-center border-l-2 border-slate-900 pl-1 ml-1.5">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-4 w-4 md:h-6 md:2-6 pr-0.5"
                />
                {(currentTx.value / 8000000).toFixed(2)} MiB
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
        {isAdmin.value && (
          <>
            <input
              bind:value={search}
              type="text"
              class="px-2 py-1 rounded text-black"
            />
          </>
        )}
        {showGroupView.value
          ? Object.values(groups.value)
              .sort((a, b) => {
                const aRx = a.reduce((partialSum, a) => partialSum + a.Rx, 0);
                const bRx = b.reduce((partialSum, a) => partialSum + a.Rx, 0);
                return aRx >= bRx ? -1 : 1;
              })
              .map((g, j) => (
                <div
                  key={g[0].Name}
                  class="bg-slate-900 border-2 border-slate-800 rounded my-4 px-2 py-1"
                >
                  <span class="text-orange-500">
                    {j + 1}. {g[0].Name.split("-")[0]}
                  </span>
                  <div class="flex items-center justify-between py-2 mb-4 border-b-2 border-slate-800">
                    <span>Total Usage:</span>
                    <div class="flex my-2 text-green-500">
                      <div class="flex items-center">
                        <img
                          src="download.png"
                          alt="download icon"
                          class="invert w-6 h-6"
                        />
                        {(
                          g.reduce((partialSum, a) => partialSum + a.Rx, 0) /
                          1000000000
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
                          g.reduce((partialSum, a) => partialSum + a.Tx, 0) /
                          1000000000
                        ).toFixed(2)}{" "}
                        GiB
                      </div>
                    </div>
                  </div>
                  {g.map((u, i) => (
                    <div
                      key={u.Name + i}
                      class="bg-slate-800 my-2 px-2 py-1 rounded"
                    >
                      <div class="flex items-center justify-between border-b-[1px] border-slate-700 pb-1.5">
                        <span class="truncate">
                          {i + 1}. {u.Name}
                        </span>
                        <div class="flex my-2 text-green-500">
                          <div class="flex items-center">
                            <img
                              src="download.png"
                              alt="download icon"
                              class="invert w-4 h-4 md:w-6 md:h-6"
                            />
                            {(u.Rx / 1000000000).toFixed(2)} GiB
                          </div>
                          <div class="border-l-2 pl-0.5 ml-1 border-slate-700 flex items-center">
                            <img
                              src="upload.png"
                              alt="upload icon"
                              class="invert w-4 h-4 md:w-6 md:h-6"
                            />
                            {(u.Tx / 1000000000).toFixed(2)} GiB
                          </div>
                        </div>
                      </div>
                      <div class="mt-3 mb-1 tracking-tighter truncate text-blue-500">
                        <span class="text-white">Latest Handshake: </span>
                        <div class="mb-2 pb-2 border-b-[1px] border-slate-700">
                          {formatTime(u.LatestHandshake)}
                        </div>
                        <div class="flex justify-between items-center">
                          <div>
                            <span class="text-white">Expires In: </span>
                            <span
                              title={new Date(
                                u.ExpiresAt * 1000
                              ).toLocaleDateString()}
                            >
                              {u.ExpiresAt
                                ? Math.ceil(
                                    (u.ExpiresAt - Date.now() / 1000) /
                                      60 /
                                      60 /
                                      24
                                  )
                                : "?"}{" "}
                              days
                            </span>
                          </div>
                          <div
                            class={`${
                              isAdmin.value ? "flex" : "hidden"
                            } items-center`}
                          >
                            <img
                              onClick$={() =>
                                fetch("http://my.stats:5051/api", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    Name: u.Name,
                                    ExpiresAt: u.ExpiresAt + 24 * 3600,
                                  }),
                                })
                              }
                              src="add.png"
                              alt="add icon"
                              class="mr-4 invert w-6 h-6 md:w-8 md:h-8 border-black border-2 rounded-full hover:cursor-pointer"
                            />
                            <img
                              onClick$={() =>
                                fetch("http://my.stats:5051/api", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    Name: u.Name,
                                    ExpiresAt: u.ExpiresAt - 24 * 3600,
                                  }),
                                })
                              }
                              src="remove.png"
                              alt="remove icon"
                              class="invert w-6 h-6 md:w-8 md:h-8 border-black border-2 rounded-full hover:cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
          : peers.value.map((u, i) => (
              <div
                key={i}
                class="bg-slate-900 border-2 border-slate-800 rounded my-4 px-2 py-1"
              >
                <div class="flex items-center justify-between border-b-[1px] border-slate-800 pb-1.5">
                  <span class="truncate">
                    {i + 1}. {u.Name}
                  </span>
                  <div class="flex my-2 text-green-500">
                    <div class="flex items-center">
                      <img
                        src="download.png"
                        alt="download icon"
                        class="invert w-4 h-4 md:w-6 md:h-6"
                      />
                      {(u.Rx / 1000000000).toFixed(2)} GiB
                    </div>
                    <div class="border-l-2 border-slate-800 pl-0.5 ml-1 flex items-center">
                      <img
                        src="upload.png"
                        alt="upload icon"
                        class="invert w-4 h-4 md:w-6 md:h-6"
                      />
                      {(u.Tx / 1000000000).toFixed(2)} GiB
                    </div>
                  </div>
                </div>
                <div class="mt-3 mb-1 tracking-tighter truncate text-blue-500">
                  <span class="text-white">Latest Handshake: </span>
                  <div class="mb-2 pb-2 border-b-[1px] border-slate-800">
                    {formatTime(u.LatestHandshake)}
                  </div>
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="text-white">Expires In: </span>
                      <span
                        title={new Date(
                          u.ExpiresAt * 1000
                        ).toLocaleDateString()}
                      >
                        {u.ExpiresAt
                          ? Math.ceil(
                              (u.ExpiresAt - Date.now() / 1000) / 60 / 60 / 24
                            )
                          : "?"}{" "}
                        days
                      </span>
                    </div>
                    <div
                      class={`${
                        isAdmin.value ? "flex" : "hidden"
                      } items-center`}
                    >
                      <img
                        onClick$={() =>
                          fetch("http://my.stats:5051/api", {
                            method: "POST",
                            body: JSON.stringify({
                              Name: u.Name,
                              ExpiresAt: u.ExpiresAt + 24 * 3600,
                            }),
                          })
                        }
                        src="add.png"
                        alt="add icon"
                        class="mr-4 invert w-6 h-6 md:w-8 md:h-8 border-black border-2 rounded-full hover:cursor-pointer"
                      />
                      <img
                        onClick$={() =>
                          fetch("http://my.stats:5051/api", {
                            method: "POST",
                            body: JSON.stringify({
                              Name: u.Name,
                              ExpiresAt: u.ExpiresAt - 24 * 3600,
                            }),
                          })
                        }
                        src="remove.png"
                        alt="remove icon"
                        class="invert w-6 h-6 md:w-8 md:h-8 border-black border-2 rounded-full hover:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
