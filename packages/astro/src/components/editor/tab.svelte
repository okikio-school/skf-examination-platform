<script lang="ts">
  import { setActive, activeTabId, removeTab } from "./state";

  import IconFluentDismiss24Filled from "~icons/fluent/dismiss24-filled";
  import FluentEmojiAdmissionTickets from "~icons/fluent-emoji/admission-tickets";

  export let index = 0;
  export let name = "Tab";
  export let updateView: () => void;
</script>

<button
  class="tab"
  class:active={$activeTabId == index}
  on:click={() => {
    setActive(index);
    updateView();
  }}
>
  <FluentEmojiAdmissionTickets />
  <section class="flex-grow">{name}</section>
  <button
    class="close-tab-btn"
    type="button"
    title="Close"
    on:click={() => {
      removeTab(index);
      updateView();
    }}
  >
    <IconFluentDismiss24Filled />
  </button>
</button>

<style>
  .tab {
    padding: 0.5rem 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    gap: 0.5rem;
  }

  .tab.active {
    background-color: aqua;
  }

  .close-tab-btn {
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
