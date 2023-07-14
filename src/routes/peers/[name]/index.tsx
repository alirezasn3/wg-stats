import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { Peer } from "~/routes";

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
    <>
      <div>{peer.value?.name}</div>
      <div>{peer.value?.allowedIps}</div>
      <div>{peer.value?.totalRx}</div>
      <div>{peer.value?.totalTx}</div>
    </>
  );
});
