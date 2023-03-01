<script lang="ts">
  import FluentAdd24Regular from "~icons/fluent/add-24-regular";

  import { addTab, tablist, setActive, length } from "./state";
  import { javascript } from "@codemirror/lang-javascript";

  import { createModel } from "./model";

  import Tab from "./tab.svelte";
  export let updateView: () => void;
</script>

<div class="tab-bar">
  <div class="tab-list">
    {#each $tablist as tabvalue, index}
      <Tab {index} name={tabvalue.url.toString()} {updateView} />
    {/each}
  </div>

  <button
    type="button"
    class="add-tab-btn"
    on:click={() => {
      const model = createModel(
        `const x = \`./test${$length + 1}.ts\`;\nconsole.log(x)`,
        javascript({
          jsx: true,
          typescript: true,
        }),
        `./test${$length + 1}.ts`
      );

      addTab(model);
      setActive($length - 1);
      updateView();
    }}
  >
    <FluentAdd24Regular />
  </button>
</div>

<style>
  .tab-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    overflow-x: auto;
  }

  .tab-list {
    display: flex;
    flex-direction: row;
  }

  .add-tab-btn {
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
