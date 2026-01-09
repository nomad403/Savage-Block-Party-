declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

declare namespace React {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    className?: string;
    [key: string]: any;
  }
  
  interface DOMAttributes<T> {
    [key: string]: any;
  }
  
  type DetailedHTMLProps<E, T> = E & {
    ref?: any;
  };
}

