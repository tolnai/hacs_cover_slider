/* Minimum code from Home Assistant to create the action handler used in hui-generic-entity-row. */

import { noChange } from 'lit';
import { AttributePart, directive, Directive, DirectiveParameters } from 'lit/directive.js';

interface ActionHandler extends HTMLElement {
  holdTime: number;
  bind(element: Element, options?: ActionHandlerOptions): void;
}
interface ActionHandlerElement extends HTMLElement {
  actionHandler?: {
    options: ActionHandlerOptions;
    start?: (ev: Event) => void;
    end?: (ev: Event) => void;
    handleEnter?: (ev: KeyboardEvent) => void;
  };
}

interface ActionHandlerOptions {
  hasHold?: boolean;
  hasDoubleClick?: boolean;
  disabled?: boolean;
}

const getActionHandler = (): ActionHandler => {
  const existing = document.body.querySelector<ActionHandler>('action-handler');
  if (existing) {
    return existing;
  }
  const actionhandler = document.createElement('action-handler') as ActionHandler;
  document.body.appendChild(actionhandler);
  return actionhandler;
};

export const actionHandlerBind = (element: ActionHandlerElement, options?: ActionHandlerOptions) => {
  getActionHandler().bind(element, options);
};

export const actionHandler = directive(
  class extends Directive {
    update(part: AttributePart, [options]: DirectiveParameters<this>) {
      actionHandlerBind(part.element, options);
      return noChange;
    }

    render(_options?: ActionHandlerOptions) {
      return noChange;
    }
  },
);
