import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const users = useSignal([
    { Name: "test", Rx: 0, Tx: 0, LastestHandshake: "" },
  ]);
  const totalRx = useSignal("0");
  const totalTx = useSignal("0");
  const total = useSignal("0");
  const currentRx = useSignal("0");
  const currentTx = useSignal("0");
  const isAdmin = useSignal(false);
  useVisibleTask$(async () => {
    setInterval(async () => {
      const res = await fetch("http://my.stats:5051/api", { mode: "no-cors" });
      const data = await res.json();
      console.log(data);
      let tRx = 0;
      let tTx = 0;
      for (let i = data.Users.length; i-- > 0; ) {
        tRx += data.Users[i].Rx;
        tTx += data.Users[i].Tx;
      }
      totalRx.value = (tRx / 1000000000).toFixed(2);
      totalTx.value = (tTx / 1000000000).toFixed(2);
      total.value = ((tRx + tTx) / 1000000000).toFixed(2);
      currentRx.value = (data.Rx / 8000000).toFixed(2);
      currentTx.value = (data.Rx / 8000000).toFixed(2);
      users.value = data.Users;
      isAdmin.value = data.isAdmin;
      // if (groupView) {
      //   const groups = {};
      //   for (let i = data.Users.length; i-- > 0; ) {
      //     const gn = data.Users[i].Name.split("-")[0];
      //     if (groups[gn]) groups[gn].push(data.Users[i]);
      //     else {
      //       groups[gn] = [data.Users[i]];
      //     }
      //   }
      //   console.log(groups);
      // }
    }, 1000);
  });
  return (
    <>
      <div class="border-b-2 border-slate-600 flex flex-col justify-center items-center my-8 mx-4">
        <div class="font-semibold">Total Usage</div>
        <div class="flex my-2 text-green-500 text-sm md:text-lg font-bold">
          <div>&#8595 {totalRx} GiB</div>
          <div class="border-x-[1px] border-slate-600 mx-1 px-1">
            &#8593 {totalTx} GiB
          </div>
          <div>&#8721 {total} GiB</div>
        </div>
        <div x-show="isAdmin[0]" class="font-semibold mt-4">
          Current Usage
        </div>
        {isAdmin && (
          <div class="flex my-2 text-green-500 text-sm md:text-lg font-bold">
            <div x-text="'&#8595 '+(current[0]||0)+' MiB'"></div>
            <div
              x-text="'&#8593 '+(current[1]||0)+' MiB'"
              class="border-l-[1px] border-slate-600 ml-1 pl-1"
            ></div>
          </div>
        )}
      </div>
      {users.value.map((u, i) => (
        <div class="bg-slate-700 rounded mx-4 my-2 px-2 py-1 font-semibold">
          <span class="font-semibold">{i + 1}. </span>
          <span>{u.Name}</span>
          <div class="flex my-2 text-green-500 text-sm md:text-lg">
            <div>&#8595 {(u.Rx / 1000000000).toFixed(2)} GiB</div>
            <div class="border-x-[1px] border-slate-600 mx-1 px-1">
              &#8593 {(u.Tx / 1000000000).toFixed(2)} GiB
            </div>
            <div>&#8721 {((u.Rx + u.Tx) / 1000000000).toFixed(2)} GiB</div>
          </div>
          <div class="text-sm">
            Latest Handshake:
            <div class="text-blue-500 font-bold block md:inline text-xs md:text-base pt-2">
              {u.LastestHandshake || ""}
            </div>
          </div>
        </div>
      ))}
    </>
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
