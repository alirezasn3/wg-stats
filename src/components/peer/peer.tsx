import { component$ } from "@builder.io/qwik";

interface PeerProps {
  name: string;
  totalRx: number;
  totalTx: number;
  latestHandshake: number;
  allowedIps: string;
  expiresAt: number;
  currentRx: number;
  currentTx: number;
  index: number;
  isAdmin: boolean;
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

export default component$<PeerProps>((p) => {
  return (
    <div
      key={p.index}
      class="px-3 py-2 my-2 bg-slate-900 border-2 border-slate-800 rounded"
    >
      {p.index + 1}. {p.name}
      <div class="w-full h-[1px] bg-slate-800 my-2" />
      <div class="flex justify-between items-center">
        <div class="flex items-center text-green-500">
          <img
            src="download.png"
            alt="download icon"
            class="invert w-5 h-5 mr-0.5"
          />
          {(p.currentRx / 1000).toFixed(2)} KiB/s
        </div>
        <div class="flex text-green-500 items-center">
          <div class="flex items-center">
            <img
              src="download.png"
              alt="download icon"
              class="invert 2-5 h-5 mr-0.5"
            />
            {(p.totalRx / 1000000000).toFixed(2)} GiB
          </div>
          <div class="border-l-2 border-slate-800 pl-0.5 ml-1 flex items-center">
            <img
              src="upload.png"
              alt="upload icon"
              class="invert 2-5 h-5 mr-0.5"
            />
            {(p.totalTx / 1000000000).toFixed(2)} GiB
          </div>
        </div>
      </div>
      <div class="w-full h-[1px] bg-slate-800 my-2"></div>
      <div class="truncate text-blue-500">
        <span class="text-white">Latest Handshake: </span>
        {formatTime(p.latestHandshake)}
      </div>
      <div class="w-full h-[1px] bg-slate-800 my-2"></div>
      <div class="flex justify-between items-center">
        <div>
          <span class="text-white">Expires In: </span>
          <span
            class="text-blue-500"
            title={new Date(p.expiresAt * 1000).toLocaleDateString()}
          >
            {p.expiresAt
              ? Math.ceil((p.expiresAt - Date.now() / 1000) / 86400)
              : "?"}{" "}
            days
          </span>
        </div>
        <div class={`${p.isAdmin ? "flex" : "hidden"} items-center`}>
          <img
            onClick$={() =>
              fetch("http://my.stats:5051/api", {
                method: "POST",
                body: JSON.stringify({
                  Name: p.name,
                  ExpiresAt: p.expiresAt + 24 * 3600,
                }),
              })
            }
            src="add.png"
            alt="add icon"
            class="mr-4 invert w-6 h-6 border-black border-2 rounded-full hover:cursor-pointer"
          />
          <img
            onClick$={() =>
              fetch("http://my.stats:5051/api", {
                method: "POST",
                body: JSON.stringify({
                  Name: p.name,
                  ExpiresAt: p.expiresAt - 24 * 3600,
                }),
              })
            }
            src="remove.png"
            alt="remove icon"
            class="invert w-6 h-6 border-black border-2 rounded-full hover:cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
});