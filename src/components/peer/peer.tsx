import { component$, useSignal } from "@builder.io/qwik";

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
  const remainingDays = useSignal(
    Math.ceil((p.expiresAt - Date.now() / 1000) / 86400).toString()
  );
  const editingDate = useSignal(false);
  return (
    <div class="px-3 py-2 my-2 bg-slate-900 border-2 border-slate-800 rounded">
      {p.index + 1}. {p.name}
      <div class="w-full h-[1px] bg-slate-800 my-2" />
      <div class="flex flex-col md:flex-row md:justify-between md:items-center">
        <div class="mb-3 md:mb-0 flex items-center justify-between text-green-500">
          <span class="text-slate-100 inline md:hidden">Current: </span>
          <div class="flex items-center">
            <div class="flex items-center">
              <img
                src="download.png"
                alt="download icon"
                class="invert w-5 h-5 mr-0.5"
              />
              {p.currentRx > 1000000
                ? (p.currentRx / 1000000).toFixed(2) + " MiB/s"
                : p.currentRx > 1000
                ? (p.currentRx / 1000).toFixed(2) + " KiB/s"
                : p.currentRx + " Bytes/s"}
            </div>
            <div class="border-l-2 border-slate-800 pl-0.5 ml-1 flex items-center">
              <img
                src="upload.png"
                alt="upload icon"
                class="invert w-5 h-5 mr-0.5"
              />
              {p.currentTx > 1000000
                ? (p.currentTx / 1000000).toFixed(2) + " MiB/s"
                : p.currentTx > 1000
                ? (p.currentTx / 1000).toFixed(2) + " KiB/s"
                : p.currentTx + " Bytes/s"}
            </div>
          </div>
        </div>
        <div class="flex text-green-500 items-center justify-between">
          <span class="text-slate-100 inline md:hidden">Total: </span>
          <div class="flex items-center">
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
      </div>
      <div class="w-full h-[1px] bg-slate-800 my-2"></div>
      <div class="truncate text-blue-500">
        <div class="text-white mb-3 md:mb-0 md:inline">Latest Handshake: </div>
        {formatTime(p.latestHandshake)}
      </div>
      <div class="w-full h-[1px] bg-slate-800 my-2"></div>
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <span class="text-white">Expires In: </span>
          {editingDate.value ? (
            <input
              bind:value={remainingDays}
              type="number"
              class="text-slate-900 px-1 mx-1 rounded max-w-[100px] h-full"
            />
          ) : (
            <span
              class={`${
                Number(remainingDays.value) > 0
                  ? "text-blue-500"
                  : "text-red-500"
              } px-1`}
              title={new Date(p.expiresAt * 1000).toLocaleDateString()}
            >
              {Math.abs(Number(remainingDays.value)) > 0
                ? remainingDays.value
                : Math.ceil(((p.expiresAt - Date.now() / 1000) / 3600) % 24)}
            </span>
          )}
          <span
            class={
              Number(remainingDays.value) > 0 ? "text-blue-500" : "text-red-500"
            }
            title={new Date(p.expiresAt * 1000).toLocaleDateString()}
          >
            {Math.abs(Number(remainingDays.value)) > 0 ? "days" : "hours"}
          </span>
        </div>
        <div class={`${p.isAdmin ? "flex" : "hidden"} items-center`}>
          <img
            onClick$={() => {
              if (editingDate.value) {
                const diff =
                  Number(remainingDays.value) -
                  Math.ceil((p.expiresAt - Date.now() / 1000) / 86400);
                if (diff != 0)
                  fetch("api", {
                    method: "POST",
                    body: JSON.stringify({
                      Name: p.name,
                      ExpiresAt: p.expiresAt + diff * 24 * 3600,
                    }),
                  });
              }
              editingDate.value = !editingDate.value;
            }}
            src={editingDate.value ? "done.png" : "edit.png"}
            alt={`${editingDate.value ? "edit" : "done"} icon`}
            class="mr-4 invert w-6 h-6 rounded-full hover:cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
});
