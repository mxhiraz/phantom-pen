import { SignIn } from "@clerk/nextjs";
import React from "react";

function page() {
  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <SignIn
        appearance={{
          variables: {
            colorShadow: "transparent",
          },
        }}
      />
    </div>
  );
}

export default page;
