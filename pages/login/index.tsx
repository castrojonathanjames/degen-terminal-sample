import "@farcaster/auth-kit/styles.css";
import React from "react";
import { UserAuthForm } from "@/common/components/UserAuthForm";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { Button } from "@/components/ui/button";
import { openWindow } from "@/common/helpers/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/router";
import FarcasterIcon from "@/common/components/icons/FarcasterIcon";

const authKitConfig = {
  rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  domain: "app.herocast.xyz",
};

export default function Login() {
  const router = useRouter();
  const signupOnly = router?.query?.signupOnly === "true";
  const renderAuthForm = () => (
      <div className="mt-10 text-lg text-foreground sm:mx-auto sm:w-full sm:max-w-md">
        <UserAuthForm signupOnly={signupOnly} />
      </div>
  );

  return (
      <AuthKitProvider config={authKitConfig}>
        <div className="w-full max-w-full min-h-screen flex items-center justify-center">
          <div
              className={clsx(
                  "mx-auto bg-gray-900 p-8 py-20 lg:py-36",
                  "w-full max-w-lg flex flex-col justify-center"
              )}
          >
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-5xl lg:text-3xl font-semibold tracking-tight text-gray-100">
                Welcome to herocast
              </h1>
              <p className="px-8 text-center text-md text-gray-400">
                Your herocast account can be used to connect multiple Farcaster accounts.
              </p>
            </div>
            {renderAuthForm()}
          </div>
        </div>
      </AuthKitProvider>
  );
}