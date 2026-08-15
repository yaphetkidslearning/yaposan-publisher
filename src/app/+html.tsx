import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
