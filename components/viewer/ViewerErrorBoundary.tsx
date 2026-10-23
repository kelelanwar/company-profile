"use client";

import { Component, type ReactNode } from "react";

type Props = {
  title: string;
  body: string;
  children: ReactNode;
};

type State = { failed: boolean };

/** Keeps a failed WebGL/GLTF/texture load from blanking the whole panel. */
export class ViewerErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 grid place-items-center bg-carbone px-6 text-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-copper">
              {this.props.title}
            </p>
            <p className="mt-3 max-w-sm text-sm text-muted">{this.props.body}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
