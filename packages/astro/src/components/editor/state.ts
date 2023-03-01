import { derived, get, writable } from "svelte/store";

import { javascript } from "@codemirror/lang-javascript";
import { createModel, type IModel } from "./model";

export const initialValue = `const x = "Hello There";\nconsole.log(x)`;

const initialModel = createModel(
  initialValue,
  javascript({
    jsx: true,
    typescript: true,
  }),
  "./test.ts"
);
export const tablist = writable([initialModel]);

export const activeTabId = writable(0);
export const activeTab = derived(
  [tablist, activeTabId],
  ([$tablist, $activeId]) => $tablist[$activeId],
  initialModel
);
export const length = derived([tablist], ([$tablist]) => $tablist.length, 1);

export const addTab = (model: IModel) =>
  tablist.update((n) => {
    n.push(model);
    return n;
  });

export const removeTab = (index: number) => {
  return tablist.update((n) => {
    if (get(activeTabId) == index) {
      activeTabId.set(index - 1);
    }
    n.splice(index, 1);
    return n;
  });
};

export const setActive = (index: number) => activeTabId.set(index);
