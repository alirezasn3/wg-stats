import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

interface User {
  Name: string;
  Rx: number;
  Tx: number;
  LastestHandshake: string;
  AllowedIps: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default component$(() => {
  const users = useSignal<User[]>([]);
  const groups = useSignal<{ [key: string]: User[] }>({});
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
      for (let i = 0; i < data.Users.length; i++) {
        tRx += data.Users[i].Rx;
        tTx += data.Users[i].Tx;
        const groupName = data.Users[i].Name.split("-")[0];
        if (groups.value[groupName])
          groups.value[groupName].push(data.Users[i]);
        else groups.value[groupName] = [data.Users[i]];
      }
      totalRx.value = tRx;
      totalTx.value = tTx;
      users.value = data.Users;
      isAdmin.value = data.isAdmin;
      const rxSteps = (data.Rx - currentRx.value) / 50;
      const txSteps = (data.Tx - currentTx.value) / 50;
      for (let i = 20; i-- > 0; ) {
        currentRx.value += rxSteps;
        currentTx.value += txSteps;
        await sleep(50);
      }
    }, 1000);
  });
  return users.value.length ? (
    <div class={`block ${isAdmin.value ? "md:grid grid-cols-2 h-full" : ""}`}>
      {isAdmin.value && (
        <div class="my-2 border-r-2 border-slate-900">
          <span class="mx-2 my-4 pb-2 px-2 border-b-2 border-slate-800 flex items-center justify-between font-bold text-2xl">
            Server Stats
          </span>
          <div class="text-sm md:text-lg md:h-[calc(100%-80px)] font-bold bg-slate-900 mx-2 px-2 rounded border-2 border-slate-800">
            <div class="flex items-center my-4 text-green-500">
              <span class="text-white w-[30%] md:w-[33.3%]">Total Usage:</span>
              <div class="w-[35%] md:w-[33.3%] flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-6 w-6 pr-0.5"
                />
                {(totalRx.value / 1000000000).toFixed(2)} GiB
              </div>
              <div class="w-[35%] md:w-[33.3%] flex items-center">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-6 w-6 pr-0.5"
                />
                {(totalTx.value / 1000000000).toFixed(2)} GiB
              </div>
            </div>
            <div class="flex items-center my-8 text-green-500">
              <span class="text-white w-[30%] md:w-[33.3%]">Bandwidth:</span>
              <div class="w-[35%] md:w-[33.3%] flex items-center">
                <img
                  src="download.png"
                  alt="download icon"
                  class="invert h-6 w-6 pr-0.5"
                />
                {(currentRx.value / 8000000).toFixed(2)} MiB
              </div>
              <div class="w-[35%] md:w-[33.3%] flex items-center">
                <img
                  src="upload.png"
                  alt="upload icon"
                  class="invert h-6 w-6 pr-0.5"
                />
                {(currentTx.value / 8000000).toFixed(2)} MiB
              </div>
            </div>
            <span class="flex items-center my-8">
              <span class="pr-1 w-[30%] md:w-[33.3%]">Users: </span>
              <span>{users.value.length}</span>
            </span>
            <span class="flex items-center my-8">
              <span class="pr-1 w-[30%] md:w-[33.3%]">User Groups: </span>
              <span>{Object.keys(groups.value).length}</span>
            </span>
          </div>
        </div>
      )}
      <div class="max-h-full md:overflow-auto">
        <div class="mx-2 my-4 pb-2 px-2 border-b-2 border-slate-800 flex items-center justify-between">
          <div class="flex items-center">
            <img
              onClick$={() => (showGroupView.value = !showGroupView.value)}
              class="w-10 p-1 invert rounded-full hover:cursor-pointer mr-4"
              src={showGroupView.value ? "ungroup.png" : "group.png"}
              alt="group icon"
            />
            {/* <img
              class="w-10 p-1 invert rounded-full hover:cursor-pointer"
              src="sort.png"
              alt="sort icon"
            /> */}
          </div>
          <span class="font-bold text-lg">Sorting users by usage</span>
        </div>
        {showGroupView.value
          ? Object.values(groups.value).map((g, j) => (
              <div
                key={g[0].Name}
                class="bg-slate-900 border-2 border-slate-800 rounded mx-2 my-4 px-2 py-1 font-bold"
              >
                <span class="text-lg text-orange-500">
                  {j + 1}. {g[0].Name.split("-")[0]}
                </span>
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
                          />{" "}
                          {(u.Rx / 1000000000).toFixed(2)} GiB
                        </div>
                        <div class="border-l-2 pl-0.5 ml-1 border-slate-600 flex items-center">
                          <img
                            src="upload.png"
                            alt="upload icon"
                            class="invert w-4 h-4 md:w-6 md:h-6"
                          />
                          {(u.Tx / 1000000000).toFixed(2)} GiB
                        </div>
                      </div>
                    </div>
                    <div class="mt-3 truncate text-blue-500">
                      <span class="text-white">Latest Handshake: </span>
                      <span>{u.LastestHandshake || "never"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))
          : users.value.map((u, i) => (
              <div
                key={i}
                class="bg-slate-900 border-2 border-slate-800 rounded mx-2 my-4 px-2 py-1 font-bold"
              >
                <div class="flex items-center justify-between border-b-[1px] border-slate-800 pb-1.5">
                  <span class="md:text-lg truncate">
                    {i + 1}. {u.Name}
                  </span>
                  <div class="flex my-2 text-green-500">
                    <div class="flex items-center">
                      <img
                        src="download.png"
                        alt="download icon"
                        class="invert w-4 h-4 md:w-6 md:h-6"
                      />{" "}
                      {(u.Rx / 1000000000).toFixed(2)} GiB
                    </div>
                    <div class="border-l-2 border-slate-600 pl-0.5 ml-1 flex items-center">
                      <img
                        src="upload.png"
                        alt="upload icon"
                        class="invert w-4 h-4 md:w-6 md:h-6"
                      />
                      {(u.Tx / 1000000000).toFixed(2)} GiB
                    </div>
                  </div>
                </div>
                <div class="mt-3 tracking-tighter truncate text-blue-500">
                  <span class="text-white">Latest Handshake: </span>
                  <span>{u.LastestHandshake || ""}</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  ) : (
    <div class="font-bold text-xl flex items-center justify-center h-full ">
      Loading...
    </div>
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
