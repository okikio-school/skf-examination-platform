import type { Extension } from "@codemirror/state";
import type { EditorView } from "codemirror";

import { Compartment } from "@codemirror/state";

/**
 * Creates a compartment instance with the given extension and appends it to the top-level configuration of the editor.
 * See {@link https://codemirror.net/examples/config/| CodeMirror Configuration} and {@link https://codemirror.net/docs/ref/#state.Compartment| Compartment} for details on editor configuration.
 * @param extension the extension to append
 */
export function createExtension(
  extension: Extension | Extension[],
  view?: EditorView
) {
  const compartment = new Compartment();

  /**
   * Reconfigures the extension compartment with the given extension.
   * @param extension the extension to reconfigure the extension compartment with.
   */
  function reconfigure(extension: Extension | Extension[], editorView = view) {
    if (!editorView) return;

    editorView.dispatch({
      effects: compartment.reconfigure(extension),
    });
  }

  return { compartment, reconfigure, extension };
}
