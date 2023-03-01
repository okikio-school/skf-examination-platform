<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { basicSetup } from "codemirror";

  import { tablist, activeTab, activeTabId } from "./state";

  import { oneDark, color } from "@codemirror/theme-one-dark";

  import { EditorState } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";

  import { createExtension } from "./codemirror";

  import Tabs from "./tabs.svelte";

  let ref: HTMLDivElement | undefined;
  let view: EditorView | undefined;

  const themeExt = createExtension(oneDark, view);
  const basicExt = createExtension(basicSetup, view);
  const updateExt = createExtension(
    EditorView.updateListener.of((update) => {
      if ($activeTab?.state) {
        $tablist[$activeTabId].state = update.state;
      }
    }),
    view
  );

  function updateView() {
    if (view && $activeTab) {
      if (!$activeTab?.state) {
        const state = EditorState.create({
          doc: $activeTab.value,
          extensions: [
            themeExt.extension,
            basicExt.extension,
            $activeTab.lang,
            updateExt.extension,
          ],
        });

        $tablist[$activeTabId].state = state;
      }

      if ($activeTab?.state) {
        view.setState($activeTab.state);
      }
    }
  }

  onMount(() => {
    view = new EditorView({
      parent: ref,
    });
    updateView();
  });

  onDestroy(() => {
    view?.destroy?.();
  });
</script>

<div class="editor" style:background-color={color.background}>
  <Tabs {updateView} />
  <div class="codemirror" bind:this={ref} />
</div>

<style>
  .editor {
    height: 100%;
    line-height: normal;
    font-family: "Courier New", Courier, monospace;
  }
</style>
