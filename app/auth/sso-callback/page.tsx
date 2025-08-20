import { Spinner } from "@/components/whisper-page/LoadingSection";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function Page() {
  // Handle the redirect flow by calling the Clerk.handleRedirectCallback() method
  // or rendering the prebuilt <AuthenticateWithRedirectCallback/> component.
  // This is the final step in the custom OAuth flow.
  return (
    <div className=" min-h-screen flex items-center justify-center ">
      <Spinner />
      <AuthenticateWithRedirectCallback />
      <div id="clerk-captcha"></div>
    </div>
  );
}
