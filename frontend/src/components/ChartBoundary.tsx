"use client";

import { Component, type ReactNode } from "react";
import Icon from "./Icon";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches render errors in the chart so a chart failure never blanks the page. */
export default class ChartBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="banner caution" role="alert">
          <Icon name="error" />
          <p>
            <strong>The chart could not be rendered.</strong> The dataset loaded, but drawing
            this spectrum failed. Try selecting another spectrum, or reload the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
