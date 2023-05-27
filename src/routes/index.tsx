import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

interface User {
  Name: string;
  Rx: number;
  Tx: number;
  LastestHandshake: string;
  AllowedIps: string;
}

export default component$(() => {
  const users = useSignal<User[]>([
    {
      Name: "mo-1",
      Rx: 151059997558,
      Tx: 8170000076,
      LastestHandshake: "2 hours, 17 minutes, 33 seconds ago",
      AllowedIps: "10.66.66.8",
    },
    {
      Name: "Raman-1",
      Rx: 32569999694,
      Tx: 17950000762,
      LastestHandshake: "1 hour, 25 minutes, 31 seconds ago",
      AllowedIps: "10.66.66.25",
    },
    {
      Name: "Saleh-0",
      Rx: 33810001373,
      Tx: 1240000009,
      LastestHandshake: "1 minute, 52 seconds ago",
      AllowedIps: "10.66.66.31",
    },
    {
      Name: "Raman-0",
      Rx: 25100000381,
      Tx: 1690000057,
      LastestHandshake: "4 minutes ago",
      AllowedIps: "10.66.66.24",
    },
    {
      Name: "KianZara-0",
      Rx: 22559999465,
      Tx: 976340026,
      LastestHandshake: "1 hour, 45 minutes, 44 seconds ago",
      AllowedIps: "10.66.66.9",
    },
    {
      Name: "Aryan-0",
      Rx: 20639999389,
      Tx: 1120000004,
      LastestHandshake: "2 hours, 21 minutes, 3 seconds ago",
      AllowedIps: "10.66.66.5",
    },
    {
      Name: "mo-0",
      Rx: 20479999542,
      Tx: 1259999990,
      LastestHandshake: "1 minute, 44 seconds ago",
      AllowedIps: "10.66.66.7",
    },
    {
      Name: "Negin-1",
      Rx: 19370000839,
      Tx: 1559999942,
      LastestHandshake: "35 seconds ago",
      AllowedIps: "10.66.66.28",
    },
    {
      Name: "RezaRad-1",
      Rx: 16569999694,
      Tx: 806309997,
      LastestHandshake: "3 hours, 11 minutes, 23 seconds ago",
      AllowedIps: "10.66.66.23",
    },
    {
      Name: "mo-3",
      Rx: 16430000305,
      Tx: 668260009,
      LastestHandshake: "7 hours, 36 minutes, 28 seconds ago",
      AllowedIps: "10.66.66.33",
    },
    {
      Name: "RezaRad-0",
      Rx: 15670000076,
      Tx: 789979980,
      LastestHandshake: "1 minute, 7 seconds ago",
      AllowedIps: "10.66.66.22",
    },
    {
      Name: "AhmadKia-0",
      Rx: 15199999809,
      Tx: 738770019,
      LastestHandshake: "38 minutes, 31 seconds ago",
      AllowedIps: "10.66.66.12",
    },
    {
      Name: "mo-2",
      Rx: 13710000038,
      Tx: 861330017,
      LastestHandshake: "4 hours, 25 minutes, 26 seconds ago",
      AllowedIps: "10.66.66.30",
    },
    {
      Name: "SepiBey-0",
      Rx: 13470000267,
      Tx: 442239990,
      LastestHandshake: "5 minutes, 3 seconds ago",
      AllowedIps: "10.66.66.40",
    },
    {
      Name: "SepiBey-1",
      Rx: 12850000381,
      Tx: 919010009,
      LastestHandshake: "55 minutes, 5 seconds ago",
      AllowedIps: "10.66.66.42",
    },
    {
      Name: "Payam-0",
      Rx: 12029999732,
      Tx: 989330017,
      LastestHandshake: "1 hour, 47 minutes, 28 seconds ago",
      AllowedIps: "10.66.66.20",
    },
    {
      Name: "Firooz-1",
      Rx: 9020000457,
      Tx: 3980000019,
      LastestHandshake: "9 minutes, 10 seconds ago",
      AllowedIps: "10.66.66.26",
    },
    {
      Name: "Sohrab-0",
      Rx: 12000000000,
      Tx: 721669982,
      LastestHandshake: "33 minutes, 34 seconds ago",
      AllowedIps: "10.66.66.32",
    },
    {
      Name: "Al-0",
      Rx: 11069999694,
      Tx: 894330017,
      LastestHandshake: "55 seconds ago",
      AllowedIps: "10.66.66.17",
    },
    {
      Name: "KianZara-1",
      Rx: 11159999847,
      Tx: 242190002,
      LastestHandshake: "3 hours, 51 minutes, 32 seconds ago",
      AllowedIps: "10.66.66.10",
    },
    {
      Name: "Al-1",
      Rx: 9840000152,
      Tx: 635090026,
      LastestHandshake: "1 minute, 15 seconds ago",
      AllowedIps: "10.66.66.18",
    },
    {
      Name: "Payam-1",
      Rx: 8810000419,
      Tx: 920289978,
      LastestHandshake: "4 hours, 3 minutes, 58 seconds ago",
      AllowedIps: "10.66.66.21",
    },
    {
      Name: "AhmadKia-1",
      Rx: 8600000381,
      Tx: 188460006,
      LastestHandshake: "1 minute, 45 seconds ago",
      AllowedIps: "10.66.66.13",
    },
    {
      Name: "Sohrab-1",
      Rx: 8170000076,
      Tx: 198479995,
      LastestHandshake: "1 minute, 27 seconds ago",
      AllowedIps: "10.66.66.46",
    },
    {
      Name: "SepiNick-0",
      Rx: 7550000190,
      Tx: 277649993,
      LastestHandshake: "6 hours, 2 minutes, 40 seconds ago",
      AllowedIps: "10.66.66.49",
    },
    {
      Name: "Adineh-0",
      Rx: 7190000057,
      Tx: 523159973,
      LastestHandshake: "41 seconds ago",
      AllowedIps: "10.66.66.2",
    },
    {
      Name: "KianZara-2",
      Rx: 7119999885,
      Tx: 479369995,
      LastestHandshake: "2 hours, 19 minutes, 32 seconds ago",
      AllowedIps: "10.66.66.11",
    },
    {
      Name: "Adineh-3",
      Rx: 6679999828,
      Tx: 305170013,
      LastestHandshake: "3 hours, 44 minutes, 3 seconds ago",
      AllowedIps: "10.66.66.29",
    },
    {
      Name: "Dani-0",
      Rx: 6440000057,
      Tx: 538690002,
      LastestHandshake: "1 hour, 8 minutes, 24 seconds ago",
      AllowedIps: "10.66.66.16",
    },
    {
      Name: "AghaMohammad-1",
      Rx: 6630000114,
      Tx: 300350006,
      LastestHandshake: "1 hour, 31 minutes, 32 seconds ago",
      AllowedIps: "10.66.66.36",
    },
    {
      Name: "Negin-0",
      Rx: 4579999923,
      Tx: 1159999966,
      LastestHandshake: "28 seconds ago",
      AllowedIps: "10.66.66.27",
    },
    {
      Name: "Azi-1",
      Rx: 5210000038,
      Tx: 351630004,
      LastestHandshake: "5 minutes, 50 seconds ago",
      AllowedIps: "10.66.66.45",
    },
    {
      Name: "AhmadKia-3",
      Rx: 4039999961,
      Tx: 1419999957,
      LastestHandshake: "2 hours, 8 minutes, 51 seconds ago",
      AllowedIps: "10.66.66.15",
    },
    {
      Name: "Adineh-2",
      Rx: 4969999790,
      Tx: 175059997,
      LastestHandshake: "2 hours, 47 minutes, 57 seconds ago",
      AllowedIps: "10.66.66.4",
    },
    {
      Name: "AhmadKia-2",
      Rx: 4329999923,
      Tx: 408290008,
      LastestHandshake: "4 hours, 22 minutes, 5 seconds ago",
      AllowedIps: "10.66.66.14",
    },
    {
      Name: "Masim-0",
      Rx: 4239999771,
      Tx: 297119995,
      LastestHandshake: "1 minute, 33 seconds ago",
      AllowedIps: "10.66.66.48",
    },
    {
      Name: "Sohrab-2",
      Rx: 4329999923,
      Tx: 168000000,
      LastestHandshake: "30 seconds ago",
      AllowedIps: "10.66.66.47",
    },
    {
      Name: "Shemi-0",
      Rx: 4090000152,
      Tx: 243919998,
      LastestHandshake: "2 hours, 33 minutes, 16 seconds ago",
      AllowedIps: "10.66.66.51",
    },
    {
      Name: "Shemi-1",
      Rx: 3509999990,
      Tx: 179779998,
      LastestHandshake: "3 hours, 32 minutes, 26 seconds ago",
      AllowedIps: "10.66.66.52",
    },
    {
      Name: "AghaMaleki-0",
      Rx: 3359999895,
      Tx: 172399993,
      LastestHandshake: "10 hours, 15 minutes, 44 seconds ago",
      AllowedIps: "10.66.66.6",
    },
    {
      Name: "Sara-0",
      Rx: 3130000114,
      Tx: 353059997,
      LastestHandshake: "4 hours, 44 minutes, 50 seconds ago",
      AllowedIps: "10.66.66.43",
    },
    {
      Name: "AghaMohammad-3",
      Rx: 3059999942,
      Tx: 170559997,
      LastestHandshake: "1 day, 8 hours, 9 minutes, 1 second ago",
      AllowedIps: "10.66.66.38",
    },
    {
      Name: "SepiNick-1",
      Rx: 2890000104,
      Tx: 331010009,
      LastestHandshake: "1 day, 1 hour, 30 seconds ago",
      AllowedIps: "10.66.66.50",
    },
    {
      Name: "Azi-0",
      Rx: 3009999990,
      Tx: 209350006,
      LastestHandshake: "3 hours, 31 minutes, 2 seconds ago",
      AllowedIps: "10.66.66.44",
    },
    {
      Name: "AghaMohammad-0",
      Rx: 2849999904,
      Tx: 227289993,
      LastestHandshake: "3 hours, 22 minutes, 43 seconds ago",
      AllowedIps: "10.66.66.35",
    },
    {
      Name: "AghaMohammad-2",
      Rx: 2450000047,
      Tx: 129240005,
      LastestHandshake: "6 seconds ago",
      AllowedIps: "10.66.66.37",
    },
    {
      Name: "mo-4",
      Rx: 1559999942,
      Tx: 100940002,
      LastestHandshake: "3 days, 9 hours, 18 minutes, 47 seconds ago",
      AllowedIps: "10.66.66.39",
    },
    {
      Name: "Shemi-2",
      Rx: 1610000014,
      Tx: 37169998,
      LastestHandshake: "3 hours, 41 minutes, 26 seconds ago",
      AllowedIps: "10.66.66.53",
    },
    {
      Name: "Adineh-1",
      Rx: 1519999980,
      Tx: 97629997,
      LastestHandshake: "5 hours, 7 minutes, 58 seconds ago",
      AllowedIps: "10.66.66.3",
    },
    {
      Name: "AghaMohammad-4",
      Rx: 433750000,
      Tx: 38060001,
      LastestHandshake: "4 minutes, 24 seconds ago",
      AllowedIps: "10.66.66.41",
    },
    {
      Name: "VahidYaqubi-0",
      Rx: 58119998,
      Tx: 36529998,
      LastestHandshake: "10 minutes, 41 seconds ago",
      AllowedIps: "10.66.66.54",
    },
    {
      Name: "Aryan-1",
      Rx: 0,
      Tx: 0,
      LastestHandshake: "",
      AllowedIps: "10.66.66.19",
    },
    {
      Name: "Aryan-2",
      Rx: 0,
      Tx: 0,
      LastestHandshake: "",
      AllowedIps: "10.66.66.34",
    },
  ]);
  const groups = useSignal<{ [key: string]: User[] }>({});
  const totalRx = useSignal("0");
  const totalTx = useSignal("0");
  const total = useSignal("0");
  const currentRx = useSignal("0");
  const currentTx = useSignal("0");
  const isAdmin = useSignal(false);
  const showGroupView = useSignal(false);
  useVisibleTask$(async () => {
    setInterval(async () => {
      const res = await fetch("http://my.stats:5051/api");
      const data = await res.json();
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
      if (showGroupView.value) {
        for (let i = data.Users.length; i-- > 0; ) {
          const gn = data.Users[i].Name.split("-")[0];
          if (groups.value[gn]) groups.value[gn].push(data.Users[i]);
          else groups.value[gn] = [data.Users[i]];
        }
        console.log(groups.value);
      } else {
        users.value = data.Users;
        console.log(users.value);
      }
      isAdmin.value = data.isAdmin;
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
      <div
        class="bg-orange-500 rounded mb-8"
        onClick$={() => (showGroupView.value = !showGroupView.value)}
      >
        change view
      </div>
      {showGroupView.value
        ? users.value.map((u, i) => (
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
          ))
        : Object.values(groups.value).map((g) => (
            <div>
              {g[0].Name.split("-")[0]}
              {g.map((u) => (
                <div>{u.Name}</div>
              ))}
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
