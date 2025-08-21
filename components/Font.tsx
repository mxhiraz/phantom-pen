import { createReactStyleSpec } from "@blocknote/react";

import { Raleway } from "next/font/google";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const Font = createReactStyleSpec(
  {
    type: "font",
    propSchema: "string",
  },
  {
    render: (props) => (
      <span
        style={{ fontFamily: raleway.style.fontFamily }}
        ref={props.contentRef}
      />
    ),
  }
);
